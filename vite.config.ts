import { defineConfig } from "vite";
import { adviserPlugin } from "./server/vite-adviser.ts";
export default defineConfig({
  plugins: [adviserPlugin()],
  build: {
    rollupOptions: {
      input: [
        "index.html",
        "black-friday.html",
        "product.html",
        "collection.html",
        "studio.html",
        "client-care.html",
      ],
    },
  },
});
