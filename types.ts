
export interface ResponseDto<T = any> {
  success: boolean;
  message: string;
  code: number;
  errorCode?: string;
  data: T;
}

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: string[];
  emailVerified: boolean;
  active: boolean;
  avatarUrl?: string;
  avatarName?: string;
  avatarFilePath?: string;
  avatarSize?: number;
  avatarSizeMB?: number;
  birthDate?: string;
  lastOnline?: string;
  online: boolean;
  socialLinks?: Record<string, string>;
}

export interface Chat {
  id: string;
  chatId?: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  lastMessageAt: string;
  unreadCount?: number;
  lastMessage?: Message;
  otherUser?: Partial<User>; // Aggregated for UI
}

export interface Message {
  messageId: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  // Backend "type" field for rendering decisions
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VIDEO_NOTE' | 'AUDIO' | 'VOICE' | 'FILE' | 'SYSTEM';
  // Optional link to the original message when replying
  replyToMessageId?: string | null;
  // Mark system-generated messages
  system?: boolean;
  // Attachment metadata returned by the API
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentMimeType?: string;
  attachmentDurationMs?: number;
  // Optional richer attachments array for future expansion
  attachments?: Attachment[];
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  deviceId: string | null;
  user: User | null;
}

export interface TypingResponse {
  senderId: string;
  typing: boolean;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'voice' | 'file';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  durationSeconds?: number;
}
