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

export type SanaStage = "" | "awake" | SanaBranch;
export type SanaAttempt = { phase: "" | "awake"; text: string };

/**
 * Lightweight, entirely on-device intent recognition.
 * Match common Japanese, Chinese, English and Korean paraphrases, with
 * conservative fallbacks instead of pretending an arbitrary sentence was understood.
 * No typed messages are sent to any external language service.
 */
function normalizeReply(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\\s\\p{P}\\p{S}]/gu, "");
}

export function matchSanaFreeText(text: string, stage: SanaStage): "awake" | SanaBranch | null {
  const value = normalizeReply(text);
  if (!value) return null;

  if (stage === "") {
    return /(?:寝てない|寝てません|まだ寝|まだ起き|起きてる|起きてます|眠くない|寝られない|寝れない|うん|はい|そうだよ|还没睡|没睡|还醒着|没睡觉|还在呢|睡不着|我在|まだだよ|notyet|notasleep|imawake|stillup|iamup|awake|yep|yeah|yes|아직안자|아직안잤|안자고있|깨어있|응|네)/u.test(value)
      ? "awake"
      : null;
  }
  if (stage !== "awake") return null;

  // A remembered person or the past is more specific than generic denials
  // and can coexist with "nothing much"/"why" in an otherwise natural message.
  if (/(?:昔|思い出|思いだ|思い返|過去|懐かし|あの頃|以前|前のこと|昔の人|あの人のこと|想起|想起来|想到了|回忆|过去|以前|从前|当年|那个人|十年前|旧事|oldtimes|olddays|backthen|past|remembered|remembering|memories|nostalg|옛날|예전|추억|과거|생각났|생각나)/u.test(value))
    return "memory";
  if (/(?:なんで|どうして|なぜ|そう思う|どう思った|わかったの|気づいたの|何で|为什么|为啥|怎么会|怎么知道|怎么发现|怎么这么说|你怎么|何以|why|howcome|whatmakesyou|howdidyouknow|whydoyou|왜|어떻게알|그렇게생각)/u.test(value))
    return "why";
  if (/(?:別に|何もない|なんもない|何でもない|なんでもない|隠してない|大丈夫|気のせい|気にしないで|特にない|特に何も|没什么|没事|没啥|没想啥|没有什么|没瞒|别多想|别担心|我很好|没问题|nothing|notmuch|imfine|itsfine|dontworry|nope|nah|아무것도|별일없|괜찮아|아니야|아냐|숨기는거없)/u.test(value))
    return "deny";
  return null;
}

export function parseSanaAttempts(raw: readonly string[]): SanaAttempt[] {
  return raw.flatMap((entry) => {
    try {
      const parsed: unknown = JSON.parse(entry);
      if (
        !Array.isArray(parsed) ||
        parsed.length !== 2 ||
        (parsed[0] !== "" && parsed[0] !== "awake") ||
        typeof parsed[1] !== "string" ||
        !parsed[1].trim() ||
        parsed[1].length > 2000
      ) return [];
      return [{ phase: parsed[0] as SanaAttempt["phase"], text: parsed[1] }];
    } catch {
      return [];
    }
  }).slice(0, 12);
}

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
  awakeText = "まだ寝てないよ。",
  replyText = "",
  attempts: readonly SanaAttempt[] = [],
): Item[] {
  if (!ping) return [];

  const startAttempts = attempts.filter((attempt) => attempt.phase === "");
  const followAttempts = attempts.filter((attempt) => attempt.phase === "awake");

  const renderAttempts = (
    source: readonly SanaAttempt[],
    offset: number,
    clarification: string,
    prefix: string,
  ) => source.flatMap((attempt, i) => [
    line(ping, prefix + "-input-" + i, attempt.text, offset + 2 * i, true),
    line(ping, prefix + "-clarify-" + i, clarification, offset + 2 * i + 1, false),
  ]);

  const beginning = renderAttempts(
    startAttempts,
    1,
    "ん？まだ起きてる？笑",
    "initial",
  );
  if (stage !== "awake" && !isSanaBranch(stage)) return beginning;

  const awakeOffset = 1 + 2 * startAttempts.length;
  const result = [
    ...beginning,
    line(ping, "awake", awakeText.trim() || "まだ寝てないよ。", awakeOffset, true),
    ...minaSanaIntro.map((message, i) =>
      line(ping, "intro-" + i, message, awakeOffset + 1 + i, false),
    ),
  ];
  const followOffset = awakeOffset + 5;
  result.push(...renderAttempts(
    followAttempts,
    followOffset,
    "え、どういうこと？笑 もう少し教えて〜",
    "follow",
  ));

  if (isSanaBranch(stage)) {
    const choice = minaSanaChoices.find((option) => option.id === stage)!;
    const choiceOffset = followOffset + followAttempts.length * 2;
    result.push(
      line(ping, "choice-" + stage, replyText.trim() || choice.text, choiceOffset, true),
    );
    choice.responses.forEach((reply, index) =>
      result.push(line(ping, "reply-" + stage + "-" + index, reply, choiceOffset + index + 1, false)),
    );
  }
  return result;
}
