import en from "./locales/en.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };

export type Locale = "en" | "es";
export type Translations = typeof en;

const locales: Record<Locale, Translations> = { en, es };

export function t(locale: Locale, path: string): string {
  const keys = path.split(".");
  let current: unknown = locales[locale];
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export { en, es };
