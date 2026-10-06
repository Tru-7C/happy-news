import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is not set");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

export async function saveNewsToSupabase(
    videoId: string,
    analysis: {
      title: string;
      summary: string;
      happy_score: number;
      category:
        | "community"
        | "children"
        | "animals"
        | "environment"
        | "culture"
        | "sports"
        | "achievement"
        | "technology"
        | "other";
      reason: string;
    }
  ) {
    const isHappy = analysis.happy_score >= 70;
  
    const { data, error } = await supabase
      .from("news")
      .upsert(
        {
          video_id: videoId,
          title: analysis.title,
          summary: analysis.summary,
          happy_score: analysis.happy_score,
          category: analysis.category,
          is_happy: isHappy,
          ai_reason: analysis.reason,
        },
        { onConflict: "video_id" }
      )
      .select()
      .single();
  
    if (error) {
      throw new Error(`Failed to save news: ${error.message}`);
    }
  
    return data;
  }

  export async function updateVideoAiStatus(
    videoId: string,
    status: "pending" | "processing" | "completed" | "failed"
  ) {
    const { error } = await supabase
      .from("videos")
      .update({
        ai_status: status,
      })
      .eq("id", videoId);
  
    if (error) {
      throw new Error(`Failed to update AI status: ${error.message}`);
    }
  }

  export async function getHappyNews() {
  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      video_id,
      title,
      summary,
      happy_score,
      category,
      is_happy,
      ai_processed_at,
      videos (
        id,
        youtube_video_id,
        youtube_url,
        thumbnail_url,
        published_at,
        youtube_channels (
          id,
          channel_name,
          channel_prefectures (
            prefectures (
              id,
              name,
              code,
              region
            )
          )
        )
      )
    `)
    .eq("is_happy", true)
    .order("ai_processed_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to get happy news: ${error.message}`
    );
  }

  return data;
}

export async function getHappyNewsByPrefecture() {
  const { data: prefectures, error: prefectureError } =
    await supabase
      .from("prefectures")
      .select("id, name, code, region")
      .order("id");

  if (prefectureError) {
    throw new Error(
      `Failed to get prefectures: ${prefectureError.message}`
    );
  }

  const { data: news, error: newsError } =
    await supabase
      .from("news")
      .select(`
        id,
        video_id,
        title,
        summary,
        happy_score,
        category,
        is_happy,
        ai_processed_at,
        videos (
          id,
          youtube_video_id,
          youtube_url,
          thumbnail_url,
          published_at,
          youtube_channels (
            id,
            channel_name,
            channel_prefectures (
              prefecture_id
            )
          )
        )
      `)
      .eq("is_happy", true)
      .order("ai_processed_at", {
        ascending: false,
      });

  if (newsError) {
    throw new Error(
      `Failed to get happy news: ${newsError.message}`
    );
  }

  return prefectures.map((prefecture) => {
    const prefectureNews = (news ?? []).filter((item) => {
      const video = Array.isArray(item.videos)
        ? item.videos[0]
        : item.videos;

      const channel = video?.youtube_channels;

      const channelData = Array.isArray(channel)
        ? channel[0]
        : channel;

      const channelPrefectures =
        channelData?.channel_prefectures ?? [];

      return channelPrefectures.some(
        (item: any) =>
          item.prefecture_id === prefecture.id
      );
    });

    return {
      ...prefecture,
      news: prefectureNews,
    };
  });
}