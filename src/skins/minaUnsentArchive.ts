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
      "「ごめんね」じゃなくて、",
      "「行かないで」って言えばよかった。",
      "",
      "返事をするのが怖くて、",
      "何も書けなかった。",
      "",
      "あの子はきっと、",
      "私が別れても平気だと思ってる。",
      "",
      "……全然、平気じゃないのに。",
    ].join("\n"),
  },
  later: {
    id: "mina-story-unsent-2018",
    title: "消せないまま",
    time: "2018-06-16 23:47",
    body: [
      "プレイリストの名前、まだ変えられない。",
      "",
      "雨の日になると、",
      "「雨が大きい」って言ったあの声を思い出す。",
      "",
      "今なら、ちゃんと直せるよ。",
      "……そんなこと、もう言う相手もいないけど。",
      "",
      "元気でいてね。",
      "",
      "送信しない。",
    ].join("\n"),
  },
  reunion: {
    id: "mina-story-unsent-2025",
    title: "カフェの帰り道",
    time: "2025-11-08 22:04",
    body: [
      "ステージの向こうに、あの子がいた。",
      "目が合った瞬間、何も考えられなくなった。",
      "",
      "あのカフェの前を通るたびに、",
      "会いたい理由ばかり探してる。",
      "",
      "また待たせてしまうなら、",
      "今度こそ、ちゃんと話さなきゃ。",
      "",
      "返事を急がせるつもりはない。",
      "ただ、逃げたくない。",
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
