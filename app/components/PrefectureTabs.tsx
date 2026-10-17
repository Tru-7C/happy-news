"use client";

import { useEffect, useState } from "react";

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


type RegionSetting = {
  type: "全国" | "地方" | "都道府県";
  region: string;
  prefecture: string;
};

const STORAGE_KEY = "happy-news-region-setting";

const regions: Record<string, string[]> = {
  北海道: ["北海道"],
  東北: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  関東: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  中部: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  近畿: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  中国: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  四国: ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄": [
    "福岡県", "佐賀県", "長崎県", "熊本県",
    "大分県", "宮崎県", "鹿児島県", "沖縄県",
  ],
};

export default function PrefectureTabs({
  prefectures,
}: Props) {

  const [setting, setSetting] = useState<RegionSetting>({
    type: "全国",
    region: "近畿",
    prefecture: "滋賀県",
  });
  
  // 保存済み設定を読み込み、設定変更の通知を受け取る
  useEffect(() => {
    const loadSetting = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
  
        if (saved) {
          const parsed = JSON.parse(saved) as RegionSetting;
  
          if (
            ["全国", "地方", "都道府県"].includes(parsed.type) &&
            typeof parsed.region === "string" &&
            typeof parsed.prefecture === "string"
          ) {
            setSetting(parsed);
          }
        }
      } catch (error) {
        console.error("地域設定の読み込みに失敗しました", error);
      }
    };
  
    loadSetting();
  
    window.addEventListener("happy-news-region-change", loadSetting);
  
    return () => {
      window.removeEventListener("happy-news-region-change", loadSetting);
    };
  }, []);
  
  // 全国のニュースを1つのリストにまとめる
  const allNews = prefectures.flatMap((prefecture) => prefecture.news);
  
  // 設定に合わせてニュースを絞り込む
  const filteredNews = allNews.filter((item) => {
    if (setting.type === "全国") {
      return true;
    }
  
    const names = item.prefectureNames ?? [];
  
    if (setting.type === "地方") {
      const targetPrefectures = regions[setting.region] ?? [];
  
      return names.some((name) => targetPrefectures.includes(name));
    }
  
    return names.includes(setting.prefecture);
  });
  
  // 既存のカード表示処理でも使えるようにする
  const selectedPrefecture = {
    id: 0,
    name:
      setting.type === "全国"
        ? "全国"
        : setting.type === "地方"
          ? setting.region
          : setting.prefecture,
    news: filteredNews,
  };

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
    <section>
      {sortedNews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
            ☀️
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            {selectedPrefecture.name}のHappy Newsは、ただいま準備中です
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
            まだ紹介できるニュースがありません。
            ほかの地域や全国のニュースも、ぜひご覧ください。
          </p>

          <button
            type="button"
            onClick={() => {
              const newSetting: RegionSetting = {
                type: "全国",
                region: "近畿",
                prefecture: "滋賀県",
              };

              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(newSetting)
              );

              window.dispatchEvent(
                new Event("happy-news-region-change")
              );
            }}
            className="mt-6 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            全国のニュースを見る
          </button>
        </div>

) : (
  <>
    {/* 1行目：左にメイン、右に小さいニュース1件 */}
    <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* メインカード：横幅3列分 */}
      {(() => {
        const item = sortedNews[0];
        const video = Array.isArray(item.videos)
          ? item.videos[0]
          : item.videos;

        return (
          <a
            key={item.id}
            href={`/news/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg lg:col-span-2 md:grid md:grid-cols-2"
          >
            {video?.thumbnail_url ? (
              <div className="overflow-hidden bg-gray-100">
                <img
                  src={video.thumbnail_url}
                  alt={item.title}
                  className="h-full min-h-48 w-full object-cover transition duration-300 hover:scale-[1.03]"
                />
              </div>
            ) : (
              <div className="min-h-56 bg-gray-100" />
            )}

            <div className="flex flex-col justify-center p-4 md:p-5">
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-orange-600">
                  {item.prefectureNames?.[0] ??
                    selectedPrefecture.name}
                </p>

                {video?.published_at && (
                  <time className="text-xs text-gray-400">
                    {new Date(
                      video.published_at
                    ).toLocaleDateString("ja-JP")}
                  </time>
                )}
              </div>

              <h2 className="mt-2 text-lg font-bold leading-snug text-gray-900 md:text-xl">
                {item.title}
              </h2>

              <p className="mt-2 line-clamp-3 text-sm leading-5 text-gray-600">
                {item.summary}
              </p>

              <div className="mt-4 border-t border-gray-100 pt-3 text-sm font-medium text-orange-600">
                Happy score {item.happy_score}
                <span className="float-right text-gray-700">
                  動画を見る →
                </span>
              </div>
            </div>
          </a>
        );
      })()}

      {/* 右側：小さいニュース1件 */}
      {sortedNews.length > 1 &&
        (() => {
          const item = sortedNews[1];
          const video = Array.isArray(item.videos)
            ? item.videos[0]
            : item.videos;

          return (
            <a
              key={item.id}
              href={`/news/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {video?.thumbnail_url && (
                <div className="overflow-hidden bg-gray-100">
                  <img
                    src={video.thumbnail_url}
                    alt={item.title}
                    className="aspect-video w-full object-cover transition duration-300 hover:scale-[1.03]"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-semibold text-orange-600">
                  {item.prefectureNames?.[0] ??
                    selectedPrefecture.name}
                </p>

                <h3 className="mt-1 text-base font-bold leading-snug text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-1 line-clamp-3 text-sm leading-5 text-gray-600">
                  {item.summary}
                </p>

                <span className="mt-auto pt-4 text-right text-sm font-semibold text-gray-700">
                  動画を見る →
                </span>
              </div>
            </a>
          );
        })()}
    </div>

    {/* その他のニュース */}
          {sortedNews.length > 1 && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">
                  もっとHappy News
                </h3>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {sortedNews.slice(2).map((item) => {
                  const video = Array.isArray(item.videos)
                    ? item.videos[0]
                    : item.videos;

                  return (
                    <a
                      key={item.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`/news/${item.id}`}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {video?.thumbnail_url && (
                        <div className="overflow-hidden bg-gray-100">
                          <img
                            src={video.thumbnail_url}
                            alt={item.title}
                            className="aspect-video w-full object-cover transition duration-300 hover:scale-[1.03]"
                          />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-orange-600">
                            {item.prefectureNames?.[0] ??
                              selectedPrefecture.name}
                          </p>

                          {video?.published_at && (
                            <time
                              dateTime={video.published_at}
                              className="text-xs text-gray-400"
                            >
                              {new Date(
                                video.published_at
                              ).toLocaleDateString("ja-JP", {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                              })}
                            </time>
                          )}
                        </div>

                        <h3 className="mt-1 text-base font-bold leading-snug text-gray-900">
                          {item.title}
                        </h3>

                        <p className="mt-1 line-clamp-3 text-sm leading-5 text-gray-600">
                          {item.summary}
                        </p>

                        <div className="mt-auto flex justify-end pt-4">
                          <span className="text-sm font-semibold text-gray-700">
                            動画を見る →
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}