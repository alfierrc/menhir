import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  // Tell Vite to use the 'app' directory as the root for the dev server
  root: "app",
  plugins: [
    electron([
      {
        // Adjust the entry point paths to be relative to the project root
        entry: "../main.js",
      },
      {
        entry: "../preload.js",
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
});
