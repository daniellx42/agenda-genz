import { env } from "@agenda-genz/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // cacheComponents: true, // Uncomment when using 'use cache' directive (Next.js 16)

  // Ensure AI crawlers receive metadata in <head> (not just via JS hydration)
  // Default includes Googlebot, Bingbot. We extend to add major AI bots.
  htmlLimitedBots:
    /Googlebot|Bingbot|Twitterbot|Slackbot|facebookexternalhit|WhatsApp|Applebot|LinkedInBot|GPTBot|OAI-SearchBot|ClaudeBot|PerplexityBot|Amazonbot|YouBot|CCBot|Diffbot/,

  async rewrites() {
    const authServerUrl = env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "");

    if (!authServerUrl) {
      return [];
    }

    return [
      {
        source: "/api/auth/:path*",
        destination: `${authServerUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
