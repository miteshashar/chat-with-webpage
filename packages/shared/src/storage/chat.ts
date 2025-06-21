import { get, set, getAllKeys } from "./storage";
import { sha256Hash } from "../utils";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface CachedMarkdown {
  url: string;
  markdown: string;
  title: string;
  timestamp: Date;
}

export const saveMessage = async (
  message: Message,
  url: string,
): Promise<void> => {
  const hash = await sha256Hash(url);
  const key = `msg-${hash}-${message.role}-${message.timestamp.getTime()}`;
  return set(key, message);
};

export const getMessagesForUrl = async (url: string): Promise<Message[]> => {
  const hash = await sha256Hash(url);
  const prefix = `msg-${hash}-`;

  // Get all keys from storage
  const keys = await getAllKeys();
  const messageKeys = keys.filter((key: string) => key.startsWith(prefix));

  const messages: Message[] = [];
  for (const key of messageKeys) {
    const message = await get<Message>(key);
    if (message) {
      messages.push({
        ...message,
        timestamp: new Date(message.timestamp),
      });
    }
  }

  // Sort messages by timestamp
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export interface ChatHistoryEntry {
  url: string;
  title: string;
  lastMessageTime: Date;
  messageCount: number;
}

export const getAllChatHistory = async (): Promise<ChatHistoryEntry[]> => {
  const keys = await getAllKeys();
  const messageKeys = keys.filter((key: string) => key.startsWith("msg-"));

  // Group by URL hash
  const urlHashes = new Map<string, { messages: Message[]; hash: string }>();

  for (const key of messageKeys) {
    const message = await get<Message>(key);

    if (message) {
      // Extract hash from key: msg-{hash}-{role}-{timestamp}
      const parts = key.split("-");

      if (parts.length >= 4) {
        const hash = parts[1];

        if (!urlHashes.has(hash)) {
          urlHashes.set(hash, { messages: [], hash });
        }
        urlHashes.get(hash)!.messages.push({
          ...message,
          timestamp: new Date(message.timestamp),
        });
      }
    }
  }

  // Get URL and title for each hash, with fallback if no markdown cache
  const chatEntries: ChatHistoryEntry[] = [];

  for (const [hash, data] of urlHashes) {
    if (data.messages.length > 0) {
      const sortedMessages = data.messages.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );

      // Try to get title from markdown cache
      const markdownKey = `markdown-${hash}`;
      const cached = await get<CachedMarkdown>(markdownKey);

      // Use cached data if available, otherwise use hash as fallback
      chatEntries.push({
        url: cached?.url || `[Unknown URL - Hash: ${hash}]`,
        title: cached?.title || `Chat Session ${hash.substring(0, 8)}...`,
        lastMessageTime: sortedMessages[0].timestamp,
        messageCount: data.messages.length,
      });
    }
  }

  // Sort by last message time (newest first)
  return chatEntries.sort(
    (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime(),
  );
};
