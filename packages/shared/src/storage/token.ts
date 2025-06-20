import { get, set, remove } from "./storage";

const TOKEN_KEY = "openai_token";

export const getToken = (): Promise<string | null> => get<string>(TOKEN_KEY);

export const setToken = async (token: string): Promise<void> => {
  if (!isValidToken(token)) {
    throw new Error("Invalid token format");
  }
  return set(TOKEN_KEY, token);
};

export const removeToken = (): Promise<void> => remove(TOKEN_KEY);

export const isValidToken = (token: string): boolean => {
  return (
    typeof token === "string" && token.startsWith("sk-") && token.length >= 20
  );
};
