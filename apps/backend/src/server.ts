import express, { type Request, type Response } from "express";
import cors from "cors";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import robotsParser from "robots-parser";

interface WebPageData {
  html: string;
  title: string;
}

interface RobotsCheckResult {
  canFetch: boolean;
  robotsUrl: string | null;
  message: string;
}

// Apply stealth plugin
chromium.use(stealth());

const app = express();
const PORT = 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json());

// Robots.txt checker
const checkRobots = async (url: string): Promise<RobotsCheckResult> => {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

    const response = await fetch(robotsUrl);
    const robotsTxt = await response.text();

    const robots = robotsParser(robotsUrl, robotsTxt);
    const canFetch = robots.isAllowed(url, "ChatWithWebpage-Bot");

    return {
      canFetch,
      robotsUrl,
      message: canFetch ? "Allowed by robots.txt" : "Disallowed by robots.txt",
    };
  } catch {
    // If robots.txt doesn't exist or can't be fetched, assume allowed
    return {
      canFetch: true,
      robotsUrl: null,
      message: "No robots.txt found, proceeding",
    };
  }
};

// Fetch webpage with Playwright
const fetchProtectedContent = async (url: string): Promise<WebPageData> => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const page = await browser.newPage();

  // Rotate user agents
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  const randomUserAgent =
    userAgents[Math.floor(Math.random() * userAgents.length)];
  if (randomUserAgent) {
    await page.setExtraHTTPHeaders({
      "User-Agent": randomUserAgent,
    });
  }

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for JS rendering
    await page.waitForTimeout(3000);

    const content = await page.content();
    const title = await page.title();

    return { html: content, title };
  } finally {
    await browser.close();
  }
};

// API Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Chat with Webpage - Proxy Server",
    version: "1.0.0",
    endpoints: {
      "GET /": "This help message",
      "POST /fetch": "Fetch webpage content (body: { url: string })",
    },
  });
});

app.post("/fetch", async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({
      error: "URL is required",
      type: "MISSING_URL",
    });
    return;
  }

  try {
    // Validate URL
    new URL(url);

    // Check robots.txt
    const robotsCheck = await checkRobots(url);

    if (!robotsCheck.canFetch) {
      res.status(403).json({
        error: "Access denied by robots.txt",
        type: "ROBOTS_DISALLOWED",
        robotsUrl: robotsCheck.robotsUrl,
      });
      return;
    }

    // Fetch content
    const content = await fetchProtectedContent(url);

    res.json({
      success: true,
      data: content,
      robots: robotsCheck,
    });
  } catch (error: unknown) {
    console.error("Fetch error:", error);

    if (error instanceof Error && error.message.includes("Invalid URL")) {
      res.status(400).json({
        error: "Invalid URL format",
        type: "INVALID_URL",
      });
      return;
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      res.status(408).json({
        error: "Request timeout",
        type: "TIMEOUT",
      });
      return;
    }

    res.status(500).json({
      error: "Failed to fetch webpage",
      type: "FETCH_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
