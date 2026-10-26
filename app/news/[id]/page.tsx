
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/services/supabase/SupabaseService";
import Link from "next/link";

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
      intro_text,
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

  // 同じカテゴリーのおすすめニュースを取得
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
    console.error(
      "同じカテゴリーのニュース取得エラー:",
      sameCategoryError
    );
  }

  const sameCategoryList = sameCategoryNews ?? [];
  const remainingCount = 4 - sameCategoryList.length;

  let otherCategoryNews: typeof sameCategoryList = [];

  // 足りない場合は別カテゴリーのニュースで補う
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
      console.error(
        "ほかのカテゴリーのニュース取得エラー:",
        otherError
      );
    }

    otherCategoryNews = otherNews ?? [];
  }

  const recommendedNews = [
    ...sameCategoryList,
    ...otherCategoryNews,
  ];

  // 公開日を表示
  const publishedDate = video?.published_at
    ? new Date(video.published_at)
    : null;

  const formattedDate =
    publishedDate && !Number.isNaN(publishedDate.getTime())
      ? new Intl.DateTimeFormat("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Tokyo",
        }).format(publishedDate)
      : null;

  // 「3日前」などの経過時間を表示
  const relativeDate = publishedDate
    ? (() => {
        const now = new Date();
        const today = new Date(
          now.toLocaleString("en-US", {
            timeZone: "Asia/Tokyo",
          })
        );
        const published = new Date(
          publishedDate.toLocaleString("en-US", {
            timeZone: "Asia/Tokyo",
          })
        );

        const days = Math.max(
          0,
          Math.floor(
            (today.getTime() - published.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );

        if (days === 0) return "今日";
        if (days === 1) return "1日前";
        if (days < 30) return `${days}日前`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months}か月前`;

        const years = Math.floor(days / 365);
        return `${years}年前`;
      })()
    : null;

  return (
    <main className="w-full bg-gray-50 px-4 py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="inline-block text-sm text-orange-600 hover:underline"
        >
          ← Happy News トップへ戻る
        </a>
        <div className="p-5 md:p-8">
          {/* カテゴリー */}
          <Link
            href={`/category/${news.category}`}
            className="inline-block text-sm font-semibold text-orange-600 hover:text-orange-800 hover:underline"
          >
            {news.category}
          </Link>

          {/* ニュースタイトル */}
          <h1 className="mt-3 text-2xl font-bold leading-relaxed text-gray-900 md:text-3xl">
            {news.title}
          </h1>

          {/* 公開日 */}
          {formattedDate && (
            <p className="mt-3 text-sm text-gray-500">
              {formattedDate}
              {relativeDate && ` · ${relativeDate}`}
            </p>
          )}

          {/* イントロ */}
          {news.intro_text && (
            <div className="mt-6 rounded-xl bg-orange-50 p-4 md:p-5">
              <p className="mb-2 text-sm font-semibold text-orange-700">
                このニュースについて
              </p>
              <p className="whitespace-pre-line text-base leading-8 text-gray-700">
                {news.intro_text}
              </p>
            </div>
          )}
        </div>

        <article className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* サムネイル */}
          {video?.thumbnail_url && (
            <img
              src={video.thumbnail_url}
              alt={news.title}
              className="aspect-video w-full object-cover"
            />
          )}

          <div className="p-5 md:p-8">
            {/* ニュースの要約 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900">
                ニュースの概要
              </h2>
              <p className="mt-3 whitespace-pre-line text-base leading-8 text-gray-700">
                {news.summary}
              </p>
            </section>

            {/* 出典・動画情報 */}
            {channel && (
              <div className="mt-8 border-t border-gray-200 pt-5">
                <p className="text-sm text-gray-500">
                  出典：動画チャンネル
                </p>

                {channel.channel_url ? (
                  <a
                    href={channel.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-semibold text-orange-600 hover:underline"
                  >
                    {channel.channel_name}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold text-gray-800">
                    {channel.channel_name}
                  </p>
                )}

                {video?.title && (
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    元動画のタイトル：{video.title}
                  </p>
                )}
              </div>
            )}

            {/* 元動画へのリンク */}
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

        {/* おすすめニュース */}
        {recommendedNews.length > 0 && (
          <section className="mt-10">
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
      </div>
    </main>
  );
}
