import type { UploadableFile } from '@/types/api';

export interface ChatDoctor {
  doctorId: string;
  name: string;
  details: string | null;
  lastVisit: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
}

export interface ChatReplyTo {
  id: string;
  sender: 'patient' | 'doctor';
  body: string | null;
  file: { name: string; type: string } | null;
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  body: string | null;
  file: { name: string; type: string; size: number; durationMs?: number | null } | null;
  replyTo?: ChatReplyTo | null;
  createdAt: string;
}

export interface ChatPage {
  items: ChatMessage[];
  hasMore: boolean;
}

export interface SendChatMessageInput {
  doctorId: string;
  body: string;
  file: UploadableFile | null;
  replyToId?: string | null;
  durationMs?: number | null;
}

export interface PushTokenInput {
  token: string;
  platform: string;
}

export interface ChatRealtime {
  url: string;
  key: string;
  topic: string;
}
