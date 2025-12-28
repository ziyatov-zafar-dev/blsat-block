
import { msgApi } from './api';
import { ResponseDto, Chat, Message, Attachment } from '../types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import { MSG_WS_URL, MSG_BASE_URL, MSG_WS_PATH } from '../config/constants';
import { authApi } from './api';

const resolveSockJsUrl = () => {
  const fallback = `http://localhost:8083${MSG_WS_PATH}`;
  try {
    const raw = MSG_WS_URL || `${MSG_BASE_URL}${MSG_WS_PATH}`;
    const url = new URL(raw);
    // SockJS expects http/https URL; adjust if ws/wss was provided
    if (url.protocol.startsWith('ws')) {
      url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    }
    return url.toString();
  } catch {
    return fallback;
  }
};

const WS_HTTP_URL = resolveSockJsUrl();

export const messageService = {
  getChats: () => msgApi.get<ResponseDto<{ chats: Chat[]; totalUnread?: number }>>('/api/chats'),
  getMessages: (chatId: string) => msgApi.get<ResponseDto<Message[]>>(`/api/chats/${chatId}/messages`),
  getMessageById: (messageId: string) => msgApi.get<ResponseDto<Message>>(`/api/chats/messages/${messageId}`),
  deleteMessage: (messageId: string) => msgApi.delete<ResponseDto<{ message: string }>>(`/api/chats/messages/${messageId}`),
  editMessage: (messageId: string, newContent: string) =>
    msgApi.patch<ResponseDto<Message>>(`/api/chats/messages/${messageId}`, newContent, {
      headers: { 'Content-Type': 'text/plain' },
    }),
  downloadAttachment: async (messageId: string) => {
    const res = await msgApi.get<Blob>(`/api/chats/messages/${messageId}/download`, {
      responseType: 'blob',
    });
    return res;
  },
  deleteChat: (chatId: string) => msgApi.delete<ResponseDto<{ message: string }>>(`/api/chats/${chatId}`),
  // Send message with optional attachment via REST. Uses JSON when no files, FormData when a file is present.
  sendMessageRest: (payload: {
    receiverId: string;
    content?: string;
    type?: Message['type'];
    replyToMessageId?: string | null;
    system?: boolean;
    attachmentDurationMs?: number;
    attachment?: File | null;
    onUploadProgress?: (event: ProgressEvent) => void;
  }) => {
    const basePayload: any = {
      receiverId: payload.receiverId,
    };
    if (payload.content) basePayload.content = payload.content;
    if (payload.type) basePayload.type = payload.type;
    if (payload.replyToMessageId) basePayload.replyToMessageId = payload.replyToMessageId;
    if (typeof payload.system === 'boolean') basePayload.system = payload.system;
    if (payload.attachmentDurationMs !== undefined) basePayload.attachmentDurationMs = payload.attachmentDurationMs;

    if (payload.attachment) {
      const form = new FormData();
      form.append('payload', new Blob([JSON.stringify(basePayload)], { type: 'application/json' }));
      form.append('file', payload.attachment);
      return msgApi.post<ResponseDto<Message>>('/api/chats/send', form, {
        onUploadProgress: payload.onUploadProgress,
      });
    }
    // JSON payload when no binary attachment
    return msgApi.post<ResponseDto<Message>>('/api/chats/send', basePayload, {
      onUploadProgress: payload.onUploadProgress,
    });
  },
  subscribePush: (subscription: any) => 
    msgApi.post<ResponseDto>('/api/push/subscribe', subscription),
  // Fetch profile of a user by id (for right panel)
  getUserById: (userId: string) => authApi.get<ResponseDto<any>>(`/api/users/user-by-id`, { params: { userid: userId } }),
};

// WebSocket Client Management
let stompClient: Client | null = null;
let reconnectTimer: any = null;
let reconnectAttempts = 0;
let lastOnMessage: ((msg: Message) => void) | null = null;
let lastOnTyping: ((typing: { senderId: string; typing: boolean; type?: string; status?: string }) => void) | null = null;
let lastOnChatDeleted: ((payload: { chatId: string; deletedBy: string; at: string }) => void) | null = null;
let lastOnMessageEdited: ((payload: { message: Message }) => void) | null = null;
let lastOnMessageDeleted: ((payload: { messageId: string; chatId: string }) => void) | null = null;

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  const delays = [2000, 5000, 10000];
  const delay = delays[Math.min(reconnectAttempts, delays.length - 1)];
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempts += 1;
    if (lastOnMessage && lastOnTyping) {
      connectStomp(
        lastOnMessage,
        lastOnTyping,
        lastOnChatDeleted || undefined,
        lastOnMessageEdited || undefined,
        lastOnMessageDeleted || undefined
      );
    }
  }, delay);
};

export const connectStomp = (
  onMessage: (msg: Message) => void,
  onTyping: (typing: { senderId: string; typing: boolean; type?: string; status?: string }) => void,
  onChatDeleted?: (payload: { chatId: string; deletedBy: string; at: string }) => void,
  onMessageEdited?: (payload: { message: Message }) => void,
  onMessageDeleted?: (payload: { messageId: string; chatId: string }) => void
) => {
  const { accessToken, user } = useAuthStore.getState();
  if (!accessToken || !user) return;
  if (stompClient?.active) return;

  lastOnMessage = onMessage;
  lastOnTyping = onTyping;
  lastOnChatDeleted = onChatDeleted || null;
  lastOnMessageEdited = onMessageEdited || null;
  lastOnMessageDeleted = onMessageDeleted || null;
  reconnectAttempts = 0;

  stompClient = new Client({
    // SockJS transport (server exposes /ws with SockJS)
    webSocketFactory: () => new SockJS(WS_HTTP_URL),
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    reconnectDelay: 3000, // basic backoff for dev
    debug: (str) => console.log(str),
    onConnect: () => {
      console.log('STOMP Connected');
      reconnectAttempts = 0;
      
      // Personal queue subscriptions
      stompClient?.subscribe('/user/queue/messages', (msg) => {
        if (!msg.body) return;
        try {
          onMessage(JSON.parse(msg.body));
        } catch (e) {
          console.error('Failed to parse message payload', e);
        }
      });

      // Fallback topic subscription for messages
      stompClient?.subscribe(`/topic/users/${user.id}/messages`, (msg) => {
        if (!msg.body) return;
        try {
          onMessage(JSON.parse(msg.body));
        } catch (e) {
          console.error('Failed to parse message payload (topic)', e);
        }
      });
      
      stompClient?.subscribe('/user/queue/typing', (msg) => {
        if (!msg.body) return;
        try {
          onTyping(JSON.parse(msg.body));
        } catch (e) {
          console.error('Failed to parse typing payload', e);
        }
      });

      // Fallback topic subscription for typing
      stompClient?.subscribe(`/topic/users/${user.id}/typing`, (msg) => {
        if (!msg.body) return;
        try {
          onTyping(JSON.parse(msg.body));
        } catch (e) {
          console.error('Failed to parse typing payload (topic)', e);
        }
      });

      stompClient?.subscribe('/user/queue/notifications', (msg) => {
        console.log('Notification:', JSON.parse(msg.body));
      });

      if (onChatDeleted) {
        stompClient?.subscribe('/user/queue/chat-deleted', (msg) => {
          if (!msg.body) return;
          try {
            onChatDeleted(JSON.parse(msg.body));
          } catch (e) {
            console.error('Failed to parse chat-deleted payload', e);
          }
        });
        stompClient?.subscribe(`/topic/users/${user.id}/chat-deleted`, (msg) => {
          if (!msg.body) return;
          try {
            onChatDeleted(JSON.parse(msg.body));
          } catch (e) {
            console.error('Failed to parse chat-deleted payload (topic)', e);
          }
        });
      }

      if (onMessageEdited) {
        stompClient?.subscribe('/user/queue/message-edited', (msg) => {
          if (!msg.body) return;
          try {
            onMessageEdited(JSON.parse(msg.body));
          } catch (e) {
            console.error('Failed to parse message-edited payload', e);
          }
        });
        stompClient?.subscribe(`/topic/users/${user.id}/message-edited`, (msg) => {
          if (!msg.body) return;
          try {
            onMessageEdited(JSON.parse(msg.body));
          } catch (e) {
            console.error('Failed to parse message-edited payload (topic)', e);
          }
        });
      }

      if (onMessageDeleted) {
        stompClient?.subscribe('/user/queue/message-deleted', (msg) => {
          if (!msg.body) return;
          try {
            onMessageDeleted(JSON.parse(msg.body));
          } catch (e) {
            console.error('Failed to parse message-deleted payload', e);
          }
        });
        stompClient?.subscribe(`/topic/users/${user.id}/message-deleted`, (msg) => {
          if (!msg.body) return;
          try {
            onMessageDeleted(JSON.parse(msg.body));
          } catch (e) {
            console.error('Failed to parse message-deleted payload (topic)', e);
          }
        });
      }
    },
    onStompError: (frame) => {
      console.error('STOMP Error', frame);
      scheduleReconnect();
    },
    onWebSocketClose: (evt) => {
      console.warn('STOMP socket closed', evt.reason || evt.code);
      scheduleReconnect();
    },
    onWebSocketError: (evt) => {
      console.error('STOMP socket error', evt);
      scheduleReconnect();
    }
  });

  stompClient.activate();
};

export const disconnectStomp = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  stompClient?.deactivate();
  stompClient = null;
};

export const sendStompMessage = (payload: {
  receiverId: string;
  content?: string;
  type?: Message['type'];
  replyToMessageId?: string | null;
  system?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentMimeType?: string;
  attachmentDurationMs?: number;
}) => {
  // STOMP payload carries metadata/URLs; binary upload should happen via REST before calling this
  stompClient?.publish({
    destination: '/app/send',
    body: JSON.stringify(payload),
  });
};

export type TypingStatus =
  | 'WRITING_TEXT'
  | 'WRITING_VOICE'
  | 'SENDING_VOICE'
  | 'SENDING_AUDIO'
  | 'SENDING_VIDEO'
  | 'SENDING_PHOTO'
  | 'SENDING_FILE';

export const sendStompTyping = (receiverId: string, typing: boolean, status?: TypingStatus | null) => {
  const mapType = (st?: TypingStatus | null) => {
    switch (st) {
      case 'WRITING_TEXT': return 'TEXT';
      case 'WRITING_VOICE': return 'VOICE';
      case 'SENDING_VOICE': return 'VOICE';
      case 'SENDING_AUDIO': return 'AUDIO';
      case 'SENDING_VIDEO': return 'VIDEO';
      case 'SENDING_PHOTO': return 'IMAGE';
      case 'SENDING_FILE': return 'FILE';
      default: return undefined;
    }
  };
  try {
    if (!stompClient || !stompClient.connected) {
      console.warn('sendStompTyping skipped: STOMP not connected');
      return;
    }
    stompClient.publish({
      destination: '/app/typing',
      body: JSON.stringify({ receiverId, typing, status: status || undefined, type: mapType(status) }),
    });
  } catch (err) {
    console.warn('sendStompTyping failed', err);
  }
};

export const sendChatDeletedEvent = (payload: { chatId: string; deletedBy?: string }) => {
  stompClient?.publish({
    destination: '/app/chat-deleted',
    body: JSON.stringify(payload),
  });
};
