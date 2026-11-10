/**
 * Fictional in-game map entries for Mina Phone. Dates are plot clues, not
 * real-world location tracking or verified geographic information.
 */
export type MinaMapVisit = {
  id: string;
  date: string;
  time: string;
  clock: string;
};

export const minaCafeVisitHistory: readonly MinaMapVisit[] = [
  { id: "visit-2025-11-04", date: "2025.11.04", time: "2025-11-04T19:21", clock: "19:21" },
  { id: "visit-2025-10-30", date: "2025.10.30", time: "2025-10-30T17:03", clock: "17:03" },
  { id: "visit-2025-10-28", date: "2025.10.28", time: "2025-10-28T18:42", clock: "18:42" },
];

export const minaStoryMapCopy: Record<string, { name: string; category: string; snippet: string }> = {
  "maps-cafe": {
    name: "少し静かなカフェ",
    category: "カフェ · 保存済み",
    snippet: "こぢんまりした店内。窓際に二人用の席がある。",
  },
  "maps-studio": {
    name: "練習室",
    category: "スタジオ · 保存済み",
    snippet: "レッスンやリハーサルの場所。",
  },
  "maps-home": {
    name: "自宅付近",
    category: "よく使う場所",
    snippet: "保存済みの場所。",
  },
};

export const minaCafeId = "maps-cafe";
