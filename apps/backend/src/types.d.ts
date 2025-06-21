declare module "robots-parser" {
  interface RobotsParser {
    isAllowed(url: string, userAgent?: string): boolean;
    isDisallowed(url: string, userAgent?: string): boolean;
    getCrawlDelay(userAgent?: string): number | undefined;
    getSitemaps(): string[];
    getPreferredHost(): string | undefined;
  }

  function robotsParser(url: string, robotsTxt: string): RobotsParser;
  export = robotsParser;
}
