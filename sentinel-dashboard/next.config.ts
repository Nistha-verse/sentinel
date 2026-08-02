import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Pin Turbopack to the dashboard package so the parent CLI's
   * `"type": "commonjs"` package.json is not applied to this app.
   */
  turbopack: {
    root: path.resolve(__dirname),
  },

  /**
   * Include the child-process bridge and prebuilt CLI in serverless traces.
   */
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./scripts/scanner-bridge.cjs",
      "./.sentinel-dist/**/*",
    ],
  },

  /**
   * Leave these as Node requires — pulled in by the prebuilt CLI at runtime.
   */
  serverExternalPackages: [
    "@stellar/stellar-sdk",
    "@stellar/stellar-base",
    "@webassemblyjs/wasm-parser",
    "@webassemblyjs/ast",
    "@webassemblyjs/helper-wasm-bytecode",
    "@webassemblyjs/utf8",
    "@webassemblyjs/ieee754",
    "@webassemblyjs/helper-buffer",
    "@webassemblyjs/helper-numbers",
    "@webassemblyjs/wasm-gen",
    "@webassemblyjs/wasm-edit",
  ],
};

export default nextConfig;
