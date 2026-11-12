import { makeItem, type Item } from "../schema";

/** Mina's unsent drafts, written at different points in her ten-year silence.
 * They are private notes, not messages she actually sent to A.
 */
export const minaUnsentLetters = {
  breakup: {
    id: "mina-story-unsent-2015",
    title: "送れなかった言葉",
    time: "2015-11-07 01:23",
    body: [
      "「行かないで」って打ったら、予測変換にまだ残ってた。昨日あんなに何度も消したのに。",
      "",
      "返したのは「ごめんね」の四文字。あれで伝わるわけないよね。",
      "今日はもう寝る。……って書いてから、またトークを開いてる。",
    ].join("\n"),
  },
  later: {
    id: "mina-story-unsent-2018",
    title: "消せないまま",
    time: "2018-06-16 23:47",
    body: [
      "帰りのバスで、隣の人の傘から水がぽたぽた落ちてた。",
      "ふいに、君の「雨が大きい」って言い方を思い出して、窓のほうを向いて笑った。",
      "",
      "あの頃の曲、今日は最後まで聴けた。",
      "こういう日があったこと、忘れたくないのでメモ。",
    ].join("\n"),
  },
  reunion: {
    id: "mina-story-unsent-2025",
    title: "カフェの帰り道",
    time: "2025-11-08 22:04",
    body: [
      "カフェでミルクを二つ取って、ひとつ戻した。私はずっとブラックなのに。",
      "",
      "ステージから目が合ったときもそう。頭で考えるより先に、体が十年前のことを覚えてた。",
      "",
      "次に会えたら、まず「今もミルク入れる？」って聞きたい。",
      "それから、ちゃんと話さなきゃ。",
    ].join("\n"),
  },
} as const;

export type MinaLetterKey = keyof typeof minaUnsentLetters;

export function minaUnsentLetter(key: MinaLetterKey): Item {
  const letter = minaUnsentLetters[key];
  return makeItem({
    id: letter.id,
    title: letter.title,
    body: letter.body,
    time: letter.time,
    sender: "名井南",
    kind: "note",
    folder: "备忘录",
    meta: { story: "unsent-archive", year: letter.time.slice(0, 4) },
  });
}
