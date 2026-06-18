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
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Inject VITE_APP_URL into index.html at build time so OG/favicon tags
  // always reference the correct deployed domain rather than a hardcoded one.
  define: {
    "import.meta.env.VITE_APP_URL": JSON.stringify(
      process.env.VITE_APP_URL || "http://localhost:8080"
    ),
  },
}));
