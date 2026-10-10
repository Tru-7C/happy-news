"use client";

import { useState } from "react";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  happy_score: number;
  ai_processed_at?: string;
  prefectureNames?: string[];
  videos: any;
};

type Prefecture = {
  id: number;
  name: string;
  news: NewsItem[];
};

type Props = {
  prefectures: Prefecture[];
};

export default function PrefectureTabs({
  prefectures,
}: Props) {
  const availablePrefectures = prefectures.filter(
    (prefecture) => prefecture.news.length > 0
  );

  const [selectedId, setSelectedId] = useState(
    availablePrefectures[0]?.id
  );

  const selectedPrefecture = availablePrefectures.find(
    (prefecture) => prefecture.id === selectedId
  );

  // 公開日時が新しいニュースから並べる
  const sortedNews = [...(selectedPrefecture?.news ?? [])].sort(
    (a, b) => {
      const videoA = Array.isArray(a.videos)
        ? a.videos[0]
        : a.videos;

      const videoB = Array.isArray(b.videos)
        ? b.videos[0]
        : b.videos;

      const dateA =
        videoA?.published_at ?? a.ai_processed_at ?? "";

      const dateB =
        videoB?.published_at ?? b.ai_processed_at ?? "";

      return (
        new Date(dateB).getTime() -
        new Date(dateA).getTime()
      );
    }
  );

  return (
    <>
      {selectedPrefecture && (
        <section>
        {/* Lead story */}
        {sortedNews.length > 0 &&
        (() => {
            const item = sortedNews[0];

            const video = Array.isArray(item.videos)
            ? item.videos[0]
            : item.videos;

            return (
            <a
                key={item.id}
                href={video?.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-8 grid overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg md:grid-cols-2"
            >
                {video?.thumbnail_url ? (
                <div className="block overflow-hidden bg-gray-100">
                    <img
                    src={video.thumbnail_url}
                    alt={item.title}
                    className="h-full min-h-56 w-full object-cover transition duration-300 hover:scale-[1.03]"
                    />
                </div>
                ) : (
                <div className="min-h-56 bg-gray-100" />
                )}

                <div className="flex flex-col justify-center p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                    {item.prefectureNames?.[0] ??
                    selectedPrefecture.name}
                </p>

                <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-gray-900 md:text-3xl">
                    {item.title}
                </h3>

                <p className="mt-4 line-clamp-4 text-sm leading-7 text-gray-600">
                    {item.summary}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm font-medium text-orange-600">
                    Happy score {item.happy_score}
                    </span>

                    <span className="text-sm font-semibold text-gray-700">
                    Watch video →
                    </span>
                </div>
                </div>
            </a>
            );
        })()}

          {/* Other stories */}
          {sortedNews.length > 1 && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">
                  More good news
                </h3>

                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedNews.slice(1).map((item) => {
                  const video = Array.isArray(item.videos)
                    ? item.videos[0]
                    : item.videos;

                  return (
                    <a
                      key={item.id}
                      href={video?.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {video?.thumbnail_url && (
                        <div className="block overflow-hidden bg-gray-100">
                          <img
                            src={video.thumbnail_url}
                            alt={item.title}
                            className="aspect-video w-full object-cover transition duration-300 hover:scale-[1.03]"
                          />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col px-4 pt-4 pb-5">
                        <p className="text-xs font-semibold text-orange-600">
                          {item.prefectureNames?.[0] ??
                            selectedPrefecture.name}
                        </p>

                        <h4 className="mt-2 text-lg font-bold leading-snug text-gray-900">
                          {item.title}
                        </h4>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                          {item.summary}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}