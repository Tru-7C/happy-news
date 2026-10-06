import { supabase } from "../supabase/SupabaseService";

type YouTubeChannel = {
  id: string;
  youtube_channel_id: string;
  channel_name: string;
};

type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  publishedAt: string;
};

export async function getActiveChannels(): Promise<
  YouTubeChannel[]
> {
  const { data, error } = await supabase
    .from("youtube_channels")
    .select(
      "id, youtube_channel_id, channel_name"
    )
    .eq("is_active", true)
    .order("channel_name");

  if (error) {
    throw new Error(
      `Failed to get YouTube channels: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getLatestVideos(
  youtubeChannelId: string
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY is not set"
    );
  }

  // YouTubeチャンネル情報を取得
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${youtubeChannelId}&key=${apiKey}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!channelResponse.ok) {
    throw new Error(
      `Failed to fetch channel information: ${youtubeChannelId}`
    );
  }

  const channelData =
    await channelResponse.json();

  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails
      ?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error(
      `Uploads playlist not found: ${youtubeChannelId}`
    );
  }

  // uploadsプレイリストから最新5件を取得
  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=5&key=${apiKey}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!videosResponse.ok) {
    throw new Error(
      `Failed to fetch videos: ${youtubeChannelId}`
    );
  }

  const videosData =
    await videosResponse.json();

  return videosData.items.map(
    (item: any) => ({
      videoId:
        item.contentDetails.videoId,
      title: item.snippet.title,
      description:
        item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails?.medium?.url,
      publishedAt:
        item.snippet.publishedAt,
    })
  );
}

export async function saveVideosToSupabase(
  videos: YouTubeVideo[],
  channelId: string
) {
  const { data, error } = await supabase
    .from("videos")
    .upsert(
      videos.map((video) => ({
        youtube_video_id:
          video.videoId,

        // youtube_channels.id
        channel_id: channelId,

        title: video.title,
        description:
          video.description || null,

        youtube_url:
          `https://www.youtube.com/watch?v=${video.videoId}`,

        thumbnail_url:
          video.thumbnailUrl || null,

        published_at:
          video.publishedAt,
      })),
      {
        onConflict: "youtube_video_id",
      }
    )
    .select();

  if (error) {
    throw new Error(
      `Failed to save videos: ${error.message}`
    );
  }

  return data;
}

export async function fetchAndSaveLatestVideos() {
  // DBから有効なチャンネルを取得
  const channels =
    await getActiveChannels();

  const results = [];

  for (const channel of channels) {
    try {
      console.log(
        `Fetching videos: ${channel.channel_name}`
      );

      // YouTubeから動画取得
      const videos =
        await getLatestVideos(
          channel.youtube_channel_id
        );
        
        console.log(
            "YouTube videos:",
            videos.map((video) => ({
              title: video.title,
              publishedAt: video.publishedAt,
              videoId: video.videoId,
            }))
          );


      // Supabaseへ保存
      const savedVideos =
        await saveVideosToSupabase(
          videos,
          channel.id
        );

      results.push({
        channel: channel.channel_name,
        count: savedVideos?.length ?? 0,
      });

      console.log(
        `Saved ${savedVideos?.length ?? 0} videos: ${channel.channel_name}`
      );
    } catch (error) {
      console.error(
        `Failed to process channel: ${channel.channel_name}`,
        error
      );

      // 1チャンネルで失敗しても
      // 他のチャンネルは処理を続ける
    }
  }

  return results;
}