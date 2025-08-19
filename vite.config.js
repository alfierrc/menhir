import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { resolve } from "path";

export default defineConfig({
  // We no longer need the 'root' property here.
  plugins: [
    electron([
      {
        // Main-Process entry file (relative to project root)
        entry: "main.js",
      },
      {
        entry: "preload.js",
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
  // Explicitly tell Vite where to find the HTML file.
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "app/index.html"),
      },
    },
  },
});
