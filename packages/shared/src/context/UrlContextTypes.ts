import { createContext } from "react";

export interface UrlContextType {
  currentUrl: string | null;
  currentTitle: string | null;
  currentHtml: string | null;
  currentMarkdown: string | null;
  setCurrentUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const UrlContext = createContext<UrlContextType | undefined>(undefined);
