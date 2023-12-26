import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import inject from "@rollup/plugin-inject";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
// import vitePluginRequire from "vite-plugin-require";
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
  plugins: [
    react(),
    wasm(),
    inject({ Buffer: ["buffer", "Buffer"] })
  ],
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
        NodeModulesPolyfillPlugin()
      ],
    },
    include: [
      '@solana/web3.js',
      '@solana/web3.js > bn.js',
      '@solana/web3.js > borsh',
      '@solana/web3.js > buffer',
    ]
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(),
        inject({ Buffer: ["buffer", "Buffer"] }),
        wasm(),
      ],
    },
    // transpile: [
    //   '@blocto/sdk',
    //   '@project-serum/sol-wallet-adapter',
    //   '@solana/wallet-adapter-base',
    //   '@solana/wallet-adapter-bitkeep',
    //   '@solana/wallet-adapter-bitpie',
    //   '@solana/wallet-adapter-blocto',
    //   '@solana/wallet-adapter-clover',
    //   '@solana/wallet-adapter-coin98',
    //   '@solana/wallet-adapter-coinhub',
    //   '@solana/wallet-adapter-ledger',
    //   '@solana/wallet-adapter-mathwallet',
    //   '@solana/wallet-adapter-phantom',
    //   '@solana/wallet-adapter-safepal',
    //   '@solana/wallet-adapter-slope',
    //   '@solana/wallet-adapter-solflare',
    //   '@solana/wallet-adapter-sollet',
    //   '@solana/wallet-adapter-solong',
    //   '@solana/wallet-adapter-torus',
    //   '@solana/wallet-adapter-vue',
    //   '@solana/wallet-adapter-vue-ui',
    //   '@solana/wallet-adapter-walletconnect',
    //   '@solana/wallet-adapter-wallets',
    //   '@solana/web3.js'
    // ],
    ssr: false
    // commonjsOptions: {
    //   transformMixedEsModules: true,
    // },
  },
  // publicDir: "static",
  publicDir
});
