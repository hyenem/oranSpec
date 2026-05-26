import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// GitHub Pages deployment configuration.
// Override these via env when deploying to a custom domain.
const SITE = process.env.SITE_URL || "https://example.github.io";
// Astro normalizes base; we still ensure it ends with a "/" so
// `${import.meta.env.BASE_URL}foo` always produces "/base/foo".
const rawBase = process.env.BASE_PATH || "/oranSpec";
const BASE = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "ignore",
  integrations: [
    react(),
    mdx(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  vite: {
    ssr: {
      noExternal: ["three", "@react-three/fiber", "@react-three/drei"],
    },
  },
});
