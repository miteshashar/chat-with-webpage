import React, { useState } from "react";
import { setToken, isValidToken } from "../storage";

interface SettingsProps {
  onTokenSaved: () => void;
}

export function Settings({ onTokenSaved }: SettingsProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!isValidToken(tokenInput)) {
        throw new Error("Invalid token format");
      }

      await setToken(tokenInput);
      onTokenSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save token");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Setup Required</h2>
      <p className="mb-6 text-gray-600">
        Please enter your OpenAI API token to get started.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="token"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            OpenAI API Token
          </label>
          <input
            type="text"
            id="token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !tokenInput}
          className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Token"}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        Your token is stored securely and never sent to any server except
        OpenAI.
      </p>
    </div>
  );
}
