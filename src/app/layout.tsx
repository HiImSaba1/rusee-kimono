import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "lenis/dist/lenis.css";
import "./globals.css";
import { ApplicationFrame } from "@/components/layout/ApplicationFrame";
import { StorefrontProviders } from "@/providers/StorefrontProviders";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { isIndexableProduction, siteOrigin } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const storedLocale = (await cookies()).get(localeCookieName)?.value;
  const locale = isLocale(storedLocale) ? storedLocale : defaultLocale;
  return {
    metadataBase: siteOrigin(),
    title: { default: locale === "el" ? "Ruseè — Η μελέτη του κιμονό" : "Ruseè — The Kimono Study", template: "%s — Ruseè" },
    description: locale === "el"
      ? "Μια εκδοτική μελέτη στο χρώμα, το ύφασμα και την κίνηση. Μία σιλουέτα κιμονό σε επιλεγμένα σχέδια."
      : "An editorial study in colour, cloth and movement. One kimono silhouette in considered designs.",
    applicationName: "Ruseè",
    authors: [{ name: "Ruseè" }],
    creator: "Ruseè",
    icons: {
      icon: [{ url: "/rusee_logo_main_orig.jpg", type: "image/jpeg" }],
      shortcut: "/rusee_logo_main_orig.jpg",
      apple: [{ url: "/rusee_logo_main_orig.jpg", type: "image/jpeg" }],
    },
    openGraph: { type: "website", siteName: "Ruseè", locale: locale === "el" ? "el_GR" : "en_GB", url: "/", images: [{ url: "/kimono_images_optimized/kimono_design_artemis_main.png", alt: "Ruseè kimono editorial" }] },
    twitter: { card: "summary_large_image", images: ["/kimono_images_optimized/kimono_design_artemis_main.png"] },
    robots: { index: isIndexableProduction(), follow: isIndexableProduction() },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const storedLocale = (await cookies()).get(localeCookieName)?.value;
  const locale = isLocale(storedLocale) ? storedLocale : defaultLocale;
  return (
    <html lang={locale}>
      <body suppressHydrationWarning>
        <LocaleProvider initialLocale={locale}>
          <StorefrontProviders>
            <ApplicationFrame>{children}</ApplicationFrame>
          </StorefrontProviders>
        </LocaleProvider>
      </body>
    </html>
  );
}
