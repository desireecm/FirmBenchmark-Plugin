import { describe, expect, it } from "vitest";
import { canSignIn, isAllowedDomain } from "./access";

describe("sign-in access", () => {
  it("accepts an active, allow-listed user in the company domain", () => {
    expect(
      canSignIn("Desiree@EsquireInteractive.com", "esquireinteractive.com", { isActive: true }),
    ).toBe(true);
  });
  it("rejects a non-tenant account even if it's on the list", () => {
    expect(canSignIn("someone@gmail.com", "esquireinteractive.com", { isActive: true })).toBe(
      false,
    );
  });
  it("rejects lookalike domains", () => {
    expect(isAllowedDomain("a@notesquireinteractive.com", "esquireinteractive.com")).toBe(false);
  });
  it("rejects company accounts that aren't on the allow-list or are deactivated", () => {
    expect(canSignIn("new@esquireinteractive.com", "esquireinteractive.com", null)).toBe(false);
    expect(
      canSignIn("old@esquireinteractive.com", "esquireinteractive.com", { isActive: false }),
    ).toBe(false);
  });
  it("rejects missing email or domain config", () => {
    expect(isAllowedDomain(null, "esquireinteractive.com")).toBe(false);
    expect(isAllowedDomain("a@esquireinteractive.com", "")).toBe(false);
  });
});
