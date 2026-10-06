import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey,
});

export type NewsAnalysis = {
  title: string;
  summary: string;
  happy_score: number;
  category:
    | "community"
    | "children"
    | "animals"
    | "environment"
    | "culture"
    | "sports"
    | "achievement"
    | "technology"
    | "other";
  reason: string;
};

export async function analyzeNews(
    title: string,
    description: string
  ): Promise<NewsAnalysis> {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: `
  あなたは「Happy News」ニュースサイトの編集者です。
  
  以下のニュースを分析し、Happy Newsとして読みやすい形にしてください。
  
  元のタイトル:
  ${title}
  
  説明:
  ${description}
  
  次のJSON形式だけで返してください。
  
  {
    "title": "",
    "summary": "",
    "happy_score": 0,
    "category": "",
    "reason": ""
  }
  
  ルール:
  
  【title】
  - 元のタイトルをもとに、ニュースの中身そのものが伝わるタイトルにする
  - 思わず読んでみたくなる、自然で興味を引くタイトルにする
  - 元のニュース内容から大きく離れない
  - ニュース番組や新聞記事の見出しのような簡潔さがあるタイトルにする
  - 事実にない内容を追加しない
  - 地域名は省略する（どこのニュースかは分かっているため）
  - 30〜40文字程度を目安にする
  - 「公式動画」「動画で紹介」「配信中」「公開」「YouTube」など、動画や配信に関する表現は入れない
  - 「紹介する」「紹介」「伝える」など、ニュースを報道する行為そのものを表す表現は入れない
  - タイトルの最後に、媒体や配信に関する定型的な表現を付け加えない
  - ニュースで起きた出来事や、人・動物・地域の取り組みなど、ニュースの内容そのものをタイトルにする
  
  【summary】
  - ニュースの内容を分かりやすく説明する
  - 100文字以内
  
  【happy_score】
  - 1〜100の整数
  - 70以上ならHappy Newsとして掲載できる
  - 69以下なら掲載しない
  
  【category】
  次のいずれか:
  community
  children
  animals
  environment
  culture
  sports
  achievement
  technology
  other
  
  【reason】
  - なぜそのhappy_scoreにしたのかを簡潔に説明する
  
  重要:
  - ニュースに書かれていない事実を推測して追加しない
  - JSON以外の文章は返さない
  `,
    });
  
    const result = JSON.parse(response.output_text);
  
    return result;
}