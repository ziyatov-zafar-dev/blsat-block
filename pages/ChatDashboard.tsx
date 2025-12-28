import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Search, MoreVertical, LogOut, User as UserIcon, Settings, Smile, Phone, Video, Pin, ArrowDown, X, Mic, Square, Paperclip, Pause, Play, Trash2, Eye, Folder, ExternalLink, BellOff, CircleDot, Check, CheckCheck, Reply, Sun, Moon, SkipForward, SkipBack, Volume2, ListMusic } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { messageService, connectStomp, disconnectStomp, sendStompMessage, sendStompTyping, sendChatDeletedEvent, TypingStatus } from '../services/messageService';
import { Chat, Message, User } from '../types';
import { formatTime, formatLastSeen, cn } from '../lib/utils';

class ChatErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.error('Chat error boundary caught', err);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-center text-sm text-red-600">Chatni yuklashda xatolik. Sahifani yangilang.</div>;
    }
    return this.props.children;
  }
}

const ChatDashboardInner: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams<{ chatId?: string }>();
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  const isDark = theme === 'dark';

  const [messageInput, setMessageInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fileModal, setFileModal] = useState<{ file: File; caption: string } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isSystemMessage, setIsSystemMessage] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCaption, setPreviewCaption] = useState('');
  const [previewCompress, setPreviewCompress] = useState(true);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, { percent: number; loaded?: number; total?: number; name?: string }>>({});
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const recordStartRef = useRef<number>(0);
  const [voiceDraft, setVoiceDraft] = useState<{ file: File; url: string; durationMs: number } | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const voiceCancelRef = useRef(false);
  const voiceSendAfterStopRef = useRef(false);
  const [isPausedRecording, setIsPausedRecording] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeDataRef = useRef<Uint8Array | null>(null);
  const voiceLevelRafRef = useRef<number | null>(null);
  const [voiceCaption, setVoiceCaption] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showPlayerQueue, setShowPlayerQueue] = useState(false);
  const [playerChatId, setPlayerChatId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('activeAudioChatId');
  });
  const playerRef = useRef<HTMLDivElement | null>(null);
  const activeQueueRef = useRef<{ chatId: string | null; items: { id: string; url: string; label: string }[] }>({ chatId: null, items: [] });
  const [activeQueueSnapshot, setActiveQueueSnapshot] = useState<{ chatId: string | null; items: { id: string; url: string; label: string }[] }>({ chatId: null, items: [] });
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const hasTypedText = messageInput.trim().length > 0;
  const [toastMessage, setToastMessage] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(null);
  const [messageMenu, setMessageMenu] = useState<{ message: Message; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioMsgRef = useRef<string | null>(null);
  const activeAudioChatIdRef = useRef<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, { current: number; duration: number; playing: boolean }>>({});
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({});
  const activeAudioMessageIdRef = useRef<string | null>(null);
  const currentQueueChatIdRef = useRef<string | null>(null);
  const [activeAudioMeta, setActiveAudioMeta] = useState<{ url: string; label: string; messageId?: string | null; chatId?: string | null } | null>(null);
  const [attachmentPreviews, setAttachmentPreviews] = useState<Record<string, string>>({});
  const [attachmentDurations, setAttachmentDurations] = useState<Record<string, number>>({});
  const [voiceSending, setVoiceSending] = useState(false);
  const [typingType, setTypingType] = useState<Record<string, TypingStatus | undefined>>({});

  const MAX_MESSAGE_LEN = 4096;
  const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB
  const [errorMessage, setErrorMessage] = useState('');

  const parseEmojiOnly = (text: string) => {
    if (!text) return { onlyEmoji: false, count: 0 };
    const trimmed = text.trim();
    if (!trimmed) return { onlyEmoji: false, count: 0 };
    const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const matches = trimmed.match(emojiRegex) || [];
    const onlyEmoji = matches.length > 0 && matches.join('') === trimmed.replace(/\s+/g, '');
    return { onlyEmoji, count: matches.length };
  };

  const chunkText = (text: string, size: number) => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks.length ? chunks : [''];
  };

  const Spoiler: React.FC<{ text: string }> = ({ text }) => {
    const [hidden, setHidden] = useState(true);
    const toggle = () => setHidden((v) => !v);
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="relative inline-block align-middle cursor-pointer select-none"
      >
        <span
          className="inline-block rounded-md px-1 transition-all"
          style={
            hidden
              ? {
                filter: 'blur(4px)',
                backgroundColor: 'rgba(122,140,166,0.35)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.35) inset',
                backdropFilter: 'blur(2px)',
              }
              : { filter: 'none' }
          }
        >
          {text}
        </span>
        {hidden && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-md opacity-70"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 2px, transparent 2px, transparent 4px)',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </span>
    );
  };

  const renderInline = (text: string): React.ReactNode[] => {
    const tokens = text.split(/(\|\|.*?\|\||\*\*.*?\*\*|__.*?__|--.*?--)/g).filter(Boolean);
    const renderMentions = (t: string, keyPrefix: string) => {
      return t.split(/(@[a-zA-Z0-9._]+)/g).filter(Boolean).map((part, idx) => {
        if (part.startsWith('@') && part.length > 1) {
          const username = part.slice(1);
          return (
            <button
              key={`${keyPrefix}-mention-${idx}`}
              type="button"
              onClick={() => handleMentionClick(username)}
              className="text-sky-600 hover:text-sky-700 font-semibold underline-offset-2 hover:underline transition-colors"
            >
              {part}
            </button>
          );
        }
        return <React.Fragment key={`${keyPrefix}-text-${idx}`}>{part}</React.Fragment>;
      });
    };

    return tokens.map((tok, idx) => {
      if (tok.startsWith('||') && tok.endsWith('||')) {
        return <Spoiler key={idx} text={tok.slice(2, -2)} />;
      }
      if (tok.startsWith('**') && tok.endsWith('**')) {
        return <strong key={idx}>{renderMentions(tok.slice(2, -2), `bold-${idx}`)}</strong>;
      }
      if (tok.startsWith('__') && tok.endsWith('__')) {
        return <em key={idx} className="italic">{renderMentions(tok.slice(2, -2), `italic-${idx}`)}</em>;
      }
      if (tok.startsWith('--') && tok.endsWith('--')) {
        return <del key={idx}>{renderMentions(tok.slice(2, -2), `del-${idx}`)}</del>;
      }
      return <React.Fragment key={idx}>{renderMentions(tok, `plain-${idx}`)}</React.Fragment>;
    });
  };

  const renderFormatted = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeRegex.exec(text)) !== null) {
      const [full, lang, code] = match;
      if (match.index > lastIndex) {
        parts.push(...renderInline(text.slice(lastIndex, match.index)));
      }
      const langLabel = (lang || 'code').toString().toLowerCase();
      parts.push(
        <div
          key={parts.length}
          className="bg-[#0f172a] text-slate-100 font-mono text-xs md:text-sm rounded-xl border border-slate-700 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/60">
            <span className="text-[10px] uppercase tracking-wide text-slate-300 font-semibold">{langLabel}</span>
            <button
              type="button"
              onClick={() => navigator?.clipboard?.writeText(code).catch(() => { })}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-100 px-2 py-1 rounded-md border border-slate-600 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="px-3 py-2 whitespace-pre-wrap overflow-x-auto">
            <code>{renderHighlightedCode(lang, code)}</code>
          </pre>
        </div>
      );
      lastIndex = match.index + full.length;
    }
    if (lastIndex < text.length) {
      parts.push(...renderInline(text.slice(lastIndex)));
    }
    return parts;
  };

  const renderHighlightedCode = (langRaw: string | undefined, code: string) => {
    const aliases: Record<string, string> = {
      cpp: 'cpp', 'c++': 'cpp', cc: 'cpp', hpp: 'cpp', c: 'c',
      objc: 'objectivec', 'objective-c': 'objectivec', objectivec: 'objectivec', 'objective-cpp': 'objectivec',
      java: 'java', kotlin: 'kotlin', kt: 'kotlin', scala: 'scala', groovy: 'groovy', 'groovy-script': 'groovy',
      csharp: 'csharp', cs: 'csharp', 'c#': 'csharp', dotnet: 'csharp', fsharp: 'fsharp', fs: 'fsharp', vbnet: 'vbnet',
      go: 'go', golang: 'go', rust: 'rust', rs: 'rust', zig: 'zig', nim: 'nim', crystal: 'crystal', vala: 'vala', dlang: 'd', d: 'd',
      python: 'python', py: 'python', micropython: 'python',
      ruby: 'ruby', rb: 'ruby',
      php: 'php', hack: 'hack',
      pl: 'perl', perl: 'perl',
      lua: 'lua', luajit: 'lua',
      dart: 'dart', swift: 'swift', julia: 'julia', r: 'r',
      matlab: 'matlab', octave: 'matlab',
      haskell: 'haskell', hs: 'haskell', elixir: 'elixir', ex: 'elixir', exs: 'elixir', erlang: 'erlang',
      ocaml: 'ocaml', reasonml: 'reasonml', clojure: 'clojure', clj: 'clojure', commonlisp: 'lisp', cl: 'lisp', scheme: 'scheme', racket: 'racket',
      javascript: 'javascript', js: 'javascript', typescript: 'typescript', ts: 'typescript', coffeescript: 'coffeescript', livescript: 'livescript',
      html: 'html', xml: 'xml', svg: 'xml', xsd: 'xml', xsl: 'xml',
      css: 'css', scss: 'scss', sass: 'scss', less: 'less', stylus: 'stylus', styl: 'stylus', postcss: 'css',
      pug: 'pug', handlebars: 'handlebars', hbs: 'handlebars', ejs: 'ejs',
      bash: 'bash', sh: 'bash', zsh: 'bash', fish: 'bash', ksh: 'bash', awk: 'awk', sed: 'sed',
      powershell: 'powershell', ps1: 'powershell', pwsh: 'powershell',
      cmd: 'batch', bat: 'batch', batch: 'batch',
      yaml: 'yaml', yml: 'yaml', 'k8s-yaml': 'yaml', k8s: 'yaml',
      json: 'json', json5: 'json',
      properties: 'properties', toml: 'toml', ini: 'ini', cfg: 'ini', conf: 'ini', env: 'env', dotenv: 'env',
      sql: 'sql', mysql: 'sql', postgresql: 'sql', postgres: 'sql', tsql: 'sql', plsql: 'sql', sqlite: 'sql',
      mongodb: 'json', redis: 'json', cassandra: 'json', couchdb: 'json',
      graphql: 'graphql', cypher: 'cypher', gremlin: 'gremlin', sparql: 'sparql',
      dockerfile: 'docker', 'docker-compose': 'yaml', kubernetes: 'yaml', helm: 'yaml',
      terraform: 'terraform', hcl: 'terraform', pulumi: 'terraform',
      ansible: 'yaml', chef: 'ruby', puppet: 'puppet',
      jenkinsfile: 'groovy', 'github-actions': 'yaml', 'gitlab-ci': 'yaml', circleci: 'yaml', travisci: 'yaml',
      make: 'make', makefile: 'make', cmake: 'cmake', meson: 'meson', ninja: 'ninja', bazel: 'bazel', ant: 'ant',
      maven: 'xml', gradle: 'groovy', 'gradle-kotlin': 'kotlin', sbt: 'scala',
      markdown: 'markdown', md: 'markdown', mdx: 'markdown', asciidoc: 'markdown', rst: 'markdown', latex: 'latex', tex: 'latex', bibtex: 'latex',
      protobuf: 'protobuf', proto: 'protobuf', avro: 'protobuf', thrift: 'protobuf', capnproto: 'protobuf',
      openapi: 'yaml', swagger: 'yaml', raml: 'yaml', asyncapi: 'yaml',
      solidity: 'solidity', vyper: 'vyper', move: 'move', cairo: 'cairo',
      hlsl: 'glsl', glsl: 'glsl', wgsl: 'glsl', metal: 'glsl', cuda: 'cuda', opencl: 'opencl',
      gdscripts: 'gdscripts', gdshader: 'gdshader', unityshader: 'glsl',
      vhdl: 'vhdl', verilog: 'verilog', systemverilog: 'verilog',
      cobol: 'cobol', fortran: 'fortran', ada: 'ada', scratch: 'scratch', smalltalk: 'smalltalk', abap: 'abap', apex: 'apex', foxpro: 'foxpro',
      qsharp: 'qsharp', chapel: 'chapel', red: 'red', pony: 'pony', io: 'io', factor: 'factor', oz: 'oz', eiffel: 'eiffel', ring: 'ring', monkeyc: 'monkeyc', ncl: 'ncl', 'groovy-dsl': 'groovy',
    };

    const keywordSets: Record<string, string[]> = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'from', 'export', 'class', 'new', 'try', 'catch', 'await', 'async'],
      typescript: ['interface', 'type', 'implements', 'extends', 'public', 'private', 'protected', 'readonly', 'enum', 'namespace', 'abstract'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'new', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'import', 'package'],
      kotlin: ['fun', 'val', 'var', 'class', 'object', 'interface', 'data', 'sealed', 'when', 'is', 'in', 'return', 'import', 'package'],
      scala: ['class', 'object', 'trait', 'def', 'val', 'var', 'new', 'if', 'else', 'for', 'match', 'case', 'implicit'],
      groovy: ['def', 'class', 'interface', 'trait', 'import', 'package', 'return', 'if', 'else', 'for', 'while', 'new'],
      cpp: ['int', 'float', 'double', 'bool', 'char', 'class', 'struct', 'namespace', 'using', 'std', 'public', 'private', 'protected', 'virtual', 'override', 'const', 'auto', 'return', 'if', 'else', 'for', 'while', 'new', 'delete'],
      c: ['int', 'float', 'double', 'char', 'void', 'struct', 'typedef', 'return', 'if', 'else', 'for', 'while', 'sizeof', 'switch', 'case'],
      csharp: ['public', 'private', 'protected', 'class', 'interface', 'struct', 'namespace', 'using', 'static', 'readonly', 'async', 'await', 'var', 'new', 'return', 'if', 'else', 'for', 'while'],
      go: ['func', 'package', 'import', 'return', 'if', 'else', 'for', 'range', 'struct', 'interface', 'go', 'defer', 'chan', 'map'],
      rust: ['fn', 'let', 'mut', 'impl', 'trait', 'struct', 'enum', 'match', 'if', 'else', 'loop', 'for', 'while', 'use', 'pub', 'crate', 'mod', 'async', 'await'],
      zig: ['const', 'var', 'fn', 'pub', 'struct', 'enum', 'if', 'else', 'for', 'while', 'switch', 'return'],
      python: ['def', 'return', 'import', 'from', 'class', 'self', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as', 'lambda', 'async', 'await'],
      ruby: ['def', 'end', 'class', 'module', 'include', 'require', 'if', 'else', 'elsif', 'while', 'for', 'do', 'return'],
      php: ['function', 'public', 'private', 'protected', 'class', 'interface', 'trait', 'echo', 'return', 'if', 'else', 'elseif', 'while', 'for', 'foreach', 'new'],
      bash: ['if', 'then', 'else', 'fi', 'for', 'in', 'do', 'done', 'function', 'case', 'esac', 'while'],
      powershell: ['function', 'param', 'begin', 'process', 'end', 'if', 'else', 'foreach', 'return'],
      sql: ['select', 'insert', 'update', 'delete', 'create', 'alter', 'drop', 'where', 'join', 'on', 'group', 'by', 'order', 'limit', 'having', 'into', 'values'],
      html: ['<!DOCTYPE', '<html', '<head', '<body', '<div', '<span', '<script', '<style', '</'],
      css: ['color', 'background', 'display', 'flex', 'grid', 'padding', 'margin', 'font', 'border', 'position'],
      json: ['{', '}', '[', ']'],
      yaml: [':', '-'],
      xml: ['<?xml', '</', '<'],
      markdown: ['#', '##', '###', '**', '*', '-', '>'],
      default: ['if', 'else', 'for', 'while', 'return', 'class', 'func', 'function', 'def', 'var', 'let', 'const'],
    };

    const langToken = (langRaw || '').toLowerCase().trim();
    const resolved = aliases[langToken] || langToken;
    const keywords = keywordSets[resolved] || keywordSets.default;

    const tokens = code.split(/(\s+|\/\/.*|\/\*[\s\S]*?\*\/|"[^"\n]*"|'[^'\n]*'|`[^`\n]*`|\b\d+\.?\d*\b)/g).filter(Boolean);
    return tokens.map((t, i) => {
      if (/^\/\/.*/.test(t) || /^\/\*[\s\S]*\*\/$/.test(t)) {
        return <span key={i} className="text-emerald-300">{t}</span>;
      }
      if (/^["'`].*["'`]$/.test(t)) {
        return <span key={i} className="text-amber-300">{t}</span>;
      }
      if (/^\d+\.?\d*$/.test(t)) {
        return <span key={i} className="text-pink-300">{t}</span>;
      }
      if (keywords.includes(t)) {
        return <span key={i} className="text-sky-300 font-semibold">{t}</span>;
      }
      return <React.Fragment key={i}>{t}</React.Fragment>;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const selectedChatRef = useRef<Chat | null>(null);

  const updateChatsCache = (updater: (chats: Chat[], totalUnread: number) => { chats: Chat[]; totalUnread?: number }) => {
    queryClient.setQueryData(['chats'], (old: any) => {
      const prevChats = Array.isArray(old?.chats) ? old.chats : Array.isArray(old) ? old : [];
      const prevTotal = old?.totalUnread ?? 0;
      const next = updater(prevChats, prevTotal) || { chats: prevChats, totalUnread: prevTotal };
      return { chats: next.chats ?? prevChats, totalUnread: next.totalUnread ?? prevTotal };
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms || ms < 0) return '00:00';
    const total = Math.round(ms / 1000);
    const m = Math.floor(total / 60).toString(); // 0:11 format
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const shellClass = isDark ? "bg-[#0b1220] text-slate-100" : "bg-white text-slate-900";
  const panelClass = isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900";
  const subPanelClass = isDark ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-800";
  const bubbleBg = (isMe: boolean, isSystem: boolean, emoji: boolean) => {
    if (emoji) return "";
    if (isSystem) return isDark ? "bg-slate-800 text-amber-200 border border-amber-400/30" : "bg-white text-amber-800 border border-amber-200";
    if (isMe) return isDark ? "bg-sky-900/40 text-slate-100 border border-sky-800" : "bg-[#d2f8c6] text-slate-900 border border-[#b7ecb3]";
    return isDark ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-white text-slate-800 border border-slate-200";
  };
  const refreshChatsList = () => queryClient.invalidateQueries({ queryKey: ['chats'] });

  const insertEmoji = (emo: string) => {
    const el = messageInputRef.current;
    if (!el) {
      setMessageInput((prev) => (prev + emo).slice(0, MAX_MESSAGE_LEN));
      return;
    }
    const start = el.selectionStart ?? messageInput.length;
    const end = el.selectionEnd ?? messageInput.length;
    const next = (messageInput.slice(0, start) + emo + messageInput.slice(end)).slice(0, MAX_MESSAGE_LEN);
    setMessageInput(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + emo.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const getNextAudio = (currentId: string) => {
    const list = (activeAudioChatIdRef.current === activeQueueRef.current.chatId)
      ? (activeQueueRef.current.items || [])
      : [];
    const idx = list.findIndex((a) => a.id === currentId);
    if (idx >= 0 && idx < list.length - 1) return list[idx + 1];
    return null;
  };

  const getPrevAudio = (currentId: string) => {
    const list = (activeAudioChatIdRef.current === activeQueueRef.current.chatId)
      ? (activeQueueRef.current.items || [])
      : [];
    const idx = list.findIndex((a) => a.id === currentId);
    if (idx > 0) return list[idx - 1];
    return null;
  };

  const playPrevAudio = () => {
    const currentId = activeAudioMessageIdRef.current;
    if (!currentId) return;
    if (activeAudioChatIdRef.current !== currentQueueChatIdRef.current) return;
    const prev = getPrevAudio(currentId);
    if (prev?.url) {
      handlePlayPause(prev.url, prev.label || 'Audio', prev.id, activeAudioChatIdRef.current, false);
    }
  };

  const playNextAudio = () => {
    const currentId = activeAudioMessageIdRef.current;
    if (!currentId) return;
    if (activeAudioChatIdRef.current !== currentQueueChatIdRef.current) return;
    const next = getNextAudio(currentId);
    if (next?.url) {
      handlePlayPause(next.url, next.label || 'Audio', next.id, activeAudioChatIdRef.current, false);
    }
  };

  const handlePlayPause = (key: string, label: string, messageId?: string, chatId?: string | null, updateChatContext: boolean = true) => {
    if (!key) return;
    if (messageId) activeAudioMessageIdRef.current = messageId;
    if (updateChatContext) {
      const nextChatId = chatId || selectedChatId || null;
      activeAudioChatIdRef.current = nextChatId;
      setPlayerChatId(nextChatId);
      if (typeof window !== 'undefined') {
        if (activeAudioChatIdRef.current) window.localStorage.setItem('activeAudioChatId', activeAudioChatIdRef.current);
        else window.localStorage.removeItem('activeAudioChatId');
      }
    }

    // Pause previous audio if different
    if (activeAudioRef.current && activeAudioMsgRef.current && activeAudioMsgRef.current !== key) {
      activeAudioRef.current.pause();
      const prevKey = activeAudioMsgRef.current;
      setAudioProgress((prev) => ({
        ...prev,
        [prevKey]: {
          ...(prev[prevKey] || { current: 0, duration: activeAudioRef.current?.duration || 0 }),
          playing: false,
        },
      }));
    }

    let audio = activeAudioRef.current;
    if (!audio || activeAudioMsgRef.current !== key) {
      audio = new Audio(key);
      activeAudioRef.current = audio;
      activeAudioMsgRef.current = key;
      activeAudioMessageIdRef.current = messageId || null;
      activeAudioChatIdRef.current = chatId || selectedChatId || null;
      // Queue snapshot faqat kontekst yangilash so'ralganda
      if (updateChatContext) {
        activeQueueRef.current = {
          chatId: activeAudioChatIdRef.current,
          items: audioQueueRef.current || [],
        };
        setActiveQueueSnapshot(activeQueueRef.current);
      }

      setAudioLoading((prev) => ({ ...prev, [key]: true }));

      audio.addEventListener('loadedmetadata', () => {
        setAudioLoading((prev) => ({ ...prev, [key]: false }));
        setAudioProgress((prev) => ({
          ...prev,
          [key]: {
            current: audio?.currentTime || 0,
            duration: audio?.duration || 0,
            playing: !audio?.paused,
          },
        }));
      });

      audio.addEventListener('timeupdate', () => {
        setAudioProgress((prev) => ({
          ...prev,
          [key]: {
            current: audio?.currentTime || 0,
            duration: audio?.duration || 0,
            playing: !audio?.paused,
          },
        }));
      });

      audio.addEventListener('pause', () => {
        setAudioProgress((prev) => ({
          ...prev,
          [key]: {
            current: audio?.currentTime || 0,
            duration: audio?.duration || 0,
            playing: false,
          },
        }));
      });

      audio.addEventListener('ended', () => {
        setAudioProgress((prev) => ({
          ...prev,
          [key]: {
            current: 0,
            duration: audio?.duration || 0,
            playing: false,
          },
        }));
        if (messageId && activeAudioChatIdRef.current === currentQueueChatIdRef.current) {
          const next = getNextAudio(messageId);
          if (next?.url) {
            // Play the next audio in the same chat playlist
            setTimeout(() => handlePlayPause(next.url, next.label || 'Audio', next.id, activeAudioChatIdRef.current), 50);
          }
        }
      });
    }

    if (audio.paused) {
      setAudioLoading((prev) => ({ ...prev, [key]: true }));
      audio
        .play()
        .then(() => {
          setAudioLoading((prev) => ({ ...prev, [key]: false }));
          setAudioProgress((prev) => ({
            ...prev,
            [key]: {
              current: audio?.currentTime || 0,
              duration: audio?.duration || prev[key]?.duration || 0,
              playing: true,
            },
          }));
          setActiveAudioMeta({ url: key, label, messageId, chatId: activeAudioChatIdRef.current });
        })
        .catch(() => {
          setAudioLoading((prev) => ({ ...prev, [key]: false }));
          setErrorMessage(`${label} ijro etib bo'lmadi`);
        });
    } else {
      audio.pause();
      setActiveAudioMeta((prev) => prev || { url: key, label, messageId });
    }
  };

  const seekAudio = (key: string, ratio: number) => {
    if (!activeAudioRef.current || activeAudioMsgRef.current !== key) return;
    const audio = activeAudioRef.current;
    if (!audio.duration) return;
    const clamped = Math.min(Math.max(ratio, 0), 1);
    audio.currentTime = audio.duration * clamped;
  };

  const renderAudioBubble = (url: string, name?: string, size?: number, durationMs?: number, accent?: 'green' | 'blue', messageId?: string, chatId?: string | null) => {
    const base = isDark
      ? (accent === 'blue' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-800/80 border-emerald-900/40')
      : (accent === 'blue' ? 'bg-[#e7f5ff] border-sky-100' : 'bg-[#e8fbe8] border-emerald-100');
    const bar = accent === 'blue' ? (isDark ? 'bg-sky-400' : 'bg-sky-500') : (isDark ? 'bg-emerald-400' : 'bg-emerald-500');
    const text = isDark ? 'text-slate-100' : 'text-slate-800';
    const progress = audioProgress[url] || { current: 0, duration: (durationMs || 0) / 1000, playing: false };
    const current = progress.current || 0;
    const total = progress.duration || (durationMs || 0) / 1000;
    const pct = total ? (current / total) * 100 : 0;
    const loading = audioLoading[url];
    const isActive = activeAudioMsgRef.current === url;
    return (
      <div className={`rounded-2xl border ${base} ${text} shadow-sm p-3 flex items-center gap-3 w-full max-w-sm ${isActive ? (isDark ? 'ring-2 ring-sky-700/40' : 'ring-2 ring-sky-200') : ''}`}>
        <button
          type="button"
          className={`w-10 h-10 rounded-full ${accent === 'blue' ? 'bg-sky-500' : 'bg-emerald-500'} text-white flex items-center justify-center shadow-sm disabled:opacity-60`}
          onClick={() => handlePlayPause(url, name || 'Audio', messageId, chatId)}
          aria-label="Play audio"
          disabled={!url}
        >
          {loading ? <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : progress.playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate flex items-center gap-2">
            <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-full", isDark ? "bg-slate-700 text-slate-200" : "bg-white/70 text-slate-600")}>
              <span className="text-[10px] font-semibold">в™Є</span>
            </span>
            <span className="truncate">{name || 'Audio'}</span>
          </div>
          <div
            className={cn("h-2 rounded-full overflow-hidden mt-2 cursor-pointer", isDark ? "bg-slate-700" : "bg-white/70")}
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seekAudio(url, ratio);
            }}
          >
            <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <div className={cn("text-[11px] mt-2 grid grid-cols-3 items-center", isDark ? "text-slate-300" : "text-slate-600")}>
            <span className="font-semibold">{formatDuration(current * 1000)}</span>
            <span className="text-center text-slate-400">/ {formatDuration((total || 0) * 1000 || durationMs)}</span>
            {size ? <span className={cn("text-right", isDark ? "text-slate-400" : "text-slate-500")}>{formatBytes(size)}</span> : <span />}
          </div>
        </div>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-slate-900">
            <ArrowDown size={16} />
          </a>
        ) : null}
      </div>
    );
  };

  const renderVoiceBubble = (url: string, durationMs?: number, name?: string, size?: number, messageId?: string, chatId?: string | null) => {
    const progress = audioProgress[url] || { current: 0, duration: (durationMs || 0) / 1000, playing: false };
    const current = progress.current || 0;
    const total = progress.duration || (durationMs || 0) / 1000;
    const pct = total ? (current / total) * 100 : 0;
    const loading = audioLoading[url];
    return (
      <div className={cn("rounded-2xl border shadow-sm p-3 flex items-center gap-3 w-full max-w-sm", isDark ? "border-emerald-900/40 bg-slate-800/80 text-slate-100" : "border-emerald-100 bg-[#e8fbe8] text-slate-800")}>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center"
          onClick={() => handlePlayPause(url, name || 'Voice', messageId, chatId)}
          aria-label="Play voice"
          disabled={!url}
        >
          {loading ? <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : progress.playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", isDark ? "bg-slate-700 text-emerald-300" : "bg-white/80 text-emerald-600")}>
              <Mic size={14} />
            </div>
            <div className="text-sm font-semibold">Voice message</div>
          </div>
          <div
            className={cn("h-2 rounded-full overflow-hidden mt-2 cursor-pointer relative", isDark ? "bg-slate-700" : "bg-white/70")}
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seekAudio(url, ratio);
            }}
          >
            <div className={cn("absolute inset-0 opacity-70", isDark ? "bg-gradient-to-r from-emerald-700/40 via-emerald-600/50 to-emerald-700/40" : "bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200")} />
            <div className={cn("h-full relative", isDark ? "bg-emerald-400" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
          </div>
          <div className={cn("text-[11px] mt-1 flex items-center gap-3", isDark ? "text-emerald-200" : "text-emerald-700")}>
            <span className="font-semibold">{formatDuration((current || total) * 1000 || durationMs)}</span>
            {size ? <span className={cn("ml-auto", isDark ? "text-emerald-200" : "text-emerald-600")}>{formatBytes(size)}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  const canEditMessage = (msg: Message) => {
    if (msg.senderId !== user?.id) return false;
    if (msg.type && msg.type !== 'TEXT') return false;
    if (msg.type === 'SYSTEM') return false;
    return true;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  const getChatId = (chat: Chat | null | undefined) => chat?.id || (chat as any)?.chatId || (chat as any)?.chat_id || null;

  // Queries
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => messageService.getChats().then(r => r.data.data),
  });

  const chats = Array.isArray((chatsData as any)?.chats)
    ? (chatsData as any).chats.filter(Boolean)
    : Array.isArray(chatsData) ? chatsData.filter(Boolean) : [];
  const totalUnread = (chatsData as any)?.totalUnread ?? 0;
  const selectedChat = chats.find(c => getChatId(c) === (params.chatId || null)) || null;
  const selectedChatId = getChatId(selectedChat) || null;
  const otherUserId = selectedChat ? (selectedChat.user1Id === user?.id ? selectedChat.user2Id : selectedChat.user1Id) : null;
  const isOtherTyping = otherUserId ? isTyping[otherUserId] : false;
  const otherTypingType = otherUserId ? typingType[otherUserId] : undefined;
  const otherTypingLabel = (() => {
    if (!isOtherTyping || !otherTypingType) return null;
    switch (otherTypingType) {
      case 'WRITING_TEXT': return 'Yozmoqda';
      case 'WRITING_VOICE': return 'Ovozli xabar yozmoqda';
      case 'SENDING_VOICE': return 'Ovozli xabar yuborilmoqda';
      case 'SENDING_AUDIO': return 'Audio yuborilmoqda';
      case 'SENDING_VIDEO': return 'Video yuborilmoqda';
      case 'SENDING_PHOTO': return 'Rasm yuborilmoqda';
      case 'SENDING_FILE': return 'Fayl yuborilmoqda';
      default: return 'Yozmoqda';
    }
  })();

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedChatId],
    queryFn: () => selectedChatId ? messageService.getMessages(selectedChatId).then(r => r.data.data) : Promise.resolve([]),
    enabled: !!selectedChatId,
  });

  // Prefill audio durations from server data to avoid 00:00/00:00 before play
  useEffect(() => {
    if (!messagesData) return;
    setAudioProgress((prev) => {
      const next = { ...prev };
      messagesData.forEach((m: any) => {
        if ((m.type === 'AUDIO' || m.type === 'VOICE') && m.attachmentUrl) {
          const key = m.attachmentUrl as string;
          const durationSec = (m.attachmentDurationMs || 0) / 1000;
          if (durationSec > 0) {
            const current = prev[key]?.current || 0;
            const playing = prev[key]?.playing || false;
            if (!prev[key] || !prev[key]?.duration) {
              next[key] = { current, duration: durationSec, playing };
            }
          }
        }
      });
      return next;
    });
  }, [messagesData]);

  const audioQueue = React.useMemo(() => {
    return (messagesData || [])
      .filter((m) => m && (m.type === 'AUDIO' || m.type === 'VOICE') && m.attachmentUrl)
      .map((m) => ({
        id: m.messageId,
        url: m.attachmentUrl || '',
        label: m.attachmentName || (m.type === 'VOICE' ? 'Voice' : 'Audio'),
      }));
  }, [messagesData]);
  const audioQueueRef = useRef<typeof audioQueue>([]);
  useEffect(() => {
    audioQueueRef.current = audioQueue;
    currentQueueChatIdRef.current = selectedChatId || null;
    if (playerChatId && playerChatId === selectedChatId) {
      activeQueueRef.current = { chatId: playerChatId, items: audioQueue || [] };
      setActiveQueueSnapshot(activeQueueRef.current);
    }
  }, [audioQueue, selectedChatId, playerChatId]);

  // keep ref in sync with state
  useEffect(() => {
    activeAudioChatIdRef.current = playerChatId;
  }, [playerChatId]);

  const { data: otherUserProfileData } = useQuery<User | null>({
    queryKey: ['user', otherUserId],
    queryFn: () => otherUserId ? messageService.getUserById(otherUserId).then(res => res.data.data as User) : Promise.resolve(null),
    enabled: !!otherUserId,
  });
  const otherUserDisplay = otherUserProfileData || (selectedChat?.otherUser as User | undefined) || null;

  const { data: searchResults, isFetching: searchLoading } = useQuery<User[] | null>({
    queryKey: ['user-search', searchInput],
    queryFn: () => searchInput.trim()
      ? authService.searchUsers(searchInput.trim(), 20).then(res => res.data.data as User[])
      : Promise.resolve([]),
    enabled: searchInput.trim().length > 0,
    staleTime: 30_000,
  });

  // Prefetch users
  useEffect(() => {
    chats.forEach((c) => {
      const uid = c.user1Id === user?.id ? c.user2Id : c.user1Id;
      if (uid) {
        queryClient.prefetchQuery({
          queryKey: ['user', uid],
          queryFn: () => messageService.getUserById(uid).then(res => res.data.data as User),
        });
      }
    });
  }, [chats, queryClient, user]);

  // Heartbeat
  useEffect(() => {
    const sendHeartbeat = () => authService.heartbeat().catch(() => { });
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup preview URL
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const handleMessageDeletedEvent = (payload: { messageId: string; chatId: string }) => {
      if (!payload?.messageId || !payload?.chatId) return;
      let remainingAfterDelete: Message[] = [];
      queryClient.setQueryData(['messages', payload.chatId], (old: Message[] = []) => {
        const filtered = old.filter((m) => m.messageId !== payload.messageId);
        remainingAfterDelete = filtered;
        return filtered;
      });
      const cleared = remainingAfterDelete.length === 0;
      const clearedAt = new Date().toISOString();
      updateChatsCache((prevChats, totalUnread) => {
        const updated = prevChats.map((c) => {
          if (getChatId(c) !== payload.chatId) return c;
          if (cleared) {
            const clearedMsg: Message = {
              messageId: `cleared-${payload.chatId}`,
              chatId: payload.chatId,
              senderId: '',
              receiverId: '',
              content: 'Chat tozalangan',
              createdAt: clearedAt,
              read: true,
              type: 'SYSTEM',
              system: true,
            };
            return { ...c, lastMessage: clearedMsg, lastMessageAt: clearedAt, unreadCount: 0 };
          }
          const last = remainingAfterDelete[remainingAfterDelete.length - 1];
          return { ...c, lastMessage: last || c.lastMessage, lastMessageAt: last?.createdAt || c.lastMessageAt };
        });
        return { chats: updated, totalUnread };
      });
      if (selectedChatId === payload.chatId && cleared) {
        setToastMessage('Chat tozalandi');
      }
    };

    connectStomp(
      (newMsg) => {
        const currentChat = selectedChatRef.current;
        const currentChatId = getChatId(currentChat);
        if (currentChatId && (newMsg.chatId === currentChatId || newMsg.senderId === currentChat?.otherUser?.id)) {
          queryClient.setQueryData(['messages', currentChatId], (old: Message[] = []) => [...old, newMsg]);
          if (scrollRef.current) requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          });
        }
        const incomingChatId = newMsg.chatId || (newMsg as any)?.chat_id;
        const fromMe = newMsg.senderId === user?.id;
        updateChatsCache((prevChats, totalUnread) => {
          let addedUnread = 0;
          const nextChats = (() => {
            const idx = prevChats.findIndex((c) => getChatId(c) === incomingChatId);
            if (idx === -1) {
              const unreadCount = fromMe || currentChatId === incomingChatId ? 0 : 1;
              addedUnread += unreadCount;
              // Unknown chat: add minimal entry
              return [
                ...prevChats,
                {
                  id: incomingChatId || `temp-${Date.now()}`,
                  chatId: incomingChatId,
                  user1Id: newMsg.senderId,
                  user2Id: newMsg.receiverId,
                  createdAt: newMsg.createdAt,
                  lastMessageAt: newMsg.createdAt,
                  lastMessage: newMsg,
                  unreadCount,
                }
              ];
            }
            const copy = [...prevChats];
            const existing = copy[idx];
            const unreadCount = fromMe || currentChatId === incomingChatId ? 0 : (existing.unreadCount || 0) + 1;
            if (!fromMe && currentChatId !== incomingChatId) {
              addedUnread += 1;
            }
            copy[idx] = { ...existing, lastMessageAt: newMsg.createdAt, lastMessage: newMsg, unreadCount };
            return copy;
          })();
          return { chats: nextChats, totalUnread: totalUnread + addedUnread };
        });
      },
      ({ senderId, typing, type, status }) => {
        const normalizedStatus = (() => {
          const st = (status || '').toString().toUpperCase() as TypingStatus | '';
          if (st === 'WRITING_TEXT') return 'WRITING_TEXT' as TypingStatus;
          const t = (type || '').toString().toUpperCase();
          if (typing && t === 'TEXT') return 'WRITING_TEXT' as TypingStatus;
          return undefined;
        })();

        setIsTyping(prev => {
          const effective = normalizedStatus === 'WRITING_TEXT';
          return { ...prev, [senderId]: Boolean(effective) };
        });
        setTypingType(prev => {
          const next = { ...prev };
          if (normalizedStatus) next[senderId] = normalizedStatus;
          else delete next[senderId];
          return next;
        });
      },
      (payload) => {
        if (!payload?.chatId) return;
        const wasOpen = selectedChatRef.current && getChatId(selectedChatRef.current) === payload.chatId;
        if (!wasOpen) {
          console.log('Chat deleted event for non-open chat', payload);
        }
        updateChatsCache((prevChats, totalUnread) => ({
          chats: prevChats.filter((c) => getChatId(c) !== payload.chatId),
          totalUnread: Math.max(0, totalUnread - (prevChats.find((c) => getChatId(c) === payload.chatId)?.unreadCount || 0)),
        }));
        queryClient.removeQueries({ queryKey: ['messages', payload.chatId] });
        if (selectedChatRef.current && getChatId(selectedChatRef.current) === payload.chatId) {
          navigate('/chat', { replace: true });
          setToastMessage('Chat deleted');
        }
      },
      (payload) => {
        if (!payload?.message?.messageId) return;
        const edited = payload.message;
        const chatId = edited.chatId;
        queryClient.setQueryData(['messages', chatId], (old: Message[] = []) =>
          old.map((m) => m.messageId === edited.messageId ? { ...m, ...edited } : m)
        );
        updateChatsCache((prevChats, totalUnread) => {
          const updated = prevChats.map((c) => {
            if (getChatId(c) === chatId) {
              const lastIsEdited = c.lastMessage && c.lastMessage.messageId === edited.messageId;
              return {
                ...c,
                lastMessage: lastIsEdited ? { ...c.lastMessage, ...edited } : c.lastMessage,
              };
            }
            return c;
          });
          return { chats: updated, totalUnread };
        });
      },
      handleMessageDeletedEvent
    );
    return () => disconnectStomp();
  }, [queryClient, navigate, updateChatsCache, user?.id, selectedChatId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messagesData]);

  // Debug: log fetched messages for the selected chat
  useEffect(() => {
      if (selectedChatId !== null && messagesData) {
        console.log('Messages fetched', messagesData);
      }
    }, [selectedChatId, messagesData]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selectedChatId]);

  // Cleanup recorder on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url);
    };
  }, [voiceDraft]);

  useEffect(() => {
    resizeMessageInput();
  }, [messageInput, isRecording]);

  // Close emoji picker on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!emojiRef.current) return;
      if (!emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close search dropdown on outside click / ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Recording timer
  useEffect(() => {
    let timer: any;
    if (isRecording && !isPausedRecording) {
      timer = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, isPausedRecording]);

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(''), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(''), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Apply basic theme colors to document root
  useEffect(() => {
    const root = document.documentElement;
    root.style.backgroundColor = isDark ? '#0b1220' : '#ffffff';
    root.style.color = isDark ? '#e2e8f0' : '#0f172a';
    window.localStorage.setItem('theme', theme);
  }, [isDark]);

  // When opening a chat, clear unread count locally
  useEffect(() => {
    if (!selectedChatId) return;
    updateChatsCache((prevChats, totalUnread) => {
      let cleared = 0;
      const next = prevChats.map((c) => {
        if (getChatId(c) === selectedChatId && (c.unreadCount || 0) > 0) {
          cleared += c.unreadCount || 0;
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
      return { chats: next, totalUnread: Math.max(0, totalUnread - cleared) };
    });
  }, [selectedChatId, updateChatsCache]);

  useEffect(() => {
    const closeMenus = () => {
      setContextMenu(null);
      setMessageMenu(null);
    };
    window.addEventListener('click', closeMenus);
    window.addEventListener('scroll', closeMenus, true);
    return () => {
      window.removeEventListener('click', closeMenus);
      window.removeEventListener('scroll', closeMenus, true);
    };
  }, []);

  useEffect(() => () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      activeAudioMsgRef.current = null;
    }
  }, []);

  useEffect(() => {
    setShowPlayerQueue(false);
    // When chat changes, update queue ref for that chat (only for display, active player stays bound to its chatId)
    audioQueueRef.current = audioQueue;
  }, [selectedChatId, audioQueue]);

  // Close player queue when outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!playerRef.current) return;
      if (!playerRef.current.contains(e.target as Node)) {
        setShowPlayerQueue(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Build blob URLs for local attachments to preview/play before upload
  useEffect(() => {
    setAttachmentPreviews((prev) => {
      const next: Record<string, string> = {};
      attachments.forEach((file) => {
        const key = fileKey(file);
        next[key] = prev[key] || URL.createObjectURL(file);
      });
      Object.entries(prev).forEach(([k, url]) => {
        if (!next[k]) URL.revokeObjectURL(url);
      });
      return next;
    });
  }, [attachments]);

  useEffect(() => () => {
    Object.values(attachmentPreviews).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const showSizeError = (fileName?: string) => {
    const namePart = fileName ? `${fileName} ` : '';
    setErrorMessage(`${namePart}200 MB dan katta, yuborish mumkin emas.`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const chatId = selectedChatId;
    if (!selectedChat || !chatId) return;
    if (!messageInput.trim() && attachments.length === 0) return;

    const receiverId = selectedChat.user1Id === user?.id ? selectedChat.user2Id : selectedChat.user1Id;
    const hasFiles = attachments.length > 0;
    const textSegments = messageInput.trim() ? chunkText(messageInput.trim(), MAX_MESSAGE_LEN) : [];
    const appendLocal = (msg: Message) => {
      queryClient.setQueryData(['messages', chatId], (old: Message[] = []) => [...old, msg]);
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    };

    if (hasFiles) {
      attachments.forEach((file) => {
        if (file.size > MAX_FILE_BYTES) {
          showSizeError(file.name);
          return;
        }
        const messageType = pickMessageType(file);
        const sendStatus: TypingStatus | null = (() => {
          if (messageType === 'VOICE') return 'SENDING_VOICE';
          if (messageType === 'AUDIO') return 'SENDING_AUDIO';
          if (messageType === 'VIDEO') return 'SENDING_VIDEO';
          if (messageType === 'IMAGE') return 'SENDING_PHOTO';
          if (messageType === 'FILE') return 'SENDING_FILE';
          return null;
        })();
        if (sendStatus) sendTypingState(sendStatus);
        const tempMsg: Message = {
          messageId: `${Date.now()}-${file.name}`,
          chatId,
          senderId: user?.id || '',
          receiverId,
          content: messageInput.slice(0, MAX_MESSAGE_LEN),
          createdAt: new Date().toISOString(),
          read: false,
          type: messageType,
          replyToMessageId: replyTo?.messageId || null,
          system: isSystemMessage,
          attachmentName: file.name,
        };
        appendLocal(tempMsg);
        const trackProgress = file.size > 1_000_000;
        if (trackProgress) {
          setUploadProgress(prev => ({
            ...prev,
            [tempMsg.messageId]: { percent: 0, loaded: 0, total: file.size, name: file.name },
          }));
        }
        messageService.sendMessageRest({
          receiverId,
          content: messageInput.slice(0, MAX_MESSAGE_LEN),
          type: messageType,
          replyToMessageId: replyTo?.messageId || null,
          system: isSystemMessage,
          attachment: file,
          onUploadProgress: trackProgress ? (e) => {
            const total = e.total || file.size;
            if (!total) return;
            const pct = Math.round((e.loaded / total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [tempMsg.messageId]: { percent: pct, loaded: e.loaded, total, name: file.name },
            }));
          } : undefined,
        }).then((res) => {
          const saved = res?.data?.data;
          if (!saved) return;
          const realChatId = saved.chatId || chatId;
          if (chatId.startsWith('temp-') && realChatId !== chatId) {
            // move messages cache to real chatId
            queryClient.setQueryData(['messages', realChatId], (old: Message[] = []) => {
              const previousTemp = queryClient.getQueryData<Message[]>(['messages', chatId]) || [];
              const withoutTemp = previousTemp.filter((m) => m.messageId !== tempMsg.messageId);
              return [...withoutTemp, saved];
            });
            // replace temp chat in chats list
            updateChatsCache((oldChats, totalUnread) => {
              const filtered = oldChats.filter(c => getChatId(c) !== chatId);
              return {
                chats: [...filtered, { ...saved, id: realChatId, chatId: realChatId, lastMessageAt: saved.createdAt, lastMessage: saved, unreadCount: 0 }],
                totalUnread,
              };
            });
            navigate(`/chat/${realChatId}`, { replace: true });
          } else {
            queryClient.setQueryData(['messages', chatId], (old: Message[] = []) => {
              const withoutTemp = old.filter((m) => m.messageId !== tempMsg.messageId);
              return [...withoutTemp, saved];
            });
            updateChatsCache((oldChats, totalUnread) => {
              const updated = oldChats.map((c) => getChatId(c) === chatId
                ? { ...c, lastMessageAt: saved.createdAt, lastMessage: saved, unreadCount: 0 }
                : c);
              return { chats: updated, totalUnread };
            });
          }
          refreshChatsList();
        }).catch(console.error).finally(() => {
          sendTypingState(null);
          setUploadProgress(prev => {
            const copy = { ...prev };
            delete copy[tempMsg.messageId];
            return copy;
          });
        });
      });
    }

    if (!hasFiles && textSegments.length > 0) {
      textSegments.forEach((segment, idx) => {
        const tempText: Message = {
          messageId: `${Date.now()}-${idx}`,
          chatId,
          senderId: user?.id || '',
          receiverId,
          content: segment,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'TEXT',
          replyToMessageId: replyTo?.messageId || null,
          system: isSystemMessage,
        };
        appendLocal(tempText);
        messageService.sendMessageRest({
          receiverId,
          content: segment,
          type: 'TEXT',
          replyToMessageId: replyTo?.messageId || null,
          system: isSystemMessage,
        }).then(() => refreshChatsList()).catch((err) => {
          console.error('Send message failed', err);
          setErrorMessage('Xabar yuborilmadi');
        });
      });
    }

    setMessageInput('');
    setAttachments([]);
    setReplyTo(null);
    setIsSystemMessage(false);
    sendTypingState(null);
  };

  const resizeMessageInput = () => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = '0px';
    const maxH = 140; // cap height to keep box compact
    const newH = Math.min(el.scrollHeight, maxH);
    el.style.height = `${newH}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  };

  const sendTypingState = (status: TypingStatus | null) => {
    // Faqat matn yozish indikatorini yuboramiz
    if (!selectedChat) return;
    if (status && status !== 'WRITING_TEXT') return;
    const receiverId = selectedChat.user1Id === user?.id ? selectedChat.user2Id : selectedChat.user1Id;
    const typingFlag = Boolean(status); // faqat WRITING_TEXT -> true, null -> false
    sendStompTyping(receiverId, typingFlag, typingFlag ? 'WRITING_TEXT' : undefined);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, MAX_MESSAGE_LEN);
    setMessageInput(next);
    setTimeout(resizeMessageInput, 0);
    if (!selectedChat) return;
    sendTypingState('WRITING_TEXT');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingState(null);
    }, 2000);
  };


  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleDeleteChat = async (chatId?: string) => {
    const targetId = chatId || selectedChatId;
    if (!targetId) return;
    setPendingDeleteChatId(targetId);
    return;
  };

  const confirmDeleteChat = async () => {
    const targetId = pendingDeleteChatId;
    if (!targetId) return;
    try {
      const res = await messageService.deleteChat(targetId);
      console.log('Delete chat response', res?.data ?? res);
      const deletedBy = user?.id || otherUserId || 'unknown';
      sendChatDeletedEvent({ chatId: targetId, deletedBy, deletedAt: new Date().toISOString() });
      updateChatsCache((oldChats, totalUnread) => ({
        chats: oldChats.filter((c) => getChatId(c) !== targetId),
        totalUnread: Math.max(0, totalUnread - (oldChats.find((c) => getChatId(c) === targetId)?.unreadCount || 0)),
      }));
      queryClient.removeQueries({ queryKey: ['messages', targetId] });
      refreshChatsList();
      setToastMessage('Chat deleted');
      if (selectedChatId === targetId) {
        navigate('/chat', { replace: true });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setErrorMessage('Chatni oвЂchirishga ruxsat yoвЂq (401)');
      else if (status === 403) setErrorMessage('Chatni oвЂchira olmaysiz (403)');
      else setErrorMessage('Chatni oвЂchirishda xatolik');
    } finally {
      setPendingDeleteChatId(null);
      setContextMenu(null);
    }
  };

  const handleEditMessage = async (msg: Message) => {
    const next = window.prompt("Xabarni tahrirlash:", msg.content || '');
    if (next === null || next === undefined) return;
    const trimmed = next.trim();
    try {
      const res = await messageService.editMessage(msg.messageId, trimmed);
      const edited = res?.data?.data || { ...msg, content: trimmed };
      queryClient.setQueryData(['messages', edited.chatId], (old: Message[] = []) =>
        old.map((m) => m.messageId === edited.messageId ? { ...m, ...edited } : m)
      );
      updateChatsCache((prevChats, totalUnread) => {
        const updated = prevChats.map((c) => {
          if (getChatId(c) === edited.chatId) {
            const lastIsEdited = c.lastMessage && c.lastMessage.messageId === edited.messageId;
            return { ...c, lastMessage: lastIsEdited ? { ...c.lastMessage, ...edited } : c.lastMessage };
          }
          return c;
        });
        return { chats: updated, totalUnread };
      });
      setToastMessage('Xabar tahrirlandi');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setErrorMessage('Tahrir uchun ruxsat yoвЂq (401)');
      else if (status === 403) setErrorMessage('Tahrir qilish mumkin emas (403)');
      else if (status === 404) setErrorMessage('Xabar topilmadi (404)');
      else setErrorMessage('Xabar tahririda xatolik');
    } finally {
      setMessageMenu(null);
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    try {
      await messageService.deleteMessage(msg.messageId);
      let remainingAfterDelete: Message[] = [];
      queryClient.setQueryData(['messages', msg.chatId], (old: Message[] = []) => {
        const filtered = old.filter((m) => m.messageId !== msg.messageId);
        remainingAfterDelete = filtered;
        return filtered;
      });
      const cleared = remainingAfterDelete.length === 0;
      const clearedAt = new Date().toISOString();
      updateChatsCache((prevChats, totalUnread) => {
        const updated = prevChats.map((c) => {
          if (getChatId(c) !== msg.chatId) return c;
          if (cleared) {
            const clearedMsg: Message = {
              messageId: `cleared-${msg.chatId}`,
              chatId: msg.chatId,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: 'Chat tozalangan',
              createdAt: clearedAt,
              read: true,
              type: 'SYSTEM',
              system: true,
            };
            return { ...c, lastMessage: clearedMsg, lastMessageAt: clearedAt, unreadCount: 0 };
          }
          const last = remainingAfterDelete[remainingAfterDelete.length - 1];
          return { ...c, lastMessage: last || c.lastMessage, lastMessageAt: last?.createdAt || c.lastMessageAt };
        });
        return { chats: updated, totalUnread };
      });
      setToastMessage(cleared ? 'Chat tozalandi' : "Xabar o'chirildi");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setErrorMessage("Xabarni o'chirishga ruxsat yo'q (401)");
      else if (status === 403) setErrorMessage("Xabarni o'chira olmaysiz (403)");
      else if (status === 404) setErrorMessage('Xabar topilmadi (404)');
      else setErrorMessage("Xabarni o'chirishda xatolik");
    } finally {
      setMessageMenu(null);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        showSizeError(f.name);
        return false;
      }
      return true;
    });
    const [first, ...rest] = files;
    if (first && (first.type.startsWith('image/') || first.type.startsWith('video/'))) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewFile(first);
      setPreviewUrl(URL.createObjectURL(first));
      setPreviewCaption('');
      if (rest.length) {
        setAttachments((prev) => [...prev, ...rest]);
      }
      return;
    }
    // Audio should be sent as AUDIO (not FILE); push directly to attachments
    if (first && first.type.startsWith('audio/')) {
      setAttachments((prev) => [...prev, first, ...rest]);
      return;
    }
    // Non-image/video/audio: open file modal for the first, queue remaining
    if (first) {
      setFileModal({ file: first, caption: '' });
      if (rest.length) setAttachments((prev) => [...prev, ...rest]);
      return;
    }
    setAttachments((prev) => [...prev, ...files]);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(e.clipboardData.files || []);
    if (!files.length) return;
    e.preventDefault();
    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        showSizeError(f.name);
        return false;
      }
      return true;
    });
    const [first, ...rest] = validFiles;
    if (first && (first.type.startsWith('image/') || first.type.startsWith('video/'))) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewFile(first);
      setPreviewUrl(URL.createObjectURL(first));
      setPreviewCaption('');
      if (rest.length) setAttachments((prev) => [...prev, ...rest]);
      return;
    }
    if (first && first.type.startsWith('audio/')) {
      setAttachments((prev) => [...prev, first, ...rest]);
      return;
    }
    if (first) {
      setFileModal({ file: first, caption: '' });
      if (rest.length) setAttachments((prev) => [...prev, ...rest]);
      return;
    }
    setAttachments((prev) => [...prev, ...files]);
  };

  const pickMessageType = (file: File): Message['type'] => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'IMAGE';
    if (type.startsWith('video/')) return 'VIDEO';
    if (type.startsWith('audio/')) return type.includes('ogg') || type.includes('webm') ? 'VOICE' : 'AUDIO';
    return 'FILE';
  };

  const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  const formatPreviewText = (msg: Message | null | undefined) => {
    if (!msg) return 'Xabar';
    const normalize = (t?: string | null) => (t || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '').trim();
    const safe = normalize(msg.content);
    if (safe) {
      const { onlyEmoji } = parseEmojiOnly(safe);
      return onlyEmoji ? `${safe} Emoji` : safe;
    }
    const label = (() => {
      switch (msg.type) {
        case 'IMAGE': return '📷 Rasm';
        case 'VIDEO': return '🎬 Video';
        case 'AUDIO': return '🎵 Audio';
        case 'VOICE': return '🎙️ Voice';
        case 'FILE': return '📎 Fayl';
        default: return 'Xabar';
      }
    })();
    if (msg.attachmentName) return `${label}: ${msg.attachmentName}`;
    return label;
  };

  const handleMentionClick = async (rawUsername: string) => {
    const username = (rawUsername || '').replace(/^@/, '').trim();
    if (!username) return;
    try {
      const res = await authService.getUserByUsername(username);
      const target = res?.data?.data;
      if (!target?.id) {
        setErrorMessage('Foydalanuvchi topilmadi');
        return;
      }
      const existing = chats.find((c) => c.user1Id === target.id || c.user2Id === target.id);
      if (existing) {
        navigate(`/chat/${getChatId(existing)}`);
        return;
      }
      const tempId = `temp-${target.id}`;
      updateChatsCache((oldChats, totalUnread) => {
        if (oldChats.find(c => getChatId(c) === tempId)) return { chats: oldChats, totalUnread };
        const now = new Date().toISOString();
        return {
          chats: [
            ...oldChats,
            {
              id: tempId,
              chatId: tempId,
              user1Id: user?.id,
              user2Id: target.id,
              createdAt: now,
              lastMessageAt: now,
              otherUser: target,
              unreadCount: 0,
            }
          ],
          totalUnread,
        };
      });
      navigate(`/chat/${tempId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) setErrorMessage('Foydalanuvchi topilmadi');
      else if (status === 400) setErrorMessage('Username kiritilmadi');
      else setErrorMessage('Havolani ochib bo‘lmadi');
    }
  };

  const stopActiveAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    setActiveAudioMeta(null);
  };

  const getMessagePreviewText = (msg: Message | null | undefined) => {
    if (!msg) return 'Xabar';
    const normalize = (t?: string | null) => (t || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '').trim();
    const safeContent = normalize(msg.content);
    if (safeContent) return safeContent;
    const label = (() => {
      switch (msg.type) {
        case 'IMAGE': return '🖼 Rasm';
        case 'VIDEO': return '🎥 Video';
        case 'AUDIO': return '🎵 Audio';
        case 'VOICE': return '🎤 Voice';
        case 'FILE': return '📄 Fayl';
        default: return 'Xabar';
      }
    })();
    if (msg.attachmentName) return `${label}: ${msg.attachmentName}`;
    return label;
  };



  // Telegram-like landing: do NOT auto-open first chat when path is /chat
  useEffect(() => {
    // If user is at /chat with no chatId, stay on the blank panel
    // If direct link /chat/:chatId, do nothing (already selected)
  }, [params.chatId, chats, navigate]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollToBottom(scrollTop + clientHeight < scrollHeight - 50);
  };

  const handleSendPreview = () => {
    if (!previewFile || !selectedChat || !selectedChatId) return;
    if (previewFile.size > MAX_FILE_BYTES) {
      showSizeError(previewFile.name);
      return;
    }
    const receiverId = selectedChat.user1Id === user?.id ? selectedChat.user2Id : selectedChat.user1Id;
    const messageType = pickMessageType(previewFile);
    const sendingStatus: TypingStatus | null = messageType === 'VIDEO'
      ? 'SENDING_VIDEO'
      : messageType === 'IMAGE'
        ? 'SENDING_PHOTO'
        : messageType === 'AUDIO'
          ? 'SENDING_AUDIO'
          : null;
    if (sendingStatus) sendTypingState(sendingStatus);
    const tempMsg: Message = {
      messageId: `${Date.now()}-${previewFile.name}`,
      chatId: selectedChatId,
      senderId: user?.id || '',
      receiverId,
      content: previewCaption,
      createdAt: new Date().toISOString(),
      read: false,
      type: messageType,
      replyToMessageId: replyTo?.messageId || null,
      system: isSystemMessage,
      attachmentName: previewFile.name,
    };
    queryClient.setQueryData(['messages', selectedChatId], (old: Message[] = []) => [...old, tempMsg]);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
    const trackProgress = previewFile.size > 1_000_000;
    if (trackProgress) {
      setUploadProgress(prev => ({
        ...prev,
        [tempMsg.messageId]: { percent: 0, loaded: 0, total: previewFile.size, name: previewFile.name },
      }));
    }
    messageService.sendMessageRest({
      receiverId,
      content: previewCaption,
      type: messageType,
      replyToMessageId: replyTo?.messageId || null,
      system: isSystemMessage,
      attachment: previewFile,
      onUploadProgress: trackProgress ? (e) => {
        const total = e.total || previewFile.size;
        if (!total) return;
        const pct = Math.round((e.loaded / total) * 100);
        setUploadProgress(prev => ({
          ...prev,
          [tempMsg.messageId]: { percent: pct, loaded: e.loaded, total, name: previewFile.name },
        }));
      } : undefined,
    }).then((res) => {
      const saved = res?.data?.data;
      if (!saved) return;
      const realChatId = saved.chatId || selectedChatId;
      if (selectedChatId.startsWith('temp-') && realChatId !== selectedChatId) {
        queryClient.setQueryData(['messages', realChatId], (old: Message[] = []) => {
          const previousTemp = queryClient.getQueryData<Message[]>(['messages', selectedChatId]) || [];
          const withoutTemp = previousTemp.filter((m) => m.messageId !== tempMsg.messageId);
          return [...withoutTemp, saved];
        });
        updateChatsCache((oldChats, totalUnread) => {
          const filtered = oldChats.filter(c => getChatId(c) !== selectedChatId);
          return {
            chats: [...filtered, { ...saved, id: realChatId, chatId: realChatId, lastMessageAt: saved.createdAt, lastMessage: saved, unreadCount: 0 }],
            totalUnread,
          };
        });
        navigate(`/chat/${realChatId}`, { replace: true });
      } else {
        queryClient.setQueryData(['messages', selectedChatId], (old: Message[] = []) => {
          const withoutTemp = old.filter((m) => m.messageId !== tempMsg.messageId);
          return [...withoutTemp, saved];
        });
        updateChatsCache((oldChats, totalUnread) => {
          const updated = oldChats.map((c) => getChatId(c) === selectedChatId
            ? { ...c, lastMessageAt: saved.createdAt, lastMessage: saved, unreadCount: 0 }
            : c);
          return { chats: updated, totalUnread };
        });
      }
    }).catch(console.error).finally(() => {
      if (sendingStatus) sendTypingState(null);
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[tempMsg.messageId];
        return copy;
      });
    });

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewCaption('');
    setPreviewCompress(true);
    setReplyTo(null);
    setIsSystemMessage(false);
  };

  const startRecording = async () => {
    if (!selectedChatId || !selectedChat) return;
    try {
      sendTypingState('WRITING_VOICE');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recordChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      setIsRecording(true);
      setIsPausedRecording(false);
      setRecordSeconds(0);
      voiceCancelRef.current = false;
      voiceSendAfterStopRef.current = false;
      setVoiceCaption('');

      // Setup audio analyser for live level
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        volumeDataRef.current = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!analyserRef.current || !volumeDataRef.current) return;
          analyserRef.current.getByteFrequencyData(volumeDataRef.current);
          const avg = volumeDataRef.current.reduce((a, b) => a + b, 0) / volumeDataRef.current.length;
          setVoiceLevel(avg / 255); // 0..1
          voiceLevelRafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('Audio analyser init failed', err);
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setIsPausedRecording(false);
        setVoiceLevel(0);
        if (voiceLevelRafRef.current) cancelAnimationFrame(voiceLevelRafRef.current);
        voiceLevelRafRef.current = null;
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => { });
          audioContextRef.current = null;
        }
        if (voiceCancelRef.current) {
          voiceCancelRef.current = false;
          return;
        }
        if (!blob.size) return;

        const durationMs = Date.now() - recordStartRef.current;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });

        if (voiceSendAfterStopRef.current) {
          voiceSendAfterStopRef.current = false;
          sendVoiceFile(file, durationMs);
          return;
        }

        const tempUrl = URL.createObjectURL(blob);
        setVoiceDraft({ file, url: tempUrl, durationMs });
      };

      recorder.start();
    } catch (err) {
      console.error('Voice recording failed', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    sendTypingState(null);
    mediaRecorderRef.current?.stop();
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPausedRecording(true);
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPausedRecording(false);
    }
  };

  const cancelRecording = () => {
    sendTypingState(null);
    voiceCancelRef.current = true;
    stopRecording();
    setVoiceLevel(0);
    if (voiceLevelRafRef.current) cancelAnimationFrame(voiceLevelRafRef.current);
    voiceLevelRafRef.current = null;
  };

  const cancelVoiceDraft = () => {
    if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url);
    setVoiceDraft(null);
    setRecordSeconds(0);
    setVoiceCaption('');
  };

  const sendVoiceFile = (file: File, durationMs: number, url?: string) => {
    if (!selectedChat || !selectedChatId) return;
    setVoiceSending(true);
    sendTypingState('SENDING_VOICE');
    const receiverId = selectedChat.user1Id === user?.id ? selectedChat.user2Id : selectedChat.user1Id;
    const tempUrl = url || URL.createObjectURL(file);
    const tempMsg: Message = {
      messageId: `${Date.now()}-${file.name}`,
      chatId: selectedChatId,
      senderId: user?.id || '',
      receiverId,
      content: voiceCaption || '',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'VOICE',
      replyToMessageId: replyTo?.messageId || null,
      system: false,
      attachmentUrl: tempUrl,
      attachmentName: file.name,
      attachmentDurationMs: durationMs,
    };
    queryClient.setQueryData(['messages', selectedChatId], (old: Message[] = []) => [...old, tempMsg]);

    const trackProgress = file.size > 1_000_000;
    if (trackProgress) {
      setUploadProgress(prev => ({
        ...prev,
        [tempMsg.messageId]: { percent: 0, loaded: 0, total: file.size, name: file.name },
      }));
    }

    messageService.sendMessageRest({
      receiverId,
      content: '',
      type: 'VOICE',
      replyToMessageId: replyTo?.messageId || null,
      system: false,
      attachmentDurationMs: durationMs,
      attachment: file,
      onUploadProgress: trackProgress ? (e) => {
        const total = e.total || file.size;
        if (!total) return;
        const pct = Math.round((e.loaded / total) * 100);
        setUploadProgress(prev => ({
          ...prev,
          [tempMsg.messageId]: { percent: pct, loaded: e.loaded, total, name: file.name },
        }));
      } : undefined,
    }).then((res) => {
      const saved = res?.data?.data;
      if (!saved) return;
      queryClient.setQueryData(['messages', selectedChatId], (old: Message[] = []) => {
        const withoutTemp = old.filter((m) => m.messageId !== tempMsg.messageId);
        return [...withoutTemp, saved];
      });
    }).catch(console.error).finally(() => {
      if (!url) URL.revokeObjectURL(tempUrl);
      sendTypingState(null);
      setVoiceSending(false);
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[tempMsg.messageId];
        return copy;
      });
      setRecordSeconds(0);
      setVoiceCaption('');
      setMessageInput('');
    });
  };

  const sendVoiceDraft = () => {
    if (!voiceDraft) return;
    const { file, url, durationMs } = voiceDraft;
    setVoiceDraft(null);
    sendVoiceFile(file, durationMs, url);
    setRecordSeconds(0);
    setVoiceCaption('');
  };


  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewCaption('');
    setPreviewCompress(true);
  };

  const handleCancelFileModal = () => setFileModal(null);

  const handleSendFileModal = () => {
    if (!fileModal || !selectedChat || !selectedChatId) return;
    const { file, caption } = fileModal;
    if (file.size > MAX_FILE_BYTES) {
      showSizeError(file.name);
      return;
    }
    const receiverId = selectedChat.user1Id === user?.id ? selectedChat.user2Id : selectedChat.user1Id;
    const tempMsg: Message = {
      messageId: `${Date.now()}-${file.name}`,
      chatId: selectedChatId,
      senderId: user?.id || '',
      receiverId,
      content: caption,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'FILE',
      replyToMessageId: replyTo?.messageId || null,
      system: isSystemMessage,
      attachmentName: file.name,
    };
    queryClient.setQueryData(['messages', selectedChatId], (old: Message[] = []) => [...old, tempMsg]);
    const trackProgress = file.size > 1_000_000;
    if (trackProgress) {
      setUploadProgress(prev => ({
        ...prev,
        [tempMsg.messageId]: { percent: 0, loaded: 0, total: file.size, name: file.name },
      }));
    }

    messageService.sendMessageRest({
      receiverId,
      content: caption,
      type: 'FILE',
      replyToMessageId: replyTo?.messageId || null,
      system: isSystemMessage,
      attachment: file,
      onUploadProgress: trackProgress ? (e) => {
        const total = e.total || file.size;
        if (!total) return;
        const pct = Math.round((e.loaded / total) * 100);
        setUploadProgress(prev => ({
          ...prev,
          [tempMsg.messageId]: { percent: pct, loaded: e.loaded, total, name: file.name },
        }));
      } : undefined,
    }).then((res) => {
      const saved = res?.data?.data;
      if (!saved) return;
      queryClient.setQueryData(['messages', selectedChatId], (old: Message[] = []) => {
        const withoutTemp = old.filter((m) => m.messageId !== tempMsg.messageId);
        return [...withoutTemp, saved];
      });
    }).catch(console.error).finally(() => {
      sendTypingState(null);
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[tempMsg.messageId];
        return copy;
      });
    });

    setFileModal(null);
    setReplyTo(null);
    setIsSystemMessage(false);
  };

  return (
    <div
      className={cn("flex h-screen overflow-hidden", shellClass)}
      style={{ fontFamily: "'Inter', 'Inter var', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Left Rail - Chats */}
      <aside className={cn("w-full md:w-80 lg:w-96 border-r flex flex-col", isDark ? "bg-[#17212B] border-slate-800" : "bg-[#f3f8ff] border-slate-200")}>
        <header className={cn("p-4 border-b flex items-center justify-between", isDark ? "bg-[#17212B] border-slate-800" : "bg-white border-slate-200")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.firstname?.[0] || '?'}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-none">{user?.firstname}</h2>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
              className={cn("p-2 rounded-lg transition-all", isDark ? "text-amber-300 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100")}
              title="Tema"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => navigate('/profile')} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="p-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Qidirish..."
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 outline-none transition-all",
                isDark ? "bg-slate-800 border border-slate-700 text-slate-100" : "bg-white border border-slate-200 text-slate-800"
              )}
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearchOpen(true); setShowEmojiPicker(false); }}
              onFocus={() => { if (searchInput.trim()) setSearchOpen(true); setShowEmojiPicker(false); }}
            />
            {searchInput.trim().length > 0 && searchOpen && (
              <div className={cn(
                "absolute left-0 right-0 top-full mt-2 rounded-xl shadow-2xl z-30 max-h-72 overflow-y-auto border",
                isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              )}>
                {searchLoading ? (
                  <div className="p-3 text-xs text-slate-500">Qidirilmoqda...</div>
                ) : (searchResults?.length ?? 0) === 0 ? (
                  <div className="p-3 text-xs text-slate-400">Hech narsa topilmadi</div>
                ) : (
                  searchResults?.map((u) => {
                    const chatForUser = chats.find(c => c.user1Id === u.id || c.user2Id === u.id);
                    return (
                      <button
                        key={u.id}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                          isDark ? "hover:bg-slate-800 focus:bg-slate-800/90" : "hover:bg-slate-50 focus:bg-slate-100"
                        )}
                        onClick={() => {
                          setSearchInput('');
                          setSearchOpen(false);
                          setShowEmojiPicker(false);
                          const chatId = chatForUser ? getChatId(chatForUser) : null;
                          if (chatId) {
                            navigate(`/chat/${chatId}`);
                            return;
                          }
                          // Create a temporary chat so user can start messaging; will be replaced on first send response
                          const tempId = `temp-${u.id}`;
                          updateChatsCache((oldChats, totalUnread) => {
                            if (oldChats.find(c => getChatId(c) === tempId)) return { chats: oldChats, totalUnread };
                            return {
                              chats: [
                                ...oldChats,
                                {
                                  id: tempId,
                                  chatId: tempId,
                                  user1Id: user?.id,
                                  user2Id: u.id,
                                  createdAt: new Date().toISOString(),
                                  lastMessageAt: new Date().toISOString(),
                                  otherUser: { id: u.id, firstname: u.firstname, lastname: u.lastname, username: u.username, avatarUrl: u.avatarUrl },
                                  unreadCount: 0,
                                }
                              ],
                              totalUnread,
                            };
                          });
                          navigate(`/chat/${tempId}`);
                        }}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden", isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600")}>
                          {u.avatarUrl ? <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" /> : (u.firstname?.[0] || u.username?.[0] || '?')}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={cn("text-sm font-semibold truncate", isDark ? "text-slate-100" : "text-slate-800")}>{u.firstname} {u.lastname}</span>
                          <span className={cn("text-[11px] truncate", isDark ? "text-slate-400" : "text-slate-500")}>@{u.username}</span>
                        </div>
                        {chatForUser ? (
                          <span className={cn("ml-auto text-[10px] font-semibold", isDark ? "text-emerald-400" : "text-emerald-600")}>Suhbat</span>
                        ) : (
                          <span className={cn("ml-auto text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>Topilmadi</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suhbatlar</h3>
            {totalUnread > 0 && (
              <span className="text-[11px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
            {messageMenu && (
              <div
                className="fixed z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                style={{ top: messageMenu.y, left: messageMenu.x }}
                onMouseLeave={() => setMessageMenu(null)}
              >
                {[
                  { label: 'Reply', icon: <Reply size={16} />, action: () => { setReplyTo(messageMenu.message); } },
                  { label: 'Forward', icon: <ExternalLink size={16} />, action: () => setToastMessage('Forward not implemented') },
                  { label: 'Download', icon: <ArrowDown size={16} />, action: async () => {
                      const msg = messageMenu.message;
                      if (!msg.messageId) return;
                      try {
                        const res = await messageService.downloadAttachment(msg.messageId);
                        const blobUrl = URL.createObjectURL(res.data);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = msg.attachmentName || 'file';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(blobUrl);
                      } catch (err: any) {
                        const status = err?.response?.status;
                        if (status === 401 || status === 403) setErrorMessage('Ruxsat yoвЂq');
                        else setErrorMessage('Fayl topilmadi yoki yuklab olishda xatolik');
                      }
                    } },
                  canEditMessage(messageMenu.message) ? { label: 'Edit', icon: <Square size={16} />, action: () => handleEditMessage(messageMenu.message) } : null,
                  { label: 'Delete', icon: <Trash2 size={16} />, action: () => handleDeleteMessage(messageMenu.message), danger: true },
                ].filter(Boolean).map((item: any, idx) => (
                  <button
                    key={item.label}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-slate-50",
                      item.danger ? "text-red-600 font-semibold" : "text-slate-700",
                      idx === 0 && "pt-3",
                      idx === 4 && "pb-3"
                    )}
                    onClick={() => {
                      item.action?.();
                      setMessageMenu(null);
                    }}
                  >
                    <span className={item.danger ? "text-red-500" : "text-slate-500"}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {chatsLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-3 animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Hali hech qanday suhbatlar yo'q</div>
          ) : chats.map((chat) => {
            const chatId = getChatId(chat);
            const otherId = chat.user1Id === user?.id ? chat.user2Id : chat.user1Id;
            const other = queryClient.getQueryData<User | null>(['user', otherId]);
            const unread = chat.unreadCount || 0;
            const lastMsg = (chat as any).lastMessage as Message | undefined;
            const lastPreview = (() => {
              if (!lastMsg) return "Xabar yo'q";
              const preview = formatPreviewText(lastMsg);
              const clipped = preview.length > 50 ? (preview.slice(0, 50) + "...") : preview;
              if (lastMsg.replyToMessageId) return "Javob: " + clipped;
              if (lastMsg.type === "SYSTEM" || lastMsg.system) return clipped;
              return clipped;
            })();
            return (
              <button
                key={chatId || chat?.id || Math.random().toString()}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (chatId) setContextMenu({ chatId, x: e.clientX, y: e.clientY });
                }}
                onMouseDown={(e) => {
                  if (!chatId) return;
                  longPressTriggeredRef.current = false;
                  const { clientX, clientY } = e;
                  longPressTimerRef.current = setTimeout(() => {
                    longPressTriggeredRef.current = true;
                    setContextMenu({ chatId, x: clientX, y: clientY });
                  }, 600);
                }}
                onMouseUp={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onClick={(e) => {
                  if (longPressTriggeredRef.current) {
                    longPressTriggeredRef.current = false;
                    return;
                  }
                  if (chatId) navigate(`/chat/${chatId}`);
                }}
                className={cn(
                  "relative w-full p-3 flex items-center gap-3 rounded-2xl transition-all group",
                  selectedChatId === chatId
                    ? (isDark ? "bg-slate-800 border border-sky-800 shadow-lg shadow-sky-900/40" : "bg-[#d7e8ff] shadow-lg shadow-sky-200")
                    : (isDark ? "hover:bg-slate-800/70" : "hover:bg-white")
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 overflow-hidden",
                  selectedChatId === chatId
                    ? (isDark ? "bg-slate-900 border-sky-700 text-sky-300" : "bg-white border-sky-200 text-sky-600")
                    : (isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-transparent text-slate-600")
                )}>
                  {other?.avatarUrl || (chat as any)?.otherUser?.avatarUrl ? (
                    <img src={(other?.avatarUrl || (chat as any)?.otherUser?.avatarUrl) as string} alt={other?.username || (chat as any)?.otherUser?.username} className="w-full h-full object-cover" />
                  ) : (
                    (other?.firstname?.[0] || (chat as any)?.otherUser?.firstname?.[0] || chatId?.[0] || '?')
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={cn("font-bold text-sm truncate", selectedChatId === chatId ? (isDark ? "text-sky-300" : "text-sky-700") : (isDark ? "text-slate-100" : "text-slate-900"))}>
                      {other?.firstname || (chat as any)?.otherUser?.firstname || `User #${otherId.slice(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <span className={cn("min-w-[22px] px-2 py-0.5 rounded-full text-[10px] font-bold text-center", isDark ? "bg-sky-600 text-sky-50" : "bg-sky-500 text-white")}>
                          {unread}
                        </span>
                      )}
                      <span className={cn("text-[10px]", selectedChatId === chatId ? (isDark ? "text-sky-300" : "text-sky-500") : (isDark ? "text-slate-400" : "text-slate-500"))}>
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    (lastMsg?.type === 'SYSTEM' || lastMsg?.system) ? (isDark ? "text-slate-500" : "text-slate-400") :
                    selectedChatId === chatId ? (isDark ? "text-sky-300" : "text-sky-600") : (isDark ? "text-slate-400" : "text-slate-500")
                  )}>
                    {lastPreview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={cn("flex-1 flex flex-col relative", isDark ? "bg-[#0E1621]" : "bg-[#e5eef5]")}>
        {selectedChat ? (
          <>
            <header className={cn("p-4 border-b flex items-center justify-between z-10", isDark ? "bg-[#0E1621] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900")}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold overflow-hidden">
                  {otherUserDisplay?.avatarUrl ? (
                    <img src={otherUserDisplay.avatarUrl} alt={otherUserDisplay.username} className="w-full h-full object-cover" />
                  ) : (
                    (selectedChatId && selectedChatId[0]) || '?'
                  )}
                </div>
                <div>
                  <h2 className={cn("font-bold text-sm", isDark ? "text-slate-100" : "text-slate-900")}>
                    {otherUserDisplay?.firstname || otherUserDisplay?.username || `User #${selectedChat.user1Id === user?.id ? selectedChat.user2Id.slice(0, 8) : selectedChat.user1Id.slice(0, 8)}`}
                  </h2>
                  {isOtherTyping ? (
                    <span className={cn("text-[10px] font-semibold flex items-center gap-1",
                      otherTypingType && otherTypingType.startsWith('SENDING')
                        ? (isDark ? "text-amber-300" : "text-amber-600")
                        : (isDark ? "text-sky-300" : "text-sky-600"))}>
                      <span className={cn("w-2 h-2 rounded-full animate-pulse",
                        otherTypingType && otherTypingType.startsWith('SENDING')
                          ? (isDark ? "bg-amber-300" : "bg-amber-500")
                          : (isDark ? "bg-sky-300" : "bg-sky-500"))} />
                      {(otherTypingLabel || 'Yozmoqda') + '...'}
                    </span>
                  ) : otherUserDisplay?.online ? (
                    <span className="text-[10px] font-semibold flex items-center gap-1 text-[#4BB34B]">
                      <span className="w-2 h-2 rounded-full bg-[#4BB34B] animate-pulse" /> Online
                    </span>
                  ) : (
                    otherUserDisplay?.lastOnline && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        So'nggi faollik: {formatLastSeen(otherUserDisplay.lastOnline)}
                      </span>
                    )
                  )}
                </div>
              </div>
            <div className="flex items-center gap-2 text-slate-500">
              <button className="p-2 hover:text-sky-600"><Phone size={20} /></button>
              <button className="p-2 hover:text-sky-600"><Video size={20} /></button>
              <button className="p-2 hover:text-red-500" onClick={handleDeleteChat} title="Chatni oвЂchirish">
                <MoreVertical size={20} />
              </button>
            </div>
          </header>

            <div className={cn("px-6 py-3 border-b", isDark ? "bg-[#0E1621] border-slate-800" : "bg-white border-slate-200")}>
              <div className={cn("flex items-center gap-2 text-sm", isDark ? "text-slate-100" : "text-slate-700")}>
                <Pin size={16} className={isDark ? "text-sky-400" : "text-sky-500"} />
                <div>
                  <div className="font-semibold">Sabitlenen xabar</div>
                  <div className={cn("text-xs truncate", isDark ? "text-slate-400" : "text-slate-500")}>Chatni kuzatish uchun pinlangan ma'lumot.</div>
                </div>
              </div>
            </div>

            <div
              ref={scrollRef}
              className={cn("flex-1 overflow-y-auto p-6", isDark ? "text-slate-100" : "text-slate-900")}
              style={{ backgroundImage: isDark ? 'linear-gradient(135deg, #0f172a 0%, #111827 100%)' : 'linear-gradient(135deg, #d5f6e1 0%, #f1f9c6 100%)' }}
              onScroll={handleScroll}
            >
              <div className="max-w-5xl mx-auto w-full space-y-4">
                {activeAudioMeta && (
                  <div className="sticky top-0 z-20 pb-3">
                    <div className={cn(
                      "relative max-w-xl rounded-2xl px-4 py-3 shadow-lg flex items-center gap-4",
                      isDark
                        ? "bg-[#0f1627]/95 border border-slate-800 backdrop-blur"
                        : "bg-white/95 border border-slate-200 backdrop-blur"
                    )}>
                      <div className={cn(
                        "hidden sm:flex w-11 h-11 rounded-full items-center justify-center shadow-inner",
                        isDark ? "bg-slate-900 border border-slate-700 text-slate-200" : "bg-slate-50 border border-slate-200 text-slate-600"
                      )}>
                        <Volume2 size={18} />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            "w-9 h-9 rounded-full border flex items-center justify-center transition-all",
                            isDark
                              ? "border-slate-700 text-slate-200 hover:border-sky-400 hover:text-sky-200 disabled:border-slate-800 disabled:text-slate-600"
                              : "border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-600 disabled:border-slate-200 disabled:text-slate-300"
                          )}
                          onClick={playPrevAudio}
                          disabled={
                            activeAudioChatIdRef.current !== currentQueueChatIdRef.current ||
                            !getPrevAudio(activeAudioMessageIdRef.current || '')
                          }
                          aria-label="Oldingi audio"
                        >
                          <SkipBack size={16} />
                        </button>
                        <button
                          type="button"
                          className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md hover:bg-sky-600 active:scale-[0.98] transition-all"
                          onClick={() => handlePlayPause(activeAudioMeta.url, activeAudioMeta.label || 'Audio', activeAudioMeta.messageId || undefined)}
                        >
                          {audioProgress[activeAudioMeta.url]?.playing ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "w-9 h-9 rounded-full border flex items-center justify-center transition-all",
                            isDark
                              ? "border-slate-700 text-slate-200 hover:border-sky-400 hover:text-sky-200 disabled:border-slate-800 disabled:text-slate-600"
                              : "border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-600 disabled:border-slate-200 disabled:text-slate-300"
                          )}
                          onClick={playNextAudio}
                          disabled={
                            activeAudioChatIdRef.current !== currentQueueChatIdRef.current ||
                            !getNextAudio(activeAudioMessageIdRef.current || '')
                          }
                          aria-label="Keyingi audio"
                        >
                          <SkipForward size={16} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className={cn("text-sm font-semibold truncate", isDark ? "text-slate-50" : "text-slate-800")} title={activeAudioMeta.label || undefined}>
                          {activeAudioMeta.label || 'Audio'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={isDark ? "text-slate-300" : "text-slate-600"}>{formatDuration((audioProgress[activeAudioMeta.url]?.current || 0) * 1000)}</span>
                          <span className={isDark ? "text-slate-500" : "text-slate-400"}>/</span>
                          <span className={isDark ? "text-slate-300" : "text-slate-600"}>{formatDuration((audioProgress[activeAudioMeta.url]?.duration || 0) * 1000)}</span>
                        </div>
                        <div className={cn("h-1.5 rounded-full overflow-hidden cursor-pointer", isDark ? "bg-slate-700" : "bg-slate-200")}>
                          <div
                            className="h-full bg-sky-500 transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, ((audioProgress[activeAudioMeta.url]?.current || 0) / Math.max(1e-6, audioProgress[activeAudioMeta.url]?.duration || 0)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                            isDark ? "text-slate-300 hover:text-sky-200 hover:bg-slate-800" : "text-slate-500 hover:text-sky-600 hover:bg-slate-100"
                          )}
                          onClick={() => setShowPlayerQueue((v) => !v)}
                          aria-label="Ro'yxatni ko'rish"
                        >
                          <ListMusic size={16} />
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                            isDark ? "text-slate-400 hover:text-red-400 hover:bg-slate-800" : "text-slate-400 hover:text-red-500 hover:bg-slate-100"
                          )}
                          onClick={stopActiveAudio}
                          aria-label="Playerni yopish"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {showPlayerQueue && ((activeQueueSnapshot.items?.length || 0) > 0 || (audioQueue?.length || 0) > 0) && (
                        <div className={cn(
                          "absolute left-0 right-0 top-[110%] mt-2 rounded-xl border shadow-xl max-h-64 overflow-y-auto",
                          isDark ? "bg-[#0f172a] border-slate-700" : "bg-white border-slate-200"
                        )}>
                          {(activeQueueSnapshot.items || []).map((item) => {
                            const isActive = activeAudioMessageIdRef.current === item.id || activeAudioMeta?.url === item.url;
                            return (
                              <button
                                key={item.id || item.url}
                                type="button"
                                className={cn(
                                  "w-full text-left px-3 py-2 flex items-center gap-3 transition-colors",
                                  isActive
                                    ? (isDark ? "bg-sky-900/40 text-sky-100" : "bg-sky-50 text-sky-800")
                                    : (isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50")
                                )}
                                onClick={() => handlePlayPause(item.url, item.label || 'Audio', item.id, activeAudioChatIdRef.current, false)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 flex items-center justify-center text-[10px] font-semibold">
                                  {item.label?.slice(0, 2)?.toUpperCase() || 'AU'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold truncate">{item.label || 'Audio'}</div>
                                </div>
                                {isActive ? (
                                  <span className="text-[11px] text-sky-500 font-semibold">Now</span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {messagesLoading ? (
                  <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : messagesData?.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  const isReplying = replyTo && replyTo.messageId === msg.messageId;
                  const isSystem = msg.system || msg.type === 'SYSTEM';
                  const isEdited = Boolean((msg as any)?.edited || (msg as any)?.editedAt || (msg as any)?.updatedAt);
                  const replyTarget = msg.replyToMessageId
                    ? messagesData?.find(m => m.messageId === msg.replyToMessageId)
                    : null;
                  const contentSegments = chunkText(msg.content || '', MAX_MESSAGE_LEN);
                  const firstSegment = contentSegments[0] || '';
                  const { onlyEmoji: firstOnlyEmoji } = parseEmojiOnly(firstSegment);
                  const msgEmojiSolo = contentSegments.length === 1 && firstOnlyEmoji;
                  const bubbleStyle = !isSystem && !msgEmojiSolo ? { maxWidth: '520px', width: 'fit-content', minWidth: '120px' } : undefined;
                  const progress = uploadProgress[msg.messageId];
                  const hasAttachment = Boolean(msg.attachments?.length || msg.attachmentUrl);
                  return (
                    <div key={msg.messageId || i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      {replyTarget && (
                        <div className={cn("mb-2 w-full max-w-[75%] rounded-xl px-3 py-2 text-[12px] shadow-sm flex gap-2 items-start", isDark ? "border border-slate-700 bg-slate-800 text-slate-100" : "border border-slate-200 bg-white/80 text-slate-700")}>
                          <span className="w-[3px] rounded-full bg-sky-400 mt-0.5" aria-hidden />
                          <div className="flex-1 min-w-0">
                            <div className={cn("text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-500")}>Javob</div>
                            <div className={cn("text-[11px] font-medium truncate", isDark ? "text-slate-200" : "text-slate-600")}>
                              {formatPreviewText(replyTarget)}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[60%] rounded-xl text-sm space-y-2 transition-all duration-150",
                        msgEmojiSolo
                          ? "bg-transparent border-none shadow-none px-2 py-1"
                          : cn("px-4 py-2", bubbleBg(isMe, isSystem, msgEmojiSolo))
                      )} style={{ ...bubbleStyle, wordBreak: 'break-word', overflowWrap: 'anywhere' }} onContextMenu={(e) => {
                        e.preventDefault();
                        setMessageMenu({ message: msg, x: e.clientX, y: e.clientY });
                      }}>
                        {!hasAttachment && contentSegments.map((seg, idx) => {
                          const { onlyEmoji, count: emojiCount } = parseEmojiOnly(seg || '');
                          const isEmojiSolo = contentSegments.length === 1 && onlyEmoji && emojiCount > 0;
                          const emojiFont = isEmojiSolo
                            ? emojiCount === 1 ? 40
                              : emojiCount === 2 ? 34
                                : 30
                            : undefined;
                          const textClass = cn(
                            "cursor-pointer break-words whitespace-pre-wrap",
                            isEmojiSolo && "inline-flex items-center justify-center gap-2 whitespace-nowrap",
                            !isEmojiSolo && "max-h-64 overflow-y-auto"
                          );
                          return (
                            <div
                              key={idx}
                              className={textClass}
                              style={isEmojiSolo && emojiFont ? { fontSize: `${emojiFont}px`, lineHeight: 1.15 } : undefined}
                            >
                              {isEmojiSolo ? seg : renderFormatted(seg)}
                            </div>
                          );
                        })}
                        {(msg.attachments?.length || msg.attachmentUrl) ? (
                          <div className="space-y-2">
                            {msg.attachments?.map((att, idx) => {
                              if (att.type === 'image') {
                                return (
                                  <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <img src={att.url} alt={att.name} className="max-h-64 w-full object-cover" />
                                  </div>
                                );
                              }
                              if (att.type === 'video') {
                                return (
                                  <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow">
                                    <video src={att.url} controls className="w-full max-h-72 bg-black" />
                                  </div>
                                );
                              }
                              if (att.type === 'audio') {
                                return (
                                  <div key={idx}>
                                    {renderAudioBubble(
                                      att.url,
                                      att.name || 'Audio',
                                      att.size,
                                      att.durationSeconds ? att.durationSeconds * 1000 : msg.attachmentDurationMs,
                                      'green',
                                      msg.messageId,
                                      msg.chatId
                                    )}
                                  </div>
                                );
                              }
                              if (att.type === 'voice') {
                                return (
                                  <div key={idx}>
                                    {renderVoiceBubble(att.url, att.durationSeconds ? att.durationSeconds * 1000 : msg.attachmentDurationMs, undefined, att.size, msg.messageId, msg.chatId)}
                                  </div>
                                );
                              }
                              return (
                                <div key={idx} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#eef8ea] px-3 py-2 shadow-sm">
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center uppercase text-xs font-bold">
                                    {(att.name || 'file').split('.').pop()?.slice(0, 3) || 'file'}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <a href={att.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-800 truncate">
                                      {att.name || 'Fayl'}
                                    </a>
                                    {att.size ? (
                                      <span className="text-xs text-emerald-600 font-semibold">{formatBytes(att.size)}</span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                            {msg.attachmentUrl && (
                              msg.type === 'IMAGE' ? (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                  <img src={msg.attachmentUrl} alt={msg.attachmentName} className="max-h-64 w-full object-cover" />
                                </div>
                              ) :
                                msg.type === 'VIDEO' ? (
                                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow">
                                    <video src={msg.attachmentUrl} controls className="w-full max-h-72 bg-black" />
                                  </div>
                                ) :
                              msg.type === 'AUDIO' ? (
                                renderAudioBubble(
                                  msg.attachmentUrl || '',
                                  msg.attachmentName || 'Audio',
                                  msg.attachmentSize,
                                  msg.attachmentDurationMs,
                                  'blue',
                                  msg.messageId,
                                  msg.chatId
                                )
                              ) :
                              msg.type === 'VOICE' ? (
                                renderVoiceBubble(
                                  msg.attachmentUrl || '',
                                  msg.attachmentDurationMs,
                                  msg.attachmentName,
                                  msg.attachmentSize,
                                  msg.messageId,
                                  msg.chatId
                                )
                              ) :
                                    (
                                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#eef8ea] px-3 py-2 shadow-sm">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center uppercase text-xs font-bold">
                                          {(msg.attachmentName || 'file').split('.').pop()?.slice(0, 3) || 'file'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-800 truncate">
                                            {msg.attachmentName || 'Fayl'}
                                          </a>
                                          {msg.attachmentSize ? (
                                            <span className="text-xs text-emerald-600 font-semibold">{formatBytes(msg.attachmentSize)}</span>
                                          ) : null}
                                        </div>
                                      </div>
                                    )
                            )}
                            {msg.content ? (
                              <div className="text-xs text-slate-700">{msg.content}</div>
                            ) : null}
                          </div>
                        ) : null}
                        {isReplying && <div className="text-[10px] text-emerald-300">Tanlangan javob</div>}
                {progress && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full max-w-xs">
                            <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[11px] font-bold uppercase">
                              {(msg.attachmentName || progress.name || 'UP').split('.').pop()?.slice(0, 3) || 'UP'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold text-slate-700 truncate">
                                {msg.attachmentName || progress.name || 'Yuklanmoqda...'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {progress.loaded !== undefined && progress.total
                                  ? `${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`
                                  : `${progress.percent}%`}
                              </div>
                              <div className="mt-1 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-500 transition-all"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-2 text-[9px] text-slate-400 mx-1 font-medium justify-end", msgEmojiSolo ? "mt-2" : "mt-1")}>
                        <div className="flex items-center gap-1">
                          {isMe && (
                            msg.read
                              ? <CheckCheck size={12} className="text-sky-500" />
                              : <Check size={12} className="text-slate-400" />
                          )}
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                        {isEdited && <span className="text-[9px] text-slate-500">(dГјzenlendi)</span>}
                        {isMe && canEditMessage(msg) && (
                          <button
                            type="button"
                            className={cn("text-slate-400 hover:text-slate-700 transition-colors", "opacity-0 group-hover:opacity-100")}
                            onClick={() => handleEditMessage(msg)}
                            title="Xabarni tahrirlash"
                          >
                            <Square size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {showScrollToBottom && (
              <button
                onClick={() => {
                  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }}
                className="absolute right-8 bottom-24 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-sky-600"
                title="Pastga o'tish"
              >
                <ArrowDown size={18} />
              </button>
            )}
            {errorMessage && (
              <div className="absolute right-8 bottom-36 max-w-xs bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl shadow">
                {errorMessage}
              </div>
            )}
            {toastMessage && (
              <div className="absolute right-8 bottom-48 max-w-xs bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl shadow">
                {toastMessage}
              </div>
            )}
            {contextMenu && (
              <div
                className="fixed z-50 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onMouseLeave={() => setContextMenu(null)}
              >
                {[
                  { label: 'Open in New Tab', icon: <ExternalLink size={16} />, action: () => { if (contextMenu?.chatId) navigate(`/chat/${contextMenu.chatId}`); } },
                  { label: 'Quick Preview', icon: <Eye size={16} />, action: () => setToastMessage('Preview not implemented') },
                  { label: 'Add to Folder', icon: <Folder size={16} />, action: () => setToastMessage('Folder not implemented') },
                  { label: 'Mark as Unread', icon: <CircleDot size={16} />, action: () => setToastMessage('Marked as unread (local)') },
                  { label: 'Pin to Top', icon: <Pin size={16} />, action: () => setToastMessage('Pinned (local)') },
                  { label: 'Unmute', icon: <BellOff size={16} />, action: () => setToastMessage('Unmuted (local)') },
                  { label: 'Delete Chat', icon: <Trash2 size={16} />, action: () => handleDeleteChat(contextMenu?.chatId), danger: true },
                ].map((item, idx) => (
                  <button
                    key={item.label}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-slate-50",
                      item.danger ? "text-red-600 font-semibold" : "text-slate-700",
                      idx === 0 && "pt-3",
                      idx === 6 && "pb-3"
                    )}
                    onClick={() => {
                      item.action?.();
                      setContextMenu(null);
                    }}
                  >
                    <span className={item.danger ? "text-red-500" : "text-slate-500"}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
            {pendingDeleteChatId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h3 className="text-base font-semibold text-slate-900">Chatni oвЂchirish</h3>
                  </div>
                  <div className="px-5 py-4 text-sm text-slate-700">
                    Chatni oвЂchirib tashlamoqchimisiz? Barcha xabarlar ham oвЂchiriladi.
                  </div>
                  <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
                      onClick={() => setPendingDeleteChatId(null)}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600"
                      onClick={() => confirmDeleteChat()}
                    >
                      OвЂchirish
                    </button>
                  </div>
                </div>
              </div>
            )}

            <footer className={cn("p-4 border-t", isDark ? "bg-[#0b1220] border-slate-800" : "bg-white border-slate-200")}>
              <div className={cn("flex flex-col gap-2 rounded-2xl max-w-5xl mx-auto border",
                isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200")}>
                {replyTo && (
                  <div className="relative flex items-center gap-2 bg-slate-100 text-xs text-slate-600 px-3 py-2 rounded-t-2xl">
                    <span className="absolute left-1 top-1 bottom-1 w-[3px] rounded-full bg-sky-400" aria-hidden />
                    <div className="ml-3 flex-1 truncate">
                      <span className="text-slate-500">↩ Javob:</span>{' '}
                      <span className="font-semibold truncate inline-block max-w-full">
                        {(() => {
                          const prev = formatPreviewText(replyTo);
                          return prev.length > 50 ? `${prev.slice(0, 50)}…` : prev;
                        })()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setReplyTo(null); setMessageInput(''); }}
                      className="text-slate-400 hover:text-red-500 hover:bg-white/60 rounded-full p-1 transition-colors"
                      title="Javobni bekor qilish"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {isRecording ? (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <label className="text-slate-400 hover:text-sky-600 cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,application/*"
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828M8 16h.01" />
                      </svg>
                    </label>
                    <textarea
                      ref={messageInputRef}
                      placeholder="Message"
                      rows={1}
                      className="flex-1 bg-transparent border border-slate-200 rounded-full shadow-sm focus:ring-0 outline-none text-sm text-slate-800 px-3 py-2 placeholder:text-slate-400 resize-none"
                      value={messageInput}
                      onChange={handleTyping}
                      onPaste={handlePaste}
                      style={{ maxHeight: '240px' }}
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                        <span>{String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')}</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      <button
                        type="button"
                        onClick={pauseRecording}
                        className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm flex items-center justify-center"
                        title={isPausedRecording ? "Davom ettirish" : "Pauza"}
                      >
                        {isPausedRecording ? <Play size={18} /> : <Pause size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="w-10 h-10 rounded-full border border-red-100 bg-white text-red-500 hover:bg-red-50 shadow-sm flex items-center justify-center"
                        title="Voice yozuvni bekor qilish"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceCaption(messageInput.slice(0, MAX_MESSAGE_LEN));
                          voiceSendAfterStopRef.current = true;
                          stopRecording();
                        }}
                        className="w-10 h-10 rounded-full bg-sky-500 text-white hover:bg-sky-600 shadow-sm flex items-center justify-center"
                        title="Voice yuborish (Caption sifatida matn jo'natiladi)"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                ) : voiceDraft ? (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 flex flex-col gap-2">
                      <audio controls src={voiceDraft.url} className="w-full" />
                      <input
                        value={voiceCaption}
                        onChange={(e) => setVoiceCaption(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                        placeholder="Izoh qo'shish..."
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-xs text-slate-500 w-16">
                      <span>{(voiceDraft.durationMs / 1000).toFixed(1)} s</span>
                      <button
                        type="button"
                        onClick={cancelVoiceDraft}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg"
                        title="Bekor qilish"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={sendVoiceDraft}
                        className="text-white bg-sky-500 hover:bg-sky-600 px-3 py-2 rounded-lg text-sm font-semibold shadow"
                        title="Yuborish"
                      >
                        Yuborish
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {attachments.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-2">
                        {attachments.map((file) => {
                          const key = fileKey(file);
                          const url = attachmentPreviews[key];
                          const duration = attachmentDurations[key] ? attachmentDurations[key] * 1000 : undefined;
                          const type = pickMessageType(file);
                          const remove = () => setAttachments((prev) => prev.filter((f) => fileKey(f) !== key));
                          return (
                            <div key={key} className="relative">
                              <button
                                type="button"
                                onClick={remove}
                                className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 hover:text-red-500"
                                aria-label="Remove attachment"
                              >
                                <X size={14} />
                              </button>
                              {type === 'VOICE' && url ? (
                                <>
                                  {renderVoiceBubble(url, duration, undefined, undefined, undefined, selectedChatId)}
                                  <audio
                                    src={url}
                                    className="hidden"
                                    onLoadedMetadata={(e) => {
                                      const dur = (e.currentTarget as HTMLAudioElement | null)?.duration || 0;
                                      setAttachmentDurations((prev) => ({ ...prev, [key]: dur }));
                                    }}
                                  />
                                </>
                              ) : type === 'AUDIO' && url ? (
                                <>
                                  {renderAudioBubble(url, file.name, file.size, duration, 'blue', undefined, selectedChatId)}
                                  <audio
                                    src={url}
                                    className="hidden"
                                    onLoadedMetadata={(e) => {
                                      const dur = (e.currentTarget as HTMLAudioElement | null)?.duration || 0;
                                      setAttachmentDurations((prev) => ({ ...prev, [key]: dur }));
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center uppercase text-xs font-bold">
                                    {(file.name || 'file').split('.').pop()?.slice(0, 3) || 'file'}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-slate-800 truncate">{file.name}</span>
                                    <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isOtherTyping && (
                      <div className={cn("flex items-center gap-2 text-xs px-3 py-1 rounded-full self-start",
                        otherTypingType && otherTypingType.startsWith('SENDING')
                          ? (isDark ? "text-amber-200 bg-amber-900/30 border border-amber-800" : "text-amber-700 bg-amber-50 border border-amber-100")
                          : (isDark ? "text-sky-200 bg-sky-900/30 border border-sky-800" : "text-sky-700 bg-sky-50 border border-sky-100"))}>
                        <span className={cn("w-2 h-2 rounded-full animate-pulse",
                          otherTypingType && otherTypingType.startsWith('SENDING')
                            ? (isDark ? "bg-amber-300" : "bg-amber-500")
                            : (isDark ? "bg-sky-300" : "bg-sky-500"))} />
                        {otherTypingLabel ? `${otherTypingLabel}...` : "Yozmoqda..."}
                      </div>
                    )}
                    {voiceSending && (
                      <div className={cn("flex items-center gap-2 text-xs px-3 py-1 rounded-full self-start",
                        isDark ? "text-amber-200 bg-amber-900/30 border border-amber-800" : "text-amber-700 bg-amber-50 border border-amber-100")}>
                        <span className={cn("w-2 h-2 rounded-full animate-pulse", isDark ? "bg-amber-300" : "bg-amber-500")} />
                        Ovozli xabar yuborilmoqda...
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className={cn("flex items-end gap-3 px-4 py-3 border rounded-2xl shadow-sm transition-colors", isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200", replyTo ? "ring-1 ring-sky-400/50" : "")}>
                      <div className="flex items-end gap-2 flex-1">
                        <label className={cn("cursor-pointer flex items-center justify-center w-10 h-10 rounded-full border transition-colors", isDark ? "text-slate-400 hover:text-sky-300 bg-slate-800 border-slate-700" : "text-slate-500 hover:text-sky-600 bg-slate-100 border-slate-200")}>
                          <input
                            type="file"
                            multiple
                            accept="audio/*,image/*,video/*,application/*"
                            onChange={handleAttachmentChange}
                            className="hidden"
                          />
                          <Paperclip className="w-5 h-5" />
                        </label>
                        <div className="relative flex-1 flex items-end">
                          <textarea
                            ref={messageInputRef}
                            placeholder="Bir mesaj yazin..."
                            rows={1}
                            className={cn("w-full bg-transparent border rounded-xl outline-none text-sm px-3 py-2 placeholder:text-slate-500 resize-none transition-shadow",
                              isDark ? "border-slate-700 text-slate-100 focus:ring-1 focus:ring-sky-400 focus:border-sky-500" : "border-slate-200 text-slate-800 focus:ring-1 focus:ring-sky-400 focus:border-sky-400")}
                            value={messageInput}
                            onChange={handleTyping}
                            onPaste={handlePaste}
                            style={{ maxHeight: '140px' }}
                          />
                        </div>
                        <div className="relative self-end" ref={emojiRef}>
                          <button
                            type="button"
                            className={cn("transition-colors w-10 h-10 rounded-full border flex items-center justify-center", isDark ? "text-slate-300 hover:text-sky-300 bg-slate-800 border-slate-700" : "text-slate-500 hover:text-sky-600 bg-slate-100 border-slate-200")}
                            onClick={() => { setShowEmojiPicker((v) => !v); setSearchOpen(false); }}
                          >
                          <Smile size={20} />
                        </button>
                          {showEmojiPicker && (
                            <div className="absolute z-30 w-80 max-h-64 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-y-auto grid grid-cols-8 gap-2 text-2xl transition-opacity duration-150"
                              style={{ bottom: '56px', right: 0 }}>
                              {[
                                '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🤩','😘','😗','😙','😚','😋','😛','😝','🤪','😜','🤔','🤨','🧐','🤓','😎','🥸','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡',
                                '🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👻','💀','☠️','👽','🤖',
                                '💩','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍'
                              ].map((emo) => (
                                <button
                                  key={emo}
                                  type="button"
                                  className="transition-transform duration-150 hover:scale-110 hover:bg-slate-100 rounded"
                                  onClick={() => {
                                    insertEmoji(emo);
                                    setShowEmojiPicker(false);
                                  }}
                                >
                                  {emo}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="flex items-end gap-2 self-end">
                      {!hasTypedText && attachments.length === 0 ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className={cn("w-11 h-11 rounded-full shadow-sm flex items-center justify-center transition-colors", isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
                          title="Voice yozib olish"
                        >
                          <Mic size={18} />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!messageInput.trim() && attachments.length === 0}
                          className={cn("w-11 h-11 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:shadow-none", isDark ? "bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-900/40" : "bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-200")}
                          title="Yuborish"
                        >
                          <Send size={18} />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                )}
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mb-6">
              <UserIcon size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Suhbatni boshlang</h2>
            <p className="max-w-xs text-sm">Chap tomondagi ro'yxatdan birorta foydalanuvchini tanlang va xabar almashishni boshlang.</p>
          </div>
        )}
      </main>

      {/* Right Panel - Profile */}
      {selectedChat ? (
        <aside className={cn("hidden lg:flex w-80 flex-col border-l p-4", isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900")}>
          <div className={cn("flex flex-col items-center gap-2 pb-4 border-b", isDark ? "border-slate-800" : "border-slate-200")}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {otherUserDisplay?.avatarUrl ? (
                <img src={otherUserDisplay.avatarUrl} alt={otherUserDisplay?.username} className="w-full h-full object-cover" />
              ) : (
                (otherUserDisplay?.firstname?.[0] || selectedChatId?.[0] || 'U')
              )}
            </div>
            <div className={cn("text-lg font-semibold", isDark ? "text-slate-50" : "text-slate-900")}>
              {otherUserDisplay?.firstname || otherUserDisplay?.username || 'Foydalanuvchi'}
            </div>
            <div className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
              {otherUserDisplay?.username ? `@${otherUserDisplay.username}` : ''}
            </div>
            <div className={cn("text-xs flex items-center gap-2", isDark ? "text-slate-400" : "text-slate-500")}>
              {otherUserDisplay?.online ? (
                <span className={cn("inline-flex items-center gap-1 font-semibold px-2 py-1 rounded-full border",
                  isDark ? "text-emerald-300 bg-emerald-900/30 border-emerald-800" : "text-emerald-500 bg-emerald-50 border-emerald-100")}>
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", isDark ? "bg-emerald-300" : "bg-emerald-500")} />
                  Online
                </span>
              ) : otherUserDisplay?.lastOnline ? (
                <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full border",
                  isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-50 text-slate-600 border-slate-200")}>
                  <span className={cn("w-2 h-2 rounded-full", isDark ? "bg-slate-400" : "bg-slate-300")} />
                  {formatLastSeen(otherUserDisplay.lastOnline || '')}
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button className={cn("px-3 py-1 rounded-full text-xs transition-colors",
                isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700")}>Xabar</button>
              <button className={cn("px-3 py-1 rounded-full text-xs transition-colors",
                isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700")}>Sesi</button>
              <button className={cn("px-3 py-1 rounded-full text-xs transition-colors",
                isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700")}>Hediye</button>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className={cn("flex justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
              <span>Ism</span><span>{otherUserDisplay?.firstname || '-'}</span>
            </div>
            <div className={cn("flex justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
              <span>Familiya</span><span>{otherUserDisplay?.lastname || '-'}</span>
            </div>
            {otherUserDisplay?.email && (
              <div className={cn("flex justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
                <span>Email</span><span className="truncate max-w-[140px]">{otherUserDisplay.email}</span>
              </div>
            )}
            {otherUserDisplay?.role && (
              <div className={cn("flex justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
                <span>Role</span><span>{otherUserDisplay.role}</span>
              </div>
            )}
            {!otherUserDisplay?.online && otherUserDisplay?.lastOnline && (
              <div className={cn("flex justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
                <span>Oxirgi marta</span><span className="truncate max-w-[140px]">{formatTime(otherUserDisplay.lastOnline || '')}</span>
              </div>
            )}
            {otherUserDisplay?.birthDate && (
              <div className={cn("flex justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
                <span>Tug'ilgan sana</span><span>{otherUserDisplay.birthDate}</span>
              </div>
            )}

            {otherUserDisplay?.socialLinks && Object.values(otherUserDisplay.socialLinks).some(Boolean) && (
              <details className={cn("space-y-2 border rounded-lg px-3 py-2", isDark ? "text-slate-200 bg-slate-900 border-slate-800" : "text-slate-600 bg-slate-50 border-slate-200")}>
                <summary className={cn("cursor-pointer font-semibold", isDark ? "text-slate-100" : "text-slate-700")}>Ijtimoiy tarmoqlar</summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(otherUserDisplay.socialLinks).map(([k, v]) => (
                    v ? (
                      <a
                        key={k}
                        href={v.startsWith('http') ? v : `https://${v}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn("flex items-center gap-2 rounded-lg px-3 py-2 hover:border-sky-400 hover:shadow-sm transition-colors",
                          isDark ? "bg-slate-800 border border-slate-700 text-slate-100" : "bg-white border border-slate-200 text-slate-600")}
                        title={v}
                      >
                        <span className={cn("text-lg", isDark ? "text-slate-100" : "text-slate-700")}>🔗</span>
                        <span className={cn("font-medium truncate", isDark ? "text-sky-300" : "text-sky-600")}>{v.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : null
                  ))}
                </div>
              </details>
            )}
          </div>

          <div className="mt-6 text-sm">
            <div className="font-semibold text-slate-700 mb-2">Media</div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 border border-slate-200 rounded-lg hover:border-sky-500">Rasmlar</button>
              <button className="flex-1 px-3 py-2 border border-slate-200 rounded-lg hover:border-sky-500">Videolar</button>
              <button className="flex-1 px-3 py-2 border border-slate-200 rounded-lg hover:border-sky-500">Fayllar</button>
            </div>
            <div className="mt-3 h-32 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Folder size={20} className="text-slate-400" />
              <div className="text-xs font-medium text-slate-500">Media topilmadi</div>
              <div className="text-[11px] text-slate-400">Fayllar shu yerda paydo bo‘ladi</div>
            </div>
          </div>

          <button className="mt-auto text-left text-red-500 text-sm hover:text-red-400">Foydalanuvchini bloklash</button>
        </aside>
      ) : (
        <aside className={cn("hidden lg:flex w-80 border-l", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")} />
      )}

      {/* Preview Modal for image/video */}
      {previewFile && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1f2a3a] text-slate-100 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="font-semibold text-lg">{previewFile.type.startsWith('video/') ? 'Video faylini yuborish' : 'Rasm yuborish'}</div>
              <button onClick={handleClosePreview} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-black/30 rounded-xl overflow-hidden flex items-center justify-center">
                {previewFile.type.startsWith('video/') ? (
                  <video src={previewUrl} controls className="max-h-80 w-full rounded-xl bg-black" />
                ) : (
                  <img src={previewUrl} alt={previewFile.name} className="max-h-80 w-full object-contain rounded-xl" />
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={previewCompress} onChange={(e) => setPreviewCompress(e.target.checked)} />
                Tasvirni siqish (hozircha faolsiz)
              </label>
              <div>
                <label className="text-xs text-slate-400">Izoh</label>
                <input
                  value={previewCaption}
                  onChange={(e) => setPreviewCaption(e.target.value)}
                  className="mt-1 w-full bg-slate-800 text-slate-100 rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500"
                  placeholder="Izoh yozing..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
                <button onClick={handleClosePreview} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">Bekor qilish</button>
                <button onClick={handleSendPreview} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm text-white">Yuborish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live video note preview bubble (Telegram-like) */}
      {/* File Modal for non-image/video files */}
      {fileModal && selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="font-semibold text-base">Faylni yuborish</div>
              <button onClick={handleCancelFileModal} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Paperclip size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{fileModal.file.name}</span>
                  <span className="text-xs text-slate-500">{formatBytes(fileModal.file.size)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Izoh (ixtiyoriy)</label>
                <input
                  value={fileModal.caption}
                  onChange={(e) => setFileModal({ ...fileModal, caption: e.target.value })}
                  className="mt-1 w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:border-sky-500"
                  placeholder="Izoh yozing..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
              <button onClick={handleCancelFileModal} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Bekor qilish</button>
              <button onClick={handleSendFileModal} className="px-4 py-2 rounded-lg text-sm text-white bg-sky-600 hover:bg-sky-500">Yuborish</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default function ChatDashboard() {
  return (
    <ChatErrorBoundary>
      <ChatDashboardInner />
    </ChatErrorBoundary>
  );
}




