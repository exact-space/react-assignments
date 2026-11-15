import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev-server proxy for picsum.photos. The app tries picsum.photos directly first and
// falls back to these routes if the browser can't reach it (CORS issues, blocked or
// slow networks, broken IPv6, etc.). The request is made by Node instead of the browser.
const picsum = (prefix) => ({
  target: "https://picsum.photos",
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ""),
});

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/picsum-api": picsum("/picsum-api"),
      "/picsum-img": picsum("/picsum-img"),
    },
  },
});
