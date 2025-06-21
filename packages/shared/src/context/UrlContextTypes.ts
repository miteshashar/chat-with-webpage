import { createContext } from "react";

export interface UrlContextType {
  currentUrl: string | null;
  currentTitle: string | null;
  currentHtml: string | null;
  setCurrentUrl: (url: string) => void;
  isLoading: boolean;
}

export const UrlContext = createContext<UrlContextType | undefined>(undefined);
