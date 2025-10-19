import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isTestRun = process.env.VITEST === "true";
const isCoverageRun = process.env.VITEST_COVERAGE === "true";

export default defineConfig({
  plugins: [
    react(),
    ...(isTestRun
      ? []
      : [
          runtimeErrorOverlay(),
          ...(process.env.NODE_ENV !== "production" &&
          process.env.REPL_ID !== undefined
          ? [
              await import("@replit/vite-plugin-cartographer").then((m) =>
                m.cartographer(),
              ),
              await import("@replit/vite-plugin-dev-banner").then((m) =>
                m.devBanner(),
              ),
            ]
          : []),
        ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  test: {
    globals: true,
    environment: isCoverageRun ? "happy-dom" : "jsdom",
    setupFiles: path.resolve(import.meta.dirname, "vitest.setup.ts"),
    coverage: {
      reporter: ["text", "html"],
      exclude: ["dist/**", "node_modules/**", "server/**"],
    },
    css: true,
  },
});
