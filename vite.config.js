import { defineConfig } from "vite";

// Entry pages: Andrei's Taula prototype (index.html), the conversational cooking page
// (talk.html), and the new onboarding steps 1 and 2a (welcome.html).
export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: "index.html", talk: "talk.html", welcome: "welcome.html" },
    },
  },
});
