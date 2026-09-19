import { defineConfig } from "vite";

// Two entry pages: Andrei's Taula prototype (index.html) and the conversational version (talk.html).
export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: "index.html", talk: "talk.html" },
    },
  },
});
