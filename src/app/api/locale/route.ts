import { type NextRequest, NextResponse } from "next/server";
import { isLocale, localeCookieName } from "@/i18n/config";

export function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? undefined;
  const requested = request.nextUrl.searchParams.get("redirect") ?? "/";
  const redirect = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  const destination = new URL(redirect, request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) destination.host = forwardedHost;
  if (forwardedProto === "http" || forwardedProto === "https") destination.protocol = `${forwardedProto}:`;
  const response = NextResponse.redirect(destination, 303);
  if (isLocale(locale)) response.cookies.set(localeCookieName, locale, { httpOnly: true, maxAge: 31536000, path: "/", sameSite: "lax", secure: destination.protocol === "https:" });
  return response;
}
