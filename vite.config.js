import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  // No more 'root' or 'build' options needed
  plugins: [
    electron([
      { entry: "main.js" },
      { entry: "preload.js", onstart: (options) => options.reload() },
    ]),
    renderer(),
  ],
});
