import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/services/supabase/SupabaseService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};


type MetadataProps = {
    params: Promise<{
      id: string;
    }>;
  };
  
  export async function generateMetadata({
    params,
  }: MetadataProps): Promise<Metadata> {
    const { id } = await params;
  
    const { data: news } = await supabase
      .from("news")
      .select("title, summary")
      .eq("id", id)
      .eq("is_happy", true)
      .maybeSingle();
  
    if (!news) {
      return {
        title: "ニュースが見つかりません | Happy News",
      };
    }
  
    return {
      title: `${news.title} | Happy News`,
      description: news.summary,
    };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: news, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      summary,
      happy_score,
      category,
      ai_processed_at,
      videos (
        youtube_url,
        thumbnail_url,
        published_at
      )
    `)
    .eq("id", id)
    .eq("is_happy", true)
    .maybeSingle();

  if (error) {
    console.error("ニュース取得エラー:", error);
    throw new Error("ニュースを取得できませんでした。");
  }

  if (!news) {
    notFound();
  }

  const video = Array.isArray(news.videos)
    ? news.videos[0]
    : news.videos;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <a
        href="/"
        className="text-sm text-orange-600 hover:underline"
      >
        ← Happy News トップへ戻る
      </a>

      <article className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {video?.thumbnail_url && (
          <img
            src={video.thumbnail_url}
            alt={news.title}
            className="aspect-video w-full object-cover"
          />
        )}

        <div className="p-5 md:p-8">
          <p className="text-sm font-semibold text-orange-600">
            {news.category}
          </p>

          <h1 className="mt-3 text-2xl font-bold leading-relaxed text-gray-900 md:text-3xl">
            {news.title}
          </h1>

          <p className="mt-5 whitespace-pre-wrap leading-8 text-gray-700">
            {news.summary}
          </p>

          {video?.published_at && (
            <p className="mt-4 text-sm text-gray-400">
              公開日：
              {new Date(video.published_at).toLocaleDateString("ja-JP")}
            </p>
          )}

          {video?.youtube_url && (
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              YouTubeで元の動画を見る →
            </a>
          )}
        </div>
      </article>
    </main>
  );
}