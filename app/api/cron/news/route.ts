
import { start } from "workflow/api";

import { fetchAndSaveLatestVideos } from "@/services/youtube/YouTubeService";
import { processNewsWorkflow } from "@/src/workflows/newsWorkflow";

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

    // AI分析Workflowをバックグラウンドで開始
    await start(processNewsWorkflow, [20]);

    return Response.json({
      success: true,
      fetchResults,
      workflowStarted: true,
    });
  } catch (error) {
    console.error(
      "News workflow start failed:",
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