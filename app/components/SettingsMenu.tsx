
"use client";

import { useEffect, useState } from "react";

type RegionType = "全国" | "地方" | "都道府県";

type RegionSetting = {
  type: RegionType;
  region: string;
  prefecture: string;
};

const STORAGE_KEY = "happy-news-region-setting";

const defaultSetting: RegionSetting = {
  type: "全国",
  region: "近畿",
  prefecture: "滋賀県",
};

const regions: Record<string, string[]> = {
  北海道: ["北海道"],
  東北: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  関東: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  中部: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  近畿: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  中国: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  四国: ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
};

const allPrefectures = Object.values(regions).flat();

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showRegionSettings, setShowRegionSettings] =
    useState(false);

  // 現在保存されている設定
  const [setting, setSetting] =
    useState<RegionSetting>(defaultSetting);

  // 設定画面で編集中の内容
  const [draft, setDraft] =
    useState<RegionSetting>(defaultSetting);

  // 初回表示時にブラウザから設定を読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "type" in parsed &&
          "region" in parsed &&
          "prefecture" in parsed
        ) {
          const value = parsed as RegionSetting;

          if (
            ["全国", "地方", "都道府県"].includes(value.type) &&
            typeof value.region === "string" &&
            typeof value.prefecture === "string" &&
            (value.type !== "地方" ||
              value.region in regions) &&
            (value.type !== "都道府県" ||
              allPrefectures.includes(value.prefecture))
          ) {
            setSetting(value);
            setDraft(value);
          }
        }
      }
    } catch {
      // 保存データが読み取れない場合は初期設定を使う
    }
  }, []);

  const openSettings = () => {
    setDraft(setting);
    setShowRegionSettings(true);
    setIsOpen(false);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(draft)
      );

      window.dispatchEvent(new Event("happy-news-region-change"));

      setSetting(draft);
      setShowRegionSettings(false);
    } catch {
      window.alert(
        "設定を保存できませんでした。ブラウザの設定を確認してください。"
      );
    }
  };

  const selectedLabel =
    setting.type === "全国"
      ? "全国"
      : setting.type === "地方"
        ? setting.region
        : setting.prefecture;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="設定メニュー"
        aria-expanded={isOpen}
        title="設定"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 transition hover:opacity-75"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            fill="rgb(255, 165, 0)"
            d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Settings
          </p>

          <button
            type="button"
            onClick={openSettings}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-700 transition hover:bg-orange-50 hover:text-orange-700"
          >
            <span>📍</span>
            地域設定
            <span className="ml-auto text-gray-400">
              {selectedLabel} ›
            </span>
          </button>
        </div>
      )}

      {showRegionSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="region-settings-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id="region-settings-title"
              className="text-xl font-bold text-gray-900"
            >
              地域設定
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              表示するニュースの範囲を選んでください。
            </p>

            <div className="mt-5 space-y-3">
              {(["全国", "地方", "都道府県"] as const).map(
                (type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                      draft.type === type
                        ? "border-orange-200 bg-orange-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="regionType"
                      value={type}
                      checked={draft.type === type}
                      onChange={() =>
                        setDraft({ ...draft, type })
                      }
                      className="accent-orange-500"
                    />
                    <span className="font-medium text-gray-900">
                      {type}
                    </span>
                  </label>
                )
              )}
            </div>

            {draft.type === "地方" && (
              <div className="mt-4">
                <label
                  htmlFor="region-select"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  地方を選択
                </label>
                <select
                  id="region-select"
                  value={draft.region}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      region: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
                >
                  {Object.keys(regions).map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {draft.type === "都道府県" && (
              <div className="mt-4">
                <label
                  htmlFor="prefecture-select"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  都道府県を選択
                </label>
                <select
                  id="prefecture-select"
                  value={draft.prefecture}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      prefecture: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm"
                >
                  {allPrefectures.map((prefecture) => (
                    <option
                      key={prefecture}
                      value={prefecture}
                    >
                      {prefecture}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowRegionSettings(false)
                }
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={saveSettings}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                保存
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}