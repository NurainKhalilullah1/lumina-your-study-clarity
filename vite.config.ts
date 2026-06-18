import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Replace %VITE_*% tokens in index.html with the corresponding env variable.
    // Vite's native substitution only works when the variable is present in .env;
    // this plugin adds a safe fallback so the HTML is never left with raw tokens.
    {
      name: "html-env-replace",
      transformIndexHtml(html: string) {
        const fallbacks: Record<string, string> = {
          VITE_APP_URL: "http://localhost:8080",
        };
        return html.replace(/%VITE_([A-Z0-9_]+)%/g, (_match, key) => {
          return process.env[`VITE_${key}`] ?? fallbacks[`VITE_${key}`] ?? _match;
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
