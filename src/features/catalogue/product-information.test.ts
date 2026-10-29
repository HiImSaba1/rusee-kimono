import { describe, expect, it } from "vitest";
import { productInformation, productInformationKeys } from "./product-information";

describe("bilingual product information", () => {
  it("provides complete Greek and English defaults", () => {
    const information = productInformation(null);
    expect(Object.keys(information)).toEqual(productInformationKeys);
    for (const key of productInformationKeys) {
      expect(information[key].el.length).toBeGreaterThan(10);
      expect(information[key].en.length).toBeGreaterThan(10);
    }
  });

  it("keeps confirmed custom copy and fills missing locale content", () => {
    const information = productInformation({ fabric: { el: "Επιβεβαιωμένη σύνθεση υφάσματος για το τελικό προϊόν." } });
    expect(information.fabric.el).toContain("Επιβεβαιωμένη");
    expect(information.fabric.en).toContain("lightweight woven fabric");
  });
});
