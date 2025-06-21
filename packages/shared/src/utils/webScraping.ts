export interface WebPageData {
  html: string;
  title: string;
}

export class WebScrapingError extends Error {
  public type: "CORS_ERROR" | "ANTI_SCRAPING" | "GENERIC";

  constructor(
    type: "CORS_ERROR" | "ANTI_SCRAPING" | "GENERIC",
    message: string,
  ) {
    super(message);
    this.name = "WebScrapingError";
    this.type = type;
  }
}

const BACKEND_PROXY_URL = "http://localhost:3000";

export const fetchWebpage = async (url: string): Promise<WebPageData> => {
  try {
    const proxyResponse = await fetch(`${BACKEND_PROXY_URL}/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json();

      if (errorData.type === "ROBOTS_DISALLOWED") {
        throw new WebScrapingError(
          "ANTI_SCRAPING",
          "Access denied by robots.txt. This website doesn't allow automated access.",
        );
      }

      if (errorData.type === "TIMEOUT") {
        throw new WebScrapingError(
          "GENERIC",
          "Request timeout. The website took too long to respond.",
        );
      }

      throw new Error(errorData.message || "Proxy fetch failed");
    }

    const result = await proxyResponse.json();
    return result.data as WebPageData;
  } catch (proxyError) {
    // If proxy fails, check if it's a connection error to proxy
    if (
      proxyError instanceof TypeError &&
      proxyError.message.includes("Failed to fetch")
    ) {
      throw new WebScrapingError(
        "CORS_ERROR",
        "Unable to access webpage. Please ensure the backend proxy server is running on port 3000, or use the Chrome extension.",
      );
    }

    // Handle other proxy errors
    if (proxyError instanceof Error) {
      if (
        proxyError.message.includes("403") ||
        proxyError.message.includes("blocked")
      ) {
        throw new WebScrapingError(
          "ANTI_SCRAPING",
          "This webpage has anti-scraping protection. Please use the Chrome extension to analyze this page.",
        );
      }
    }

    throw new WebScrapingError(
      "GENERIC",
      proxyError instanceof Error
        ? proxyError.message
        : "Unknown error occurred",
    );
  }
};
