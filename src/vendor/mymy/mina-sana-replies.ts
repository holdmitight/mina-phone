import { makeItem, type Item } from "../../schema";

export type SanaBranch = "deny" | "why" | "memory";

export const minaSanaChoices: readonly {
  id: SanaBranch;
  text: string;
  responses: readonly string[];
}[] = [
  {
    id: "deny",
    text: "別に何もないよ。",
    responses: [
      "ほんとに〜？笑",
      "まあ、話したくなったら聞くからね。",
    ],
  },
  {
    id: "why",
    text: "……なんでそう思うの？",
    responses: [
      "だって、最近ずっとスマホ見てるし。",
      "何か待ってるみたいだったから。",
    ],
  },
  {
    id: "memory",
    text: "ちょっと、昔のことを思い出してた。",
    responses: [
      "そっか。",
      "……その人のこと、まだ大事なんだね。",
    ],
  },
] as const;

export const minaSanaIntro = [
  "よかった〜笑",
  "ちょっと聞きたいことがあってさ",
  "最近、みーたん一人で考え込んでること多くない？",
  "……また何か隠してるでしょ？👀",
] as const;

/** The extra conversation can appear only after the cafe clue unlocks Sana's message. */
export function hasSanaStoryPrompt(items: readonly Item[]): boolean {
  return items.some(
    (item) =>
      item.id === "mina-story-cafe-sana-ping" &&
      item.title === "Sana" &&
      !item.outgoing,
  );
}

export function isSanaBranch(value: string): value is SanaBranch {
  return minaSanaChoices.some((option) => option.id === value);
}

/** Fixed offsets keep the exchange stable across app visits and page reloads. */
function timeAfter(pingTime: string, minutes: number): string {
  const normalized = pingTime.replace(" ", "T");
  const date = new Date(normalized.endsWith("Z") ? normalized : normalized + "Z");
  if (Number.isNaN(date.getTime())) return pingTime;
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function line(
  ping: Item,
  id: string,
  body: string,
  minutes: number,
  outgoing: boolean,
): Item {
  return makeItem({
    id: "mina-sana-interactive-" + id,
    title: "Sana",
    body,
    sender: outgoing ? "名井南" : "Sana",
    time: timeAfter(ping.time, minutes),
    outgoing,
    folder: "聊天",
    read: true,
    meta: { local: "true", story: "sana-interactive" },
  });
}

export function minaSanaInteractiveMessages(
  ping: Item | undefined,
  stage: string,
): Item[] {
  if (!ping || (stage !== "awake" && !isSanaBranch(stage))) return [];
  const result = [
    line(ping, "awake", "まだ寝てないよ。", 1, true),
    ...minaSanaIntro.map((message, i) =>
      line(ping, "intro-" + i, message, i + 2, false),
    ),
  ];
  if (isSanaBranch(stage)) {
    const choice = minaSanaChoices.find((option) => option.id === stage)!;
    result.push(line(ping, "choice-" + stage, choice.text, 6, true));
    choice.responses.forEach((reply, index) =>
      result.push(line(ping, "reply-" + stage + "-" + index, reply, index + 7, false)),
    );
  }
  return result;
}
