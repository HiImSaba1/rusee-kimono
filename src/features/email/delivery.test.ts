import { afterEach, describe, expect, it, vi } from "vitest";
import { renderEmailContent } from "./delivery";

afterEach(() => vi.unstubAllEnvs());

describe("contact enquiry email content", () => {
  it("renders escaped customer content without changing Reply-To data", () => {
    const row = {
      id: 1,
      order_id: null,
      contact_enquiry_id: 2,
      template: "contact_enquiry_notification",
      recipient: "studio@example.gr",
      reply_to: "visitor@example.com",
      order_number: null,
      order_public_id: null,
      total_minor: null,
      currency: null,
      contact_name: "<Sandra>",
      contact_email: "visitor@example.com",
      contact_subject: "collaboration",
      contact_order_number: null,
      contact_message: "Hello <script>alert(1)</script>",
      contact_locale: "el",
      context: null,
    } satisfies Parameters<typeof renderEmailContent>[0];
    const content = renderEmailContent(row);
    expect(content.subject).toContain("Συνεργασία");
    expect(content.text).toContain("Hello <script>alert(1)</script>");
    expect(content.html).toContain("&lt;Sandra&gt;");
    expect(content.html).not.toContain("<script>");
  });
  it("keeps return updates distinct from verified refunds", () => {
    vi.stubEnv("APP_URL", "https://rusee.gr");
    const content=renderEmailContent({id:3,order_id:4,contact_enquiry_id:null,template:"return_status_update",recipient:"buyer@example.com",reply_to:null,order_number:"RUSEE-42",order_public_id:"123e4567-e89b-12d3-a456-426614174000",total_minor:10000,currency:"EUR",contact_name:null,contact_email:null,contact_subject:null,contact_order_number:null,contact_message:null,contact_locale:null,context:{returnStatus:"approved"}});
    expect(content.subject).toContain("approved");
    expect(content.text).toContain("does not confirm a refund");
    expect(content.text).toContain("Κατάσταση παραγγελίας");
  });
});
