import vinext from "vinext";
import { defineConfig } from "vite";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export default defineConfig({
  base: basePath ? `${basePath}/` : "/",
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  plugins: [vinext()],
});
