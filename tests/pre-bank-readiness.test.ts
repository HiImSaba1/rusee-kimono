import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("pre-bank closure contract", () => {
  it("keeps the bank as an explicit final blocker", () => {
    const audit = read("scripts/pre-bank-readiness-audit.mjs");
    expect(audit).toContain('provider === "fake"');
    expect(audit).toContain('process.env.ENABLE_FAKE_PAYMENTS === "false"');
    expect(audit).toContain("WAITING FOR BANK");
    expect(audit).toContain("PRE-BANK READY");
    expect(audit).not.toContain("sendMail(");
    expect(audit).not.toMatch(/UPDATE\s|DELETE\s|INSERT\s/i);
  });

  it("requires every non-payment approval and imported-history review", () => {
    const audit = read("scripts/pre-bank-readiness-audit.mjs");
    for (const key of ["HOSTING", "EMAIL_DNS", "TAX_SHIPPING", "LEGAL", "PRODUCT_DATA", "FULFILMENT"]) {
      expect(audit).toContain(`LAUNCH_${key}_APPROVED`);
    }
    expect(audit).toContain("LAUNCH_IMPORTED_HISTORY_REVIEWED");
    expect(audit).toContain("LAUNCH_PAYMENT_PROVIDER_APPROVED");
    expect(read(".env.production.example")).toContain('LAUNCH_IMPORTED_HISTORY_REVIEWED="false"');
  });

  it("audits admin, catalogue, content, SMTP evidence, automation and commerce without customer output", () => {
    const audit = read("scripts/pre-bank-readiness-audit.mjs");
    for (const marker of ["admin_owner", "catalogue_structure", "published_information", "smtp_delivery_evidence", "automation_worker", "commerce_integrity", "privacy_queue"]) {
      expect(audit).toContain(marker);
    }
    expect(audit).toContain("no secrets or customer records are printed");
    expect(audit).not.toContain("SELECT *");
  });

  it("ships the private worker and audit in both reviewed deployment formats", () => {
    const standalone = read("scripts/prepare-standalone.mjs");
    const builder = read("scripts/build-papaki-linux-release.sh");
    const packager = read("scripts/prepare-papaki-upload.ps1");
    for (const script of ["run-automation-worker.mjs", "check-production-site.mjs", "pre-bank-readiness-audit.mjs"]) {
      expect(standalone).toContain(script);
      expect(builder).toContain(script);
      expect(packager).toContain(script);
    }
  });
});
