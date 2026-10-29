import "server-only";

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/i18n/config";
import { kimonoImage } from "@/lib/media/kimono-images";

export const fallbackOrigin = "http://localhost:3000";

export function siteOrigin() {
  try {
    const url = new URL(process.env.APP_URL ?? fallbackOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return new URL(fallbackOrigin);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(fallbackOrigin);
  }
}

export function isIndexableProduction() {
  const origin = siteOrigin();
  return process.env.NODE_ENV === "production" && origin.protocol === "https:" && !["localhost", "127.0.0.1"].includes(origin.hostname);
}

export async function currentLocale(): Promise<Locale> {
  const saved = (await cookies()).get(localeCookieName)?.value;
  return isLocale(saved) ? saved : defaultLocale;
}

export async function localizedPageMetadata({ path, title, description, image = kimonoImage(1) }: {
  path: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  image?: string;
}): Promise<Metadata> {
  const locale = await currentLocale();
  return {
    title: title[locale],
    description: description[locale],
    alternates: { canonical: path },
    openGraph: { type: "website", locale: locale === "el" ? "el_GR" : "en_GB", siteName: "Ruseè", title: title[locale], description: description[locale], url: path, images: [{ url: image, alt: title[locale] }] },
    twitter: { card: "summary_large_image", title: title[locale], description: description[locale], images: [image] },
  };
}
