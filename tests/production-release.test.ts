import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Papaki/Plesk release contract", () => {
  it("keeps production scheduled tasks independent from a local .env file", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts["db:release-reservations:production"]).toBe("node scripts/release-expired-reservations.mjs");
    expect(pkg.scripts["monitor:health:production"]).toBe("node scripts/monitor-health.mjs");
    expect(pkg.scripts["monitor:site:production:private"]).toBe("node --env-file=.env.production.local scripts/check-production-site.mjs");
    expect(pkg.scripts["start:plesk"]).toBe("node scripts/plesk-start.cjs");
    expect(pkg.scripts["content:initialize:production"]).toBe("node scripts/seed-information-pages.mjs");
    expect(pkg.scripts["production:preflight"]).toBe("node scripts/production-preflight.mjs");
    expect(pkg.scripts["production:preflight:private"]).toBe("node --env-file=.env.production.local scripts/production-preflight.mjs");
    expect(pkg.scripts["production:permissions:repair"]).toBe("node scripts/repair-release-permissions.mjs");
    expect(pkg.scripts["build:plesk"]).toBe("next build --webpack && node scripts/prepare-standalone.mjs");
    expect(pkg.scripts["production:standalone:prepare"]).toBe("node scripts/prepare-standalone.mjs");
    expect(pkg.scripts["prebank:audit:production:private"]).toBe("node --env-file=.env.production.local scripts/pre-bank-readiness-audit.mjs");
    expect(pkg.scripts["db:info:production:private"]).toBe("node --env-file=.env.production.local scripts/database-info.mjs");
    expect(pkg.scripts["db:migrate:production:private"]).toBe("node --env-file=.env.production.local scripts/migrate-database.mjs");
    expect(pkg.scripts["content:initialize:production:private"]).toBe("node --env-file=.env.production.local scripts/seed-information-pages.mjs");
    expect(pkg.scripts["catalogue:sync:production:private"]).toBe("node --env-file=.env.production.local scripts/assign-optimized-kimono-images.mjs");
    expect(pkg.scripts["admin:bootstrap:production:private"]).toBe("node --env-file=.env.production.local scripts/bootstrap-admin.mjs");
  });

  it("builds standalone output and blocks incomplete Plesk releases", () => {
    const nextConfig = read("next.config.ts");
    expect(nextConfig).toContain('output: "standalone"');
    expect(nextConfig).toContain("cpus: 1");
    const startup = read("start.js");
    expect(startup).toContain('resolve(__dirname, ".env.production.local")');
    expect(startup).toContain("process.loadEnvFile(productionEnvironmentPath)");
    expect(startup).toContain('require("./.next/standalone/server.js")');
    const deploy = read("scripts/deploy-plesk.sh");
    expect(deploy).toContain('APP_DIR="${APP_DIR:?');
    expect(deploy).toContain('DATABASE_URL must be supplied by Plesk');
    expect(deploy).toContain('if [ "$NODE_MAJOR" -ne 22 ]');
    expect(deploy).toContain("npm ci --legacy-peer-deps");
    expect(deploy).toContain("node scripts/production-preflight.mjs");
    expect(deploy).toContain("npm run db:migrate");
    expect(deploy).toContain("npm run content:initialize:production");
    expect(deploy).toContain("npm run build");
  });

  it("builds a secret-free Linux artifact with a checksum in GitHub Actions", () => {
    const workflow = read(".github/workflows/papaki-standalone-release.yml");
    const builder = read("scripts/build-papaki-linux-release.sh");
    expect(workflow).toContain('node-version: "22"');
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("sha256sum -c");
    expect(workflow).toContain("kimono-home-group-dance.mp4");
    expect(workflow).toContain("next_kimono\\.sql");
    expect(workflow).toContain("mysql://release_builder:URL_ENCODED_PASSWORD@127.0.0.1:3306/release_builder");
    expect(workflow).not.toContain("mysql://release_builder:release_builder@");
    expect(builder).toContain("npm ci --legacy-peer-deps");
    expect(builder).toContain("npm run build:plesk");
    expect(builder).toContain('export NODE_ENV=production');
    expect(builder).toContain("RELEASE_MANIFEST.txt");
    expect(builder).toContain("sha256sum");
    expect(builder).not.toContain(".env.production.local");
  });

  it("packages only reviewed application inputs and never environment files", () => {
    const packager = read("scripts/prepare-papaki-upload.ps1");
    expect(packager).toContain('"drizzle", "public", "src"');
    expect(packager).toContain("$ProductionScripts");
    expect(packager).toContain('"database-info.mjs"');
    expect(packager).toContain('"migrate-database.mjs"');
    expect(packager).toContain('"repair-release-permissions.mjs"');
    expect(packager).toContain('"prepare-standalone.mjs"');
    expect(packager).toContain('"assign-optimized-kimono-images.mjs"');
    expect(packager).toContain('"check-production-site.mjs"');
    expect(packager).toContain('"pre-bank-readiness-audit.mjs"');
    expect(packager).not.toContain('"seed-admin-demo.mjs"');
    expect(packager).not.toContain('"seed.mjs"');
    expect(packager).not.toContain('"verify-commerce-guards.mjs"');
    expect(packager).toContain('"run-automation-worker.mjs"');
    expect(packager).not.toMatch(/Copy-Item[^\n]+\.env/i);
    expect(packager).not.toContain('"node_modules"');
    expect(packager).toContain("[System.IO.Compression.ZipArchive]");
    expect(packager).toContain('.Replace("\\", "/")');
    expect(packager).toContain("-Recurse -File");
    expect(packager).not.toContain("Compress-Archive");
  });

  it("checks production availability without treating blocked payment readiness as downtime", () => {
    const monitor = read("scripts/check-production-site.mjs");
    expect(monitor).toContain('request("/api/health/live")');
    expect(monitor).toContain('request("/")');
    expect(monitor).toContain('request("/api/health/ready")');
    expect(monitor).toContain("informational: true");
    expect(monitor).toContain('payload?.status === "live"');
    expect(monitor).not.toContain("DATABASE_URL");
    expect(monitor).not.toContain("AUTOMATION_SECRET");
  });

  it("keeps the committed production template redacted and fake payments disabled", () => {
    const template = read(".env.production.example");
    expect(template).toContain('DATABASE_URL="mysql://RUSEE_DB_USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/next_rusee"');
    expect(template).toContain('SMTP_HOST="RUSEE_SMTP_HOST"');
    expect(template).toContain('SMTP_PORT="465"');
    expect(template).toContain('SMTP_SECURE="true"');
    expect(template).toContain('ENABLE_FAKE_PAYMENTS="false"');
    expect(template).toContain('AUTOMATION_SECRET="GENERATE_A_DIFFERENT_32_CHARACTER_SECRET"');
    expect(template).not.toMatch(/ADMIN_PASSWORD="[^*A-Z_]/i);
  });

  it("refuses the fake adapter from the production provider registry", () => {
    const registry = read("src/features/payments/registry.ts");
    expect(registry).toContain('process.env.NODE_ENV === "production"');
    expect(registry).toContain('name === "fake"');
    expect(registry).toContain("Production payments are not configured.");
  });

  it("keeps maintenance mode explicit and preserves operational callbacks", () => {
    expect(read(".env.production.example")).toContain('MAINTENANCE_MODE="false"');
    const proxy = read("src/proxy.ts");
    const policy = read("src/lib/operations/maintenance.ts");
    expect(proxy).toContain("new NextResponse(document");
    expect(proxy).toContain("status: 503");
    expect(proxy).toContain('"Retry-After": "300"');
    expect(policy).toContain('["/admin", "/api", "/order", "/payment"]');
  });

  it("defaults every non-secret launch approval to false", () => {
    const template = read(".env.production.example");
    for (const key of ["HOSTING", "EMAIL_DNS", "TAX_SHIPPING", "LEGAL", "PRODUCT_DATA", "FULFILMENT", "PAYMENT_PROVIDER"]) {
      expect(template).toContain(`LAUNCH_${key}_APPROVED="false"`);
    }
    expect(template).toContain('LAUNCH_IMPORTED_HISTORY_REVIEWED="false"');
  });
});
