import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Explicitly set the Turbopack workspace root to the repo root (one level
   * above sentinel-dashboard/).  This ensures that relative require() paths
   * like "../../../../dist/..." in route handlers resolve correctly when
   * Turbopack traces modules during the build.
   */
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },

  /**
   * Do NOT bundle these packages — they must be required at runtime from
   * node_modules.  The CLI compiled output (dist/) references them as
   * CommonJS requires, and they live in the repo-root node_modules.
   * Bundling them would either fail (missing packages) or break native code.
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
    "picocolors",
    // The compiled CLI modules themselves — never bundle them
    "sentinel-soroban",
  ],
};

export default nextConfig;
