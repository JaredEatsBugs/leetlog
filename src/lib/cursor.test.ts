import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

describe("attempt cursor", () => {
  it("round-trips", () => {
    const c = { attemptedAt: new Date("2026-11-24T12:34:56.789Z"), id: "abc-123" };
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
  });

  it("rejects garbage", () => {
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(decodeCursor(Buffer.from("yesterday|abc").toString("base64url"))).toBeNull();
    expect(decodeCursor(Buffer.from("2026-11-24T00:00:00Z|a|b").toString("base64url"))).toBeNull();
  });
});
