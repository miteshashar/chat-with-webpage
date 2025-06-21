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

export const fetchWebpage = async (url: string): Promise<WebPageData> => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    return { html, title };
  } catch (error) {
    // Check for CORS errors (most common case)
    if (
      error instanceof TypeError &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("CORS") ||
        error.message.includes("Network request failed"))
    ) {
      throw new WebScrapingError(
        "CORS_ERROR",
        "This webpage cannot be accessed due to CORS restrictions. Please use the Chrome extension to analyze this page.",
      );
    }

    // Check for common anti-scraping indicators
    if (error instanceof Error) {
      if (
        error.message.includes("403") ||
        error.message.includes("blocked") ||
        error.message.includes("captcha") ||
        error.message.includes("bot")
      ) {
        throw new WebScrapingError(
          "ANTI_SCRAPING",
          "This webpage has anti-scraping protection. Please use the Chrome extension to analyze this page.",
        );
      }
    }

    // For any other fetch-related errors, assume CORS/security issue
    if (error instanceof TypeError) {
      throw new WebScrapingError(
        "CORS_ERROR",
        "This webpage cannot be accessed directly from the browser. Please use the Chrome extension to analyze this page.",
      );
    }

    throw new WebScrapingError(
      "GENERIC",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
};
