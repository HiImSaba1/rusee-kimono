export const locales = ["el", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "el";
export const localeCookieName = "rusee_locale";
export function isLocale(value?: string): value is Locale { return locales.includes(value as Locale); }
