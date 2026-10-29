import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/server-only.ts") } },
  test: { environment: "node", fileParallelism: false, testTimeout: 15_000, exclude: ["e2e/**", "node_modules/**", ".next/**", "artifacts/**"] },
});
