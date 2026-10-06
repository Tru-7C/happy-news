import { getHappyNewsByPrefecture } from "@/services/supabase/SupabaseService";

export const dynamic = "force-dynamic";

export default async function Home() {
  const prefectures = await getHappyNewsByPrefecture();

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
        {prefectures.map((prefecture) => {
          // ニュースがない都道府県は表示しない
          if (prefecture.news.length === 0) {
            return null;
          }

          return (
            <section
              key={prefecture.id}
              className="mb-14"
            >
              {/* Prefecture title */}
              <div className="mb-6">
                <p className="text-sm font-medium text-orange-500">
                  LOCAL NEWS
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-800">
                  {prefecture.name}
                </h2>
              </div>

              {/* News cards */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {prefecture.news.map((item) => {
                  const video = Array.isArray(item.videos)
                    ? item.videos[0]
                    : item.videos;

                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
                    >
                      {/* Thumbnail */}
                      {video?.thumbnail_url && (
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="aspect-video overflow-hidden bg-gray-100">
                            <img
                              src={video.thumbnail_url}
                              alt={item.title}
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                            />
                          </div>
                        </a>
                      )}

                      {/* Content */}
                      <div className="p-5">
                        {/* Category */}
                        <div className="mb-3">
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                            {prefecture.name}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold leading-relaxed text-gray-800">
                          {item.title}
                        </h3>

                        {/* Summary */}
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">
                          {item.summary}
                        </p>

                        {/* Footer */}
                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="text-sm font-medium text-orange-500">
                            😊 Happy {item.happy_score}
                          </span>

                          <a
                            href={video?.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-500 hover:text-orange-500"
                          >
                            YouTube →
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Empty */}
        {prefectures.every(
          (prefecture) => prefecture.news.length === 0
        ) && (
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