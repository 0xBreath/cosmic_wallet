import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import inject from "@rollup/plugin-inject";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import vitePluginRequire from "vite-plugin-require";
import { resolve } from 'path';
import "reflect-metadata";

const publicDir = resolve(__dirname, 'public');

export default defineConfig({
  define: {
    "process.env": process.env,
  },
  resolve: {
    alias: {
      crypto: "crypto-browserify",
      buffer: "buffer",
      stream: "stream-browserify",
      assert: "assert",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify",
      url: "url",
      util: "util",
      "tiny-secp256k1": "elliptic",
    },
  },
  plugins: [react(), wasm(), vitePluginRequire(), inject({ Buffer: ["buffer", "Buffer"] })],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill() as any,
        inject({ Buffer: ["buffer", "Buffer"] }),
        wasm(),
      ],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // publicDir: "static",
  publicDir
});
