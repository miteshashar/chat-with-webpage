import React, { useState, useEffect } from "react";
import { getToken, onChange } from "../storage";
import { Settings } from "./Settings";

interface SettingsCheckerProps {
  children: React.ReactNode;
}

export function SettingsChecker({ children }: SettingsCheckerProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const savedToken = await getToken();
        setToken(savedToken);
      } catch (error) {
        console.error("Failed to check token:", error);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkToken();

    // Listen for real-time token changes
    const unsubscribe = onChange<string>(
      "openai_token",
      (newToken: string | null) => {
        setToken(newToken);
      },
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Settings onTokenSaved={() => {}} />;
  }

  return <div className="h-full w-full">{children}</div>;
}
