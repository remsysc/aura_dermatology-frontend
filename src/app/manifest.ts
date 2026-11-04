import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.clinic.name,
    short_name: "AURA",
    description: "Book doctor-led dermatology consultations and precision laser treatments.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#1e3a2f",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
