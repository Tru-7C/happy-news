import type { MetadataRoute } from "next";
import { supabase } from "@/services/supabase/SupabaseService";

const BASE_URL = "https://happy-news-two.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: newsList, error } = await supabase
    .from("news")
    .select("id, ai_processed_at")
    .eq("is_happy", true)
    .order("ai_processed_at", { ascending: false });

  if (error) {
    console.error("サイトマップ用ニュース取得エラー:", error);
  }

  const newsUrls: MetadataRoute.Sitemap = (newsList ?? []).map(
    (news) => ({
      url: `${BASE_URL}/news/${news.id}`,
      lastModified: news.ai_processed_at
        ? new Date(news.ai_processed_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    ...newsUrls,
  ];
}