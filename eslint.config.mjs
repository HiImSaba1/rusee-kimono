import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Playwright runs a second Next.js dev server with an isolated distDir.
    ".next-playwright/**",
    // Sprint 08V builds a production bundle in a third isolated distDir.
    ".next-performance/**",
    "artifacts/**",
    // Read-only visual reference; it is not compiled or shipped with Ruseè.
    "src_admin_ref/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
