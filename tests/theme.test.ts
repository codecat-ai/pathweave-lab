import { describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  nextTheme,
  persistTheme,
  readStoredTheme,
} from "../src/theme";

describe("theme preferences", () => {
  it("defaults missing and invalid stored themes to dark", () => {
    expect(readStoredTheme(undefined)).toBe("dark");
    expect(readStoredTheme(storageWithValue(null))).toBe("dark");
    expect(readStoredTheme(storageWithValue("sepia"))).toBe("dark");
  });

  it("loads a stored light or dark theme", () => {
    expect(readStoredTheme(storageWithValue("light"))).toBe("light");
    expect(readStoredTheme(storageWithValue("dark"))).toBe("dark");
  });

  it("falls back to dark when storage cannot be read", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("storage unavailable");
      }),
    };

    expect(readStoredTheme(storage)).toBe("dark");
  });

  it("persists the selected theme to localStorage-compatible storage", () => {
    const setItem = vi.fn();

    persistTheme({ setItem }, "light");

    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "light");
  });

  it("ignores storage write failures", () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
    };

    expect(() => persistTheme(storage, "dark")).not.toThrow();
  });

  it("toggles between dark and light themes", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });
});

function storageWithValue(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem: vi.fn((key: string) =>
      key === THEME_STORAGE_KEY ? value : "unexpected",
    ),
  };
}
