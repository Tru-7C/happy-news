
import {
    getPendingVideosStep,
    claimPendingVideoStep,
    analyzeNewsStep,
    generateIntroStep,
    generateRelatedTermsStep,
    saveNewsStep,
    completeVideoStep,
    failVideoStep,
  } from "./newsWorkflowSteps";
  
  export async function processNewsWorkflow(limit = 20) {
    "use workflow";
  
    // AI分析待ちの動画を取得
    const videos = await getPendingVideosStep(limit);
  
    let completedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
  
    // 動画を1件ずつ順番に処理
    for (const video of videos) {
      // 他のWorkflowが先に処理を開始していないか確認
      const claimed = await claimPendingVideoStep(video.id);
  
      if (!claimed) {
        skippedCount++;
        continue;
      }
  
      try {
        // AI分析
        const analysis = await analyzeNewsStep(
          video.title,
          video.description
        );
  
        // Happy Newsに掲載する動画だけ導入文を生成
        const introText =
          analysis.happy_score >= 65
            ? await generateIntroStep(
                video.title,
                video.description,
                analysis.summary
              )
            : null;
  
        // Happy Newsに掲載する動画だけ関連用語を生成
        const relatedTerms =
          analysis.happy_score >= 65
            ? await generateRelatedTermsStep(
                video.title,
                video.description,
                analysis.summary
              )
            : [];
  
        // AI分析結果を保存
        await saveNewsStep(
          video.id,
          analysis,
          introText,
          relatedTerms
        );
  
        // 完了
        await completeVideoStep(video.id);
  
        completedCount++;
      } catch (error) {
        // Stepの再試行がすべて失敗した場合
        await failVideoStep(video.id);
  
        failedCount++;
      }
    }
  
    return {
      success: true,
      totalCount: videos.length,
      completedCount,
      failedCount,
      skippedCount,
    };
  }
  