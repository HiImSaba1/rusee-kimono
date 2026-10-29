import { privateRouteMetadata } from "@/lib/seo/indexing";

export const metadata = privateRouteMetadata;

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
