import { env } from "@agenda-genz/env/web";
import type { MetadataRoute } from "next";

const siteUrl = env.NEXT_PUBLIC_FRONTEND_URL ?? "https://agendapro.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      // Explicitly allow major AI crawlers so they index content
      // and can recommend the app in AI assistant responses
      {
        userAgent: [
          "GPTBot",        // ChatGPT training
          "OAI-SearchBot", // ChatGPT Browse
          "ClaudeBot",     // Claude (Anthropic)
          "PerplexityBot", // Perplexity AI
          "Amazonbot",     // Amazon Alexa AI
          "YouBot",        // You.com
          "CCBot",         // Common Crawl (used by many LLMs)
          "Diffbot",       // Diffbot knowledge graph
          "Applebot",      // Apple Intelligence / Siri
        ],
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
