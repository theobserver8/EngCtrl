import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_STORAGE_KEY, MESSAGES, detectLocale, isLocale, storeLocale } from "./config";

const mockBrowserLanguages = (languages: string[]) =>
  vi.spyOn(window.navigator, "languages", "get").mockReturnValue(languages);

describe("detectLocale", () => {
  afterEach(() => window.localStorage.clear());

  it("prefers the saved choice", () => {
    mockBrowserLanguages(["en-GB"]);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "es");

    expect(detectLocale()).toBe("es");
  });

  it("starts in English regardless of the browser language", () => {
    mockBrowserLanguages(["es-ES", "en-US"]);

    expect(detectLocale()).toBe("en");
  });

  it("ignores invalid saved values", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "klingon");

    expect(detectLocale()).toBe("en");
  });

  it("keeps working when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(detectLocale()).toBe("en");
    expect(() => storeLocale("en")).not.toThrow();
  });
});

describe("messages", () => {
  it("only accepts supported locales", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("has the same keys in every language", () => {
    const shape = (value: unknown): unknown =>
      typeof value === "object" && value !== null
        ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
        : typeof value;

    expect(shape(MESSAGES.es)).toEqual(shape(MESSAGES.en));
  });
});
