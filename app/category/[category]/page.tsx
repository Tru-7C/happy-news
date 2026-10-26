
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/services/supabase/SupabaseService";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

const categoryNames: Record<string, string> = {
  community: "地域",
  children: "子ども",
  animals: "動物",
  environment: "環境",
  culture: "文化",
  sports: "スポーツ",
  achievement: "活躍・受賞",
  technology: "技術",
  other: "その他",
};

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const name = categoryNames[category];

  return {
    title: name ? `${name}に関するニュース | Happy News` : "ニュース | Happy News",
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryName = categoryNames[category];

  if (!categoryName) {
    notFound();
  }

  const { data: newsList, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      summary,
      category,
      videos (
        thumbnail_url,
        published_at
      )
    `)
    .eq("category", category)
    .eq("is_happy", true)
    .order("ai_processed_at", { ascending: false });

  if (error) {
    console.error("カテゴリー別ニュースの取得に失敗しました:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-orange-600"
        >
          ← Happy News トップへ戻る
        </Link>

        <header className="mb-6 mt-6">
          <p className="text-sm font-semibold text-orange-600">
            カテゴリー
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {categoryName}に関するニュース
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {newsList?.length ?? 0}件のニュース
          </p>
        </header>

        {!newsList || newsList.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              このカテゴリーのニュースはまだありません。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {newsList.map((news) => {
              const videoRelation = news.videos;
              const video = Array.isArray(videoRelation)
                ? videoRelation[0]
                : videoRelation;

              return (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
                >
                  {video?.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-orange-50 text-sm text-orange-700">
                      Happy News
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-xs font-semibold text-orange-600">
                      {categoryName}
                    </p>
                    <h2 className="mt-2 line-clamp-2 font-bold leading-7 text-gray-900 group-hover:text-orange-700">
                      {news.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                      {news.summary}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
