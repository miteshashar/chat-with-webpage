import { get, set, getAllKeys } from "./storage";
import { sha256Hash } from "../utils";

export interface CachedMarkdown {
  url: string;
  markdown: string;
  title: string;
  timestamp: Date;
}

export const saveMarkdownCache = async (
  url: string,
  markdown: string,
  title: string,
): Promise<void> => {
  const hash = await sha256Hash(url);
  const key = `markdown-${hash}`;
  const cachedData: CachedMarkdown = {
    url,
    markdown,
    title,
    timestamp: new Date(),
  };
  return set(key, cachedData);
};

export const getMarkdownCache = async (
  url: string,
): Promise<CachedMarkdown | null> => {
  const hash = await sha256Hash(url);
  const key = `markdown-${hash}`;
  const cached = await get<CachedMarkdown>(key);

  if (cached) {
    return {
      ...cached,
      timestamp: new Date(cached.timestamp),
    };
  }

  return null;
};

export const getAllCachedMarkdown = async (): Promise<CachedMarkdown[]> => {
  const allKeys = await getAllKeys();
  const markdownKeys = allKeys.filter((key) => key.startsWith("markdown-"));

  const promises = markdownKeys.map(async (key) => {
    const cached = await get<CachedMarkdown>(key);
    if (cached) {
      return {
        ...cached,
        timestamp: new Date(cached.timestamp),
      };
    }
    return null;
  });

  const results = await Promise.all(promises);
  return results
    .filter((item): item is CachedMarkdown => item !== null)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
};
