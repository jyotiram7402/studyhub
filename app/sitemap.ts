import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/browse`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/leaderboard`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/legal/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/refunds`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [{ data: notes }, { data: profiles }] = await Promise.all([
      supabase
        .from("notes")
        .select("id, updated_at")
        .eq("status", "published")
        .eq("visibility", "public")
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("profiles")
        .select("username, updated_at")
        .eq("status", "active")
        .limit(1000),
    ]);

    const noteEntries: MetadataRoute.Sitemap = (notes ?? []).map((note) => ({
      url: `${base}/notes/${note.id}`,
      lastModified: new Date(note.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((profile) => ({
      url: `${base}/profile/${profile.username}`,
      lastModified: new Date(profile.updated_at),
      changeFrequency: "weekly",
      priority: 0.4,
    }));

    return [...staticEntries, ...noteEntries, ...profileEntries];
  } catch {
    return staticEntries;
  }
}
