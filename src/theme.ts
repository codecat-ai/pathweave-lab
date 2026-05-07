export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "pathweave-theme";

type ReadableThemeStorage = Pick<Storage, "getItem">;
type WritableThemeStorage = Pick<Storage, "setItem">;

export function readStoredTheme(
  storage: ReadableThemeStorage | undefined,
): Theme {
  if (!storage) return "dark";

  try {
    return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

export function persistTheme(
  storage: WritableThemeStorage | undefined,
  theme: Theme,
): void {
  if (!storage) return;

  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

function normalizeTheme(value: string | null): Theme {
  return value === "light" ? "light" : "dark";
}
