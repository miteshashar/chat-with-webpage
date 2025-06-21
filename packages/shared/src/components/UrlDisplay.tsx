import { useUrl } from "../context/useUrl";

export function UrlDisplay() {
  const { currentUrl, currentTitle, currentHtml, setCurrentUrl, isLoading } =
    useUrl();

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
        </div>
      ) : currentUrl ? (
        <div className="space-y-1">
          {currentTitle && (
            <p className="text-sm font-medium break-words text-gray-900">
              {currentTitle}
            </p>
          )}
          <p className="text-xs break-all text-gray-600" title={currentUrl}>
            {truncate(currentUrl)}
          </p>
          {currentHtml && ""}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No page detected</p>
      )}
    </div>
  );
}
