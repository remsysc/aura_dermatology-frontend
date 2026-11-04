import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/** Token-bearing and transactional routes must never be crawled or indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/manage", "/intake", "/verify", "/book/confirmation"],
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
