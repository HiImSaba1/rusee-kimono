import type { Metadata } from "next";

export const privateRouteRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
};

export const privateRouteMetadata: Metadata = { robots: privateRouteRobots };

const privateRoutePrefixes = ["/admin", "/api", "/cart", "/checkout", "/order", "/payment"] as const;

export function isPrivateRoutePath(pathname: string) {
  return privateRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
