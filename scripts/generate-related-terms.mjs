
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  throw new Error("必要な環境変数が設定されていません。");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// 最新のHappy Newsを1件取得
const { data: news, error } = await supabase
  .from("news")
  .select(`
    id,
    title,
    summary,
    videos (
      title,
      description
    )
  `)
  .eq("is_happy", true)
  .order("ai_processed_at", { ascending: false })
  .limit(1)
  .single();

if (error || !news) {
  throw new Error(`ニュース取得失敗: ${error?.message ?? "データなし"}`);
}

const video = Array.isArray(news.videos)
  ? news.videos[0]
  : news.videos;

console.log("対象ニュース:", news.title);

const response = await openai.chat.completions.create({
  model: "gpt-5-mini",
  messages: [
    {
      role: "system",
      content: `
あなたは、日本の地域ニュースをきっかけに、読者の知的好奇心を満たす豆知識を提供する編集者です。

ニュースを読んだ大人が「へぇ、そうなんだ！」と思える用語・豆知識を選んでください。

【選び方】
- 0〜3個選んでください。適切なものがなければ空配列にしてください。
- 大人なら誰でも知っている一般的な言葉は選ばないでください。
- 「準決勝」「大会」「地域」「環境」など、意味が明白な言葉の辞書的な説明は避けてください。
- 地域特有の文化や行事の由来、施設の特徴、競技独自のルール、取り組みの背景など、ニュースに関連する興味深い知識を優先してください。
- ニュースの内容を理解する助けになる情報を選んでください。関係の薄い雑学は追加しないでください。
- ニュースに書かれていない事実を、確認済みの事実として作らないでください。
- 一般知識も確かな情報に限り、確信がなければ背景情報は省略してください。
- 適切な豆知識がなければ、無理に作らず0個にしてください。

【文章】
- 子どもにもわかりやすく、大人にも発見がある日本語にしてください。
- です・ます調で簡潔に説明してください。
- readingには読み方をひらがなで書いてください。
- explanationには用語の意味や特徴を書いてください。
- backgroundには、理解を深める背景情報がある場合だけ書いてください。
- ニュースの要約や感想を繰り返さないでください。

必ず次の形式のJSONで返してください。
{
  "terms": [
    {
      "term": "用語",
      "reading": "よみかた",
      "explanation": "意味や特徴",
      "background": "必要な場合のみ背景"
    }
  ]
}
      `,
    },
    {
      role: "user",
      content: `
タイトル：${video?.title ?? news.title}
説明：${video?.description ?? ""}
要約：${news.summary}
      `,
    },
  ],
  response_format: { type: "json_object" },
});

const content = response.choices[0]?.message?.content;
const parsed = content ? JSON.parse(content) : { terms: [] };
const terms = Array.isArray(parsed.terms) ? parsed.terms.slice(0, 3) : [];

console.log("生成された用語:", JSON.stringify(terms, null, 2));

// 用語をSupabaseに保存
const { error: updateError } = await supabase
  .from("news")
  .update({ related_terms: terms })
  .eq("id", news.id);

if (updateError) {
  throw new Error(`保存失敗: ${updateError.message}`);
}

console.log("保存完了！");
