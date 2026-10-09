"use client";

import { useState } from "react";

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  happy_score: number;
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

  return (
    <>
      {/* Prefecture tabs */}
      <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
        {availablePrefectures.map((prefecture) => (
          <button
            key={prefecture.id}
            onClick={() => setSelectedId(prefecture.id)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${
              selectedId === prefecture.id
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-orange-50"
            }`}
          >
            {prefecture.name}
          </button>
        ))}
      </div>

      {/* Selected prefecture */}
      {selectedPrefecture && (
        <section>
          <div className="mb-6">
            <p className="text-sm font-medium text-orange-500">
              LOCAL NEWS
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-800">
              {selectedPrefecture.name}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {selectedPrefecture.news.map((item) => {
              const video = Array.isArray(item.videos)
                ? item.videos[0]
                : item.videos;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
                >
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

                  <div className="p-5">
                    <div className="mb-3">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                        {selectedPrefecture.name}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold leading-relaxed text-gray-800">
                      {item.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">
                      {item.summary}
                    </p>

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
      )}
    </>
  );
}