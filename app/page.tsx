import { getHappyNews } from "@/services/supabase/SupabaseService";
import PrefectureTabs from "@/app/components/PrefectureTabs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const news = await getHappyNews();

  const prefectures = [
    {
      id: 0,
      name: "全国",
      news: (news ?? []).map((item: any) => {
        const video = Array.isArray(item.videos)
          ? item.videos[0]
          : item.videos;

        const channel = Array.isArray(video?.youtube_channels)
          ? video.youtube_channels[0]
          : video?.youtube_channels;

        const channelPrefectures =
          channel?.channel_prefectures ?? [];

        const prefectureNames = channelPrefectures
          .map((item: any) => {
            const prefecture = Array.isArray(item.prefectures)
              ? item.prefectures[0]
              : item.prefectures;

            return prefecture?.name;
          })
          .filter(Boolean);

        return {
          ...item,
          prefectureNames,
        };
      }),
    },
  ];

  const hasNews = prefectures[0].news.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Happy News
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              日本のちょっと嬉しいニュース
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
              Today’s Good News
            </p>
            <p className="mt-1 text-sm text-gray-500">
              小さな幸せを、全国から。
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        {hasNews ? (
          <PrefectureTabs prefectures={prefectures} />
        ) : (
          <div className="border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">
              現在、Happy Newsはありません。
            </p>
          </div>
        )}
      </div>
    </main>
  );
}