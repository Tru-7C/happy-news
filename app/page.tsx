import { getHappyNewsByPrefecture } from "@/services/supabase/SupabaseService";
import PrefectureTabs from "@/app/components/PrefectureTabs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prefectures = await getHappyNewsByPrefecture();

  const hasNews = prefectures.some(
    (prefecture) => prefecture.news.length > 0
  );

  return (
    <main className="min-h-screen bg-[#fffaf5]">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Happy News
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            日本のちょっと嬉しいニュース
          </p>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {hasNews ? (
          <PrefectureTabs prefectures={prefectures} />
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center">
            <p className="text-gray-500">
              現在、Happy Newsはありません。
            </p>
          </div>
        )}
      </div>
    </main>
  );
}