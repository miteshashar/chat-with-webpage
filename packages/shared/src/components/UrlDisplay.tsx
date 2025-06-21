import { useState } from "react";
import { useUrl } from "../context/useUrl";

export function UrlDisplay() {
  const { currentUrl, currentTitle, setCurrentUrl, isLoading, error } =
    useUrl();
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  if (isLoading) {
    return <div className="text-gray-500">Loading current page...</div>;
  }

  // Check if we're in extension environment (has title)
  const isExtension =
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.getManifest;
  const isWeb = !isExtension && !currentUrl;

  const truncate = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setCurrentUrl(urlInput.trim());
      setIsEditing(false);
      setUrlInput("");
    }
  };

  return (
    <div className="mb-4 rounded-lg bg-gray-50 p-4">
      {isWeb ? (
        <div className="space-y-2">
          <input
            type="url"
            placeholder="Enter webpage URL..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const url = (e.target as HTMLInputElement).value;
                if (url) {
                  setCurrentUrl(url);
                }
              }
            }}
          />
          <p className="text-xs text-gray-500">Press Enter to set the URL</p>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      ) : currentUrl ? (
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter new webpage URL..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUrlSubmit();
                  } else if (e.key === "Escape") {
                    setIsEditing(false);
                    setUrlInput("");
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUrlSubmit}
                  className="rounded-md bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setUrlInput("");
                  }}
                  className="rounded-md bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  {currentTitle && (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-sm font-medium break-words text-blue-600 underline hover:text-blue-800"
                      title="Open page in new tab"
                    >
                      {currentTitle}
                    </a>
                  )}
                  <p
                    className="text-xs break-all text-gray-600"
                    title={currentUrl}
                  >
                    {truncate(currentUrl)}
                  </p>
                </div>
                {!isExtension && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setUrlInput(currentUrl);
                    }}
                    className="ml-2 rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No page detected</p>
      )}
    </div>
  );
}
