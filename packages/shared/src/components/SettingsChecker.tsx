import React, { useState, useEffect } from "react";
import { getToken } from "../storage";
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
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!token) {
    return <Settings onTokenSaved={() => setToken("saved")} />;
  }

  return <>{children}</>;
}
