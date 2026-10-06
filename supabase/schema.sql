-- =========================================================
-- Happy News
-- Database Schema
-- =========================================================

-- =========================================================
-- 1. 都道府県マスタ
-- =========================================================

create table public.prefectures (
  id smallint primary key,
  name text not null unique,
  code text not null unique,
  region text not null,
  created_at timestamptz not null default now()
);


-- =========================================================
-- 2. YouTubeチャンネル
-- =========================================================

create table public.youtube_channels (
  id uuid primary key default gen_random_uuid(),

  -- YouTubeが発行するチャンネルID
  youtube_channel_id text not null unique,

  channel_name text not null,
  channel_handle text,
  channel_url text not null,

  -- NEWS: ニュース専用チャンネル
  -- GENERAL: 放送局などの一般チャンネル
  channel_type text not null
    check (channel_type in ('NEWS', 'GENERAL')),

  -- CHANNEL: チャンネルから取得
  -- PLAYLIST: プレイリストから取得
  source_type text not null
    check (source_type in ('CHANNEL', 'PLAYLIST')),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================================
-- 3. YouTubeチャンネル × 都道府県
--    多対多の中間テーブル
-- =========================================================

create table public.channel_prefectures (
  channel_id uuid not null
    references public.youtube_channels(id)
    on delete cascade,

  prefecture_id smallint not null
    references public.prefectures(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (channel_id, prefecture_id)
);

-- 「この都道府県に紐づくチャンネル」を
-- 検索しやすくする
create index idx_channel_prefectures_prefecture_id
  on public.channel_prefectures(prefecture_id);


-- =========================================================
-- 4. YouTube動画
-- =========================================================

create table public.videos (
  id uuid primary key default gen_random_uuid(),

  -- YouTube動画ID
  -- 同じ動画を2回登録できないようにする
  youtube_video_id text not null unique,

  -- 内部的なチャンネルID
  channel_id uuid not null
    references public.youtube_channels(id)
    on delete restrict,

  title text not null,
  description text,

  youtube_url text not null,
  thumbnail_url text,

  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- チャンネルから動画を検索するため
create index idx_videos_channel_id
  on public.videos(channel_id);

-- 新しい動画を取得するため
create index idx_videos_published_at
  on public.videos(published_at desc);


-- =========================================================
-- 5. Happy News
--    AIによる判定・要約結果
-- =========================================================

create table public.news (
  id uuid primary key default gen_random_uuid(),

  -- 1動画 = 1ニュース
  video_id uuid not null unique
    references public.videos(id)
    on delete cascade,

  summary text not null,

  -- 0〜100
  happy_score smallint not null
    check (happy_score between 0 and 100),

  category text not null
    check (
      category in (
        'community',
        'children',
        'animals',
        'environment',
        'culture',
        'sports',
        'achievement',
        'technology',
        'other'
      )
    ),

  -- AIによる最終判定
  is_happy boolean not null,

  -- AIがなぜこの判定をしたのか
  ai_reason text,

  ai_processed_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Happy Scoreで絞り込むため
create index idx_news_happy_score
  on public.news(happy_score);

-- カテゴリ検索用
create index idx_news_category
  on public.news(category);

-- Happy / Not Happy検索用
create index idx_news_is_happy
  on public.news(is_happy);


-- =========================================================
-- 6. RLS
-- =========================================================

alter table public.prefectures enable row level security;
alter table public.youtube_channels enable row level security;
alter table public.channel_prefectures enable row level security;
alter table public.videos enable row level security;
alter table public.news enable row level security;


-- =========================================================
-- 7. 一般ユーザーはSELECTのみ可能
-- =========================================================

create policy "Public can read prefectures"
on public.prefectures
for select
to anon, authenticated
using (true);


create policy "Public can read youtube channels"
on public.youtube_channels
for select
to anon, authenticated
using (true);


create policy "Public can read channel prefectures"
on public.channel_prefectures
for select
to anon, authenticated
using (true);


create policy "Public can read videos"
on public.videos
for select
to anon, authenticated
using (true);


create policy "Public can read news"
on public.news
for select
to anon, authenticated
using (true);


-- =========================================================
-- 8. 初期データ：47都道府県
-- =========================================================

insert into public.prefectures (id, name, code, region)
values
  (1,  '北海道',   '01', '北海道'),

  (2,  '青森県',   '02', '東北'),
  (3,  '岩手県',   '03', '東北'),
  (4,  '宮城県',   '04', '東北'),
  (5,  '秋田県',   '05', '東北'),
  (6,  '山形県',   '06', '東北'),
  (7,  '福島県',   '07', '東北'),

  (8,  '茨城県',   '08', '関東'),
  (9,  '栃木県',   '09', '関東'),
  (10, '群馬県',   '10', '関東'),
  (11, '埼玉県',   '11', '関東'),
  (12, '千葉県',   '12', '関東'),
  (13, '東京都',   '13', '関東'),
  (14, '神奈川県', '14', '関東'),

  (15, '新潟県',   '15', '中部'),
  (16, '富山県',   '16', '中部'),
  (17, '石川県',   '17', '中部'),
  (18, '福井県',   '18', '中部'),
  (19, '山梨県',   '19', '中部'),
  (20, '長野県',   '20', '中部'),
  (21, '岐阜県',   '21', '中部'),
  (22, '静岡県',   '22', '中部'),
  (23, '愛知県',   '23', '中部'),

  (24, '三重県',   '24', '近畿'),
  (25, '滋賀県',   '25', '近畿'),
  (26, '京都府',   '26', '近畿'),
  (27, '大阪府',   '27', '近畿'),
  (28, '兵庫県',   '28', '近畿'),
  (29, '奈良県',   '29', '近畿'),
  (30, '和歌山県', '30', '近畿'),

  (31, '鳥取県',   '31', '中国'),
  (32, '島根県',   '32', '中国'),
  (33, '岡山県',   '33', '中国'),
  (34, '広島県',   '34', '中国'),
  (35, '山口県',   '35', '中国'),

  (36, '徳島県',   '36', '四国'),
  (37, '香川県',   '37', '四国'),
  (38, '愛媛県',   '38', '四国'),
  (39, '高知県',   '39', '四国'),

  (40, '福岡県',   '40', '九州'),
  (41, '佐賀県',   '41', '九州'),
  (42, '長崎県',   '42', '九州'),
  (43, '熊本県',   '43', '九州'),
  (44, '大分県',   '44', '九州'),
  (45, '宮崎県',   '45', '九州'),
  (46, '鹿児島県', '46', '九州'),
  (47, '沖縄県',   '47', '沖縄');