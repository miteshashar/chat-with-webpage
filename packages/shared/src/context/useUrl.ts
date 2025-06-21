import { useContext } from "react";
import { UrlContext, type UrlContextType } from "./UrlContextTypes";

export function useUrl(): UrlContextType {
  const context = useContext(UrlContext);
  if (context === undefined) {
    throw new Error("useUrl must be used within a UrlProvider");
  }
  return context;
}
