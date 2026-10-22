
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const apiKey = process.env.YOUTUBE_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const applyChanges = process.argv.includes("--apply");

if (!apiKey || !supabaseUrl || !supabaseKey) {
  throw new Error("必要な環境変数が設定されていません。");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const prefectureAliases = {
    北海道: "北海道",
    青森: "青森県",
    岩手: "岩手県",
    宮城: "宮城県",
    大阪: "大阪府",
    大阪府: "大阪府",
  };

const lines = fs
  .readFileSync(path.join(process.cwd(), "scripts", "channels.txt"), "utf8")
  .split(/\r?\n/);

  const candidates = lines
  .filter((line) => line.includes("\t"))
  .map((line) => {
    const [prefecture, channelName, identifier, status] = line.split("\t");
    return {
      prefecture: prefecture.trim(),
      channelName: channelName.trim(),
      identifier: identifier.trim(),
      status: status.trim(),
    };
  })
  .filter(
    (channel) =>
      channel.identifier === "@abc6ch" &&
      channel.status.startsWith("🟢"),
  );

async function findYouTubeChannel(identifier) {
  const params = new URLSearchParams({
    part: "snippet",
    key: apiKey,
  });

  if (identifier.startsWith("@")) {
    params.set("forHandle", identifier.slice(1));
  } else {
    params.set("id", identifier);
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params}`,
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `YouTube APIエラー: ${data.error?.message ?? response.status}`,
    );
  }

  return data.items?.[0] ?? null;
}

async function main() {
  const { data: prefectures, error: prefectureError } = await supabase
    .from("prefectures")
    .select("id, name");

  if (prefectureError) {
    throw new Error(`都道府県の取得に失敗: ${prefectureError.message}`);
  }

  const prefectureIds = new Map(
    prefectures.map((prefecture) => [prefecture.name, prefecture.id]),
  );

  const { data: existingChannels, error: channelError } = await supabase
    .from("youtube_channels")
    .select("id, youtube_channel_id, channel_name, is_active");

  if (channelError) {
    throw new Error(`チャンネルの取得に失敗: ${channelError.message}`);
  }

  const existingIds = new Map(
    existingChannels.map((channel) => [
      channel.youtube_channel_id,
      channel,
    ]),
  );

  console.log(applyChanges ? "=== 登録を実行します ===" : "=== 確認のみ（変更なし） ===");

  for (const candidate of candidates) {
    try {
      const prefectureName = prefectureAliases[candidate.prefecture];

      if (!prefectureName || !prefectureIds.has(prefectureName)) {
        console.log(`⚠️ 都道府県を特定できません: ${candidate.prefecture}`);
        continue;
      }

      const prefectureId = prefectureIds.get(prefectureName);
      const youtubeChannel = await findYouTubeChannel(candidate.identifier);

      if (!youtubeChannel) {
        console.log(`❌ YouTubeで見つかりません: ${candidate.channelName}`);
        continue;
      }

      const existing = existingIds.get(youtubeChannel.id);

      if (existing) {
        console.log(`⏭️ 登録済み: ${youtubeChannel.snippet.title}`);
        continue;
      }

      const channelType = candidate.status.includes("Official")
        ? "GENERAL"
        : "NEWS";

      const newChannel = {
        youtube_channel_id: youtubeChannel.id,
        channel_name: youtubeChannel.snippet.title,
        channel_handle: youtubeChannel.snippet.customUrl ?? null,
        channel_url: `https://www.youtube.com/channel/${youtubeChannel.id}`,
        channel_type: channelType,
        source_type: "CHANNEL",
        is_active: false,
      };

      console.log({
        prefecture: prefectureName,
        prefectureId,
        ...newChannel,
        action: applyChanges ? "登録予定" : "登録候補",
      });

      if (!applyChanges) continue;

      const { data: insertedChannel, error: insertError } = await supabase
        .from("youtube_channels")
        .insert(newChannel)
        .select("id, youtube_channel_id")
        .single();

      if (insertError) {
        console.error(`❌ 登録失敗: ${insertError.message}`);
        continue;
      }

      const { error: linkError } = await supabase
        .from("channel_prefectures")
        .insert({
          channel_id: insertedChannel.id,
          prefecture_id: prefectureId,
        });

      if (linkError) {
        console.error(
          `⚠️ チャンネルは登録されましたが、都道府県の紐づけに失敗: ${linkError.message}`,
        );
        continue;
      }

      existingIds.set(youtubeChannel.id, {
        ...newChannel,
        id: insertedChannel.id,
      });

      console.log(`✅ 登録完了: ${youtubeChannel.snippet.title}`);
    } catch (error) {
      console.error(`❌ ${candidate.channelName}: ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
