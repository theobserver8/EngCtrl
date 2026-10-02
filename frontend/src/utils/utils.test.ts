import { describe, expect, it } from "vitest";
import { ApiError } from "../api/client";
import { en } from "../i18n/locales/en";
import { getErrorMessage } from "./errorMessage";
import { formatCount, formatReference } from "./format";

describe("format", () => {
  it("builds inspection-style reference codes", () => {
    expect(formatReference(7)).toBe("T-007");
    expect(formatReference(1234)).toBe("T-1234");
  });

  it("pads counters to two digits", () => {
    expect(formatCount(3)).toBe("03");
    expect(formatCount(120)).toBe("120");
  });
});

describe("getErrorMessage", () => {
  it.each([
    [0, en.errors.network],
    [404, en.errors.notFound],
    [422, en.errors.validation],
    [500, en.errors.server],
    [503, en.errors.server],
    [400, en.errors.generic],
  ])("maps status %i to a translated message", (status, expected) => {
    expect(getErrorMessage(new ApiError(status, "raw backend message"), en.errors)).toBe(expected);
  });
});
