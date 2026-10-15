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

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  body: string | null;
  file: { name: string; type: string; size: number } | null;
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
