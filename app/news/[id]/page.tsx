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
        title,
        description,
        youtube_url,
        thumbnail_url,
        published_at,
        youtube_channels (
          channel_name,
          channel_url
        )
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

  const channel = Array.isArray(video?.youtube_channels)
  ? video.youtube_channels[0]
  : video?.youtube_channels;

  // まず、同じカテゴリーのおすすめニュースを取得する
  const { data: sameCategoryNews, error: sameCategoryError } =
    await supabase
      .from("news")
      .select(`
        id,
        title,
        summary,
        category,
        ai_processed_at,
        videos (
          thumbnail_url
        )
      `)
      .eq("is_happy", true)
      .eq("category", news.category)
      .neq("id", id)
      .order("ai_processed_at", { ascending: false })
      .limit(4);

  if (sameCategoryError) {
    console.error("同じカテゴリーのニュース取得エラー:", sameCategoryError);
  }

  // 同じカテゴリーだけで4件に満たない場合、ほかのカテゴリーから補う
  const sameCategoryList = sameCategoryNews ?? [];
  const remainingCount = 4 - sameCategoryList.length;

  let otherCategoryNews: typeof sameCategoryList = [];

  if (remainingCount > 0) {
    const { data: otherNews, error: otherError } = await supabase
      .from("news")
      .select(`
        id,
        title,
        summary,
        category,
        ai_processed_at,
        videos (
          thumbnail_url
        )
      `)
      .eq("is_happy", true)
      .neq("id", id)
      .neq("category", news.category)
      .order("ai_processed_at", { ascending: false })
      .limit(remainingCount);

    if (otherError) {
      console.error("ほかのカテゴリーのニュース取得エラー:", otherError);
    }

    otherCategoryNews = otherNews ?? [];
  }

  // 同じカテゴリーを優先し、足りない分をほかのカテゴリーで補う
  const recommendedNews = [
    ...sameCategoryList,
    ...otherCategoryNews,
  ];

  return (
    <main className="w-full px-4 py-8">
    <div className="mx-auto max-w-3xl">
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

          {channel && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                出典：動画チャンネル
              </p>

              {channel.channel_url && (
                <a
                  href={channel.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-semibold text-orange-600 hover:underline"
                >
                  {channel.channel_name}
                </a>
              )}

              {video?.title && (
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  動画タイトル：{video.title}
                </p>
              )}
            </div>
          )}

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
    </div>

      {/* おすすめニュース */}
      {recommendedNews && recommendedNews.length > 0 && (
        <section className="mx-2 mt-10 sm:mx-4 lg:mx-6">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            ほかのおすすめニュース
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {recommendedNews.map((item) => {
              const recommendedVideo = Array.isArray(item.videos)
                ? item.videos[0]
                : item.videos;

              return (
                <a
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
                >
                  {recommendedVideo?.thumbnail_url && (
                    <img
                      src={recommendedVideo.thumbnail_url}
                      alt={item.title}
                      className="aspect-video w-full object-cover"
                    />
                  )}

                  <div className="p-4">
                    <p className="mb-2 text-xs font-semibold text-orange-600">
                      {item.category}
                    </p>

                    <h3 className="font-bold leading-relaxed text-gray-900">
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {item.summary}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}