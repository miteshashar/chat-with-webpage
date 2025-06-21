import { get, set } from "./storage";
import { sha256Hash } from "../utils";
import { STORAGE_PREFIXES } from "../constants";

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
  const key = `${STORAGE_PREFIXES.MARKDOWN}${hash}`;
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
  const key = `${STORAGE_PREFIXES.MARKDOWN}${hash}`;
  const cached = await get<CachedMarkdown>(key);

  if (cached) {
    return {
      ...cached,
      timestamp: new Date(cached.timestamp),
    };
  }

  return null;
};
