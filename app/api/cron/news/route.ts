import { fetchAndSaveLatestVideos } from "@/services/youtube/YouTubeService";
import { processPendingVideos } from "@/services/news/NewsAnalysisService";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      {
        success: false,
        error: "CRON_SECRET is not set",
      },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    // YouTubeから最新動画を取得
    const fetchResults =
      await fetchAndSaveLatestVideos();

    // AI分析待ちの動画を処理
    const analysisResults =
      await processPendingVideos(5);

    return Response.json({
      success: true,
      fetchResults,
      analysisCount: analysisResults.length,
    });
  } catch (error) {
    console.error(
      "Cron news processing failed:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}