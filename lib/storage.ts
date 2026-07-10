import { STORAGE_BUCKETS } from "@/lib/constants";

export function getThumbnailUrl(path: string | null): string | null {
  if (!path) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.thumbnails}/${path}`;
}
