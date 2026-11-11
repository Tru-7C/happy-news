
import {
    supabase,
    saveNewsToSupabase,
    updateVideoAiStatus,
  } from "@/services/supabase/SupabaseService";
  
  import {
    analyzeNews,
    generateNewsIntro,
    generateRelatedTerms,
    type NewsAnalysis,
    type RelatedTerm,
  } from "@/services/openai/OpenAIService";
  
  // AI分析待ちの動画を取得する
  export async function getPendingVideosStep(limit: number) {
    "use step";
  
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, description")
      .eq("ai_status", "pending")
      .order("published_at", { ascending: true })
      .limit(limit);
  
    if (error) {
      throw new Error(
        `Failed to get pending videos: ${error.message}`
      );
    }
  
    return (data ?? []).map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description ?? "",
    }));
  }
  
  // 動画を処理中にする（他のWorkflowとの重複を防ぐ）
  export async function claimPendingVideoStep(videoId: string) {
    "use step";
  
    const { data, error } = await supabase
      .from("videos")
      .update({ ai_status: "processing" })
      .eq("id", videoId)
      .eq("ai_status", "pending")
      .select("id")
      .maybeSingle();
  
    if (error) {
      throw new Error(
        `Failed to claim video: ${error.message}`
      );
    }
  
    return data !== null;
  }
  
  // AI分析
  export async function analyzeNewsStep(
    title: string,
    description: string
  ): Promise<NewsAnalysis> {
    "use step";
  
    return await analyzeNews(title, description);
  }
  
  // 導入文生成
  export async function generateIntroStep(
    title: string,
    description: string,
    summary: string
  ): Promise<string> {
    "use step";
  
    return await generateNewsIntro(
      title,
      description,
      summary
    );
  }
  
  // 関連用語生成
  export async function generateRelatedTermsStep(
    title: string,
    description: string,
    summary: string
  ): Promise<RelatedTerm[]> {
    "use step";
  
    return await generateRelatedTerms(
      title,
      description,
      summary
    );
  }
  
  // AI分析結果を保存
  export async function saveNewsStep(
    videoId: string,
    analysis: NewsAnalysis,
    introText: string | null,
    relatedTerms: RelatedTerm[]
  ) {
    "use step";
  
    return await saveNewsToSupabase(videoId, {
      ...analysis,
      intro_text: introText,
      related_terms: relatedTerms,
    });
  }
  
  // 動画を完了にする
  export async function completeVideoStep(videoId: string) {
    "use step";
  
    await updateVideoAiStatus(videoId, "completed");
  }
  
  // 動画を失敗にする
  export async function failVideoStep(videoId: string) {
    "use step";
  
    await updateVideoAiStatus(videoId, "failed");
  }
  