import { get, set, getAllKeys } from "./storage";
import { sha256Hash } from "../utils";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
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
