import type { NextConfig } from "next";
import path from "path";

const repoRoot = path.resolve(__dirname, "..");
const sentinelSrc = path.resolve(repoRoot, "src");

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Workspace root is the monorepo root so Turbopack can resolve and
   * transpile `@sentinel/*` imports that live outside sentinel-dashboard/.
   */
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      "@sentinel": sentinelSrc,
    },
  },

  /**
   * Do NOT bundle these packages — they must be required at runtime from
   * node_modules. Bundling them can fail or break native / CJS edge cases.
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
