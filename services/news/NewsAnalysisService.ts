import {
  supabase,
  saveNewsToSupabase,
  updateVideoAiStatus,
} from "../supabase/SupabaseService";

import { analyzeNews } from "../openai/OpenAIService";

export async function processPendingVideos(limit = 5) {
  // AI分析待ちの動画を取得
  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
    .eq("ai_status", "pending")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Failed to get pending videos: ${error.message}`
    );
  }

  if (!videos || videos.length === 0) {
    return [];
  }

  // 1件ずつ順番に処理
  for (const video of videos) {
    try {
      console.log(`AI analysis started: ${video.title}`);

      // 処理中にする
      await updateVideoAiStatus(video.id, "processing");

      // OpenAIで分析
      const analysis = await analyzeNews(
        video.title,
        video.description ?? ""
      );

      // AI分析結果を保存
      // Happyではないニュースも保存する
      await saveNewsToSupabase(
        video.id,
        analysis
      );

      // 完了
      await updateVideoAiStatus(
        video.id,
        "completed"
      );

      console.log(`AI analysis completed: ${video.title}`);
    } catch (error) {
      // エラーになった場合
      await updateVideoAiStatus(
        video.id,
        "failed"
      );

      console.error(
        `AI analysis failed: ${video.title}`,
        error
      );
    }
  }

  return videos;
}
