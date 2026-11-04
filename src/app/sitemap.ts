import type { MetadataRoute } from "next";
import { listServices } from "@/lib/api/endpoints";
import { config } from "@/lib/config";

const STATIC_PATHS = ["/", "/treatments", "/practitioners", "/book", "/privacy"];

/** Regenerate hourly so new services appear without a redeploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${config.siteUrl}${path === "/" ? "" : path}`,
  }));

  try {
    const services = await listServices();
    for (const service of services) {
      entries.push({ url: `${config.siteUrl}/treatments/${encodeURIComponent(service.slug)}` });
    }
  } catch {
    // API unreachable at generation time: serve the static routes rather than failing the build.
  }

  return entries;
}
