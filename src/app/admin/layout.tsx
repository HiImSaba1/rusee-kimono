import { privateRouteMetadata } from "@/lib/seo/indexing";

export const metadata = privateRouteMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
