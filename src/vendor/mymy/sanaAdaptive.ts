/** Small, offline, context-aware reply engine for Mina's fictional Sana chat.
 * This is intentionally not a network AI service: private game text stays local.
 * Avoid guessing who holds the phone and never reveal the hidden ring or phone drop.
 */
export type SanaTopic =
  | "meet-tomorrow" | "meet" | "avoid" | "affection" | "fear" | "regret"
  | "memory" | "why" | "deny" | "decision" | "question" | "short"
  | "food" | "sleep" | "unknown";

export type SanaAdaptiveTurn = {
  text: string;
  replies: string[];
  topic: SanaTopic;
};

const tidy = (value: string) => value.normalize("NFKC").trim().toLowerCase();
const compact = (value: string) => tidy(value).replace(/[\s\p{P}\p{S}]/gu, "");
const has = (v: string, re: RegExp) => re.test(v);
const targets = /(?:あの子|あの人|彼女|彼|她|他|那个人|那個人|她的|her\b|him\b|that girl|그애|그 사람)/iu;
const tomorrow = /(?:明日|あした|明天|明兒|明儿|tomorrow|tmrw|내일)/iu;
const meeting = /(?:会いに|会える|会う|会って|会おう|会いたい|見に行|会いに行|会う予定|会わ|见面|見面|去见|见她|见他|会去见|找她|找他|約見|见到|見到|去見|見她|見他|meet|see her|see him|seeing her|seeing him|going to see|gonna see|만나|보러 가|볼 거)/iu;
const refusal = /(?:会いたくない|会わない|会えない|見たくない|会うのやめ|不想见|不想見|不会见|不去见|不去見|不想去找|不想见面|won't meet|will not meet|don't want to meet|don't want to see|not seeing her|안 만나|만나기 싫)/iu;
const affectionate = /(?:好き|大好き|愛して|恋し|会いたい|気になる|好きな人|想她|想他|喜欢她|喜歡她|喜欢他|愛她|爱她|我爱|我愛|舍不得|捨不得|miss her|miss him|i miss|love her|love him|still love|좋아해|보고 싶|사랑해)/iu;
const afraid = /(?:怖|こわ|恐|緊張|不安|心配|勇気が|自信ない|害怕|怕她|怕他|担心|擔心|紧张|緊張|不敢|没勇气|沒勇氣|scared|afraid|nervous|anxious|worried|두려|무서|겁나)/iu;
const regret = /(?:ごめん|申し訳|後悔|謝り|あやま|間違え|对不起|對不起|抱歉|后悔|後悔|当年是我|當年是我|我错了|我錯了|sorry|apolog|regret|my fault|미안|후회)/iu;
const memory = /(?:昔|思い出|思い返|過去|懐かし|あの頃|前のこと|覚えて|十年前|想起来|想起|想她以前|想到了|回忆|回憶|过去|過去|以前|从前|從前|当年|當年|十年|old times|old days|back then|remember|memories|nostalg|옛날|예전|추억|과거|생각났|생각나)/iu;
const why = /(?:なんで|どうして|なぜ|何で|どう思った|気づいたの|そう思う|为什么|為什麼|为啥|怎麼|怎么知道|怎么这么|为何|為何|why|how come|how did you know|what makes you|왜|어떻게 알)/iu;
const denial = /(?:別に|何もない|なんでもない|なんもない|隠してない|大丈夫|気のせい|気にしない|特にない|没什么|沒什麼|没事|沒事|没有啦|沒有啦|没瞒|別多想|别多想|我很好|nothing|not much|i'm fine|im fine|don't worry|nope|nah|아무것도|별일 없|괜찮아|아니야|숨기는 거 없)/iu;
const decision = /(?:決めた|決心|頑張る|やってみる|伝える|話してみる|会いに行こう|我决定|我決定|我会试|我會試|我会做|我會做|会努力|會努力|说出来|說出來|i decided|i will try|i'm going to tell|i'll tell|i'll try|i will tell|決定|해볼게|말할게)/iu;
const food = /(?:ラーメン|ご飯|ごはん|お腹|食べ|食べる|饭|吃饭|吃东西|餓了|饿了|吃|dinner|lunch|ramen|hungry|food|pizza|배고|먹을)/iu;
const sleeping = /(?:眠い|眠たい|もう寝|寝るね|おやすみ|要睡了|我困了|好困|想睡|睡觉了|睡覺了|go to bed|good night|goodnight|sleepy|going to sleep|잘 자|졸려|자러 갈)/iu;

export function classifySanaTopic(text: string): SanaTopic {
  const value = tidy(text);
  // A lone question mark or reaction emoji is still a meaningful chat reply.
  // Do this before stripping punctuation and symbols.
  if (/^[?？]+$/u.test(text.trim())) return "why";
  if (/^(?:🥺|😭|😢|😔|😅|🙂|😊|💗|❤️|!+|！+)$/u.test(text.trim())) return "short";
  const plain = compact(text);
  if (!plain) return "unknown";
  if (has(value, refusal)) return "avoid";
  if (has(value, meeting)) return has(value, tomorrow) ? "meet-tomorrow" : "meet";
  if (has(value, afraid)) return "fear";
  if (has(value, affectionate)) return "affection";
  if (has(value, regret)) return "regret";
  if (has(value, memory)) return "memory";
  if (has(value, why) || /^[?？]+$/u.test(text.trim())) return "why";
  if (has(value, denial)) return "deny";
  if (has(value, decision)) return "decision";
  if (has(value, sleeping)) return "sleep";
  if (has(value, food)) return "food";
  if (/^(?:うん+|うんうん|はい|えん|en+|yes+|yeah+|yep+|okay?|ok|sure|嗯+|嗯呢|好|好的|好吧|行|是|哦|噢|哎|啊|🥺|😭|😢|😔|😅|!+|\?+|\.\.\.+|응+|네|맞아|nono?|no)$/iu.test(value)) return "short";
  if (has(value, /(?:誰|だれ|どう|何|どこ|いつ|なに|什么|什麼|谁|誰|哪里|哪裡|what|who|where|when|how|어디|누구)/iu) || /[?？]$/u.test(text.trim())) return "question";
  return "unknown";
}

const isPersonal = (topic: SanaTopic) =>
  ["meet-tomorrow","meet","avoid","affection","fear","regret","memory","why","deny","decision"].includes(topic);

/** Progress comes from the actual conversation, not a required magic phrase. */
export function sanaConversationCanContinueStory(turns: readonly SanaAdaptiveTurn[]): boolean {
  // Even a player who only sends brief reactions must not get stuck:
  // after several exchanges, the next story beat can arrive naturally.
  return turns.some((turn) => isPersonal(turn.topic)) ||
    turns.filter((turn) => turn.topic !== "short").length >= 3 ||
    turns.length >= 4;
}

export function replyToSanaText(text: string, earlier: readonly SanaAdaptiveTurn[]): SanaAdaptiveTurn {
  const topic = classifySanaTopic(text);
  const priorSame = earlier.filter((turn) => turn.topic === topic).length;
  const priorMeeting = earlier.some((turn) => turn.topic === "meet" || turn.topic === "meet-tomorrow");
  const directed = has(tidy(text), targets);
  const choices: Record<SanaTopic, string[]> = {
    "meet-tomorrow": [
      directed
        ? "えっ、明日あの子に会うの？ それ、けっこう大きな一歩じゃない？"
        : "明日、誰かに会うんだね。何か大事な話があるの？",
      "明日なんだね。緊張しそうだけど、みーたんが決めたなら応援するよ。",
      "ちゃんと会って話そうって思えたんだね。無理に答えを急がなくていいからね。",
    ],
    meet: [
      directed ? "そっか、あの子に会いに行くんだね。会えたら、何から話したい？"
        : "会いに行こうと思ってるんだね。緊張してない？",
      priorMeeting ? "うん、会いに行くって決めたんだね。今度はちゃんと気持ちを伝えられるといいね。"
        : "会おうって決めたんだね。焦らず、自分の言葉で話してね。",
      "会えるかどうかより、まず会おうとしたことが大切だと思うよ。",
    ],
    avoid: [
      "会いたくないんだね。何かあった？ 無理しなくていいから。",
      "今は会わないって決めたんだね。みーたんの気持ちも大事だよ。",
      "会わない選択もあるよ。でも、一人で抱えなくていいからね。",
    ],
    affection: [
      "……そっか。やっぱり、その人のことが大切なんだね。",
      "好きって気持ち、簡単には消えないよね。ちゃんと伝えたい？",
      "みーたんがそこまで思ってるなら、きっと大切な人なんだろうな。",
    ],
    fear: [
      "怖いよね。大切なことほど、そうなると思う。",
      "緊張するよね。でも、みーたんは一人じゃないからね。",
      "無理に強がらなくてもいいよ。怖いままでも話せることってあると思う。",
    ],
    regret: [
      "謝りたいことがあるんだね。何があったか、話せそう？",
      "後悔してるんだね。でも、今から言える言葉もあると思うよ。",
      "過去は変えられないけど、これからどうするかは選べるから。",
    ],
    memory: [
      "そっか。……その人のこと、まだ大事なんだね。",
      "昔のことって、何でもない時にふと思い出すよね。",
      "みーたんにとって、ずっと残ってる思い出なんだね。",
    ],
    why: [
      "だって、最近ずっとスマホ見てるし。何か待ってるみたいだったから。",
      "なんとなく、いつものみーたんと違う気がしたから。気のせいかな？",
      "友達だからわかることもあるんだよ〜笑。話したくなったら聞くからね。",
    ],
    deny: [
      "ほんとに〜？笑 まあ、話したくなったら聞くからね。",
      "そっか。そうならいいんだけど、少し気になってたから。",
      "うん、わかった。無理に聞いたりしないよ。",
    ],
    decision: [
      "決めたんだね。みーたんらしいな。応援してるよ。",
      "そっか。自分で決めたなら、私は味方だよ。",
      "ちゃんと考えて決めたんだね。無理だけはしないでね。",
    ],
    question: [
      "うん？ どのことが気になった？ 私が答えられることなら聞いて〜",
      "もう少し詳しく言ってくれる？ ちゃんと聞きたい。",
      "うん、聞いてるよ。何について話そうか？",
    ],
    short: [
      "うんうん、聞いてるよ〜。",
      "みーたん、返事短いねㅋㅋ 眠い？",
      "うん。急がなくていいから、話せることだけでいいよ。",
      "へへ、ちゃんと聞いてるからね。",
    ],
    food: [
      "ごはんの話？笑 そういえば、ちゃんと食べた？",
      "お腹空いてるの？ こんな時間まで起きてたらそうなるよねㅋㅋ",
      "ふふ、食べ物の話になったね。何食べたい？",
    ],
    sleep: [
      "そっか、眠いならちゃんと休んでね。続きはまた今度でもいいよ。",
      "うん、おやすみ。明日も無理しすぎないでね。",
      "寝るなら返事しなくてもいいからね。おやすみ〜",
    ],
    unknown: [
      "うん、聞いてるよ。もう少し詳しく教えてくれる？",
      "そうなんだ。みーたんはそれ、どう思ってるの？",
      "へえ、そういうことか。もう少し聞かせて〜",
      "ちゃんと読んでるよ。続きがあったら聞きたいな。",
    ],
  };
  // Vary by message history, not by a fixed reply regardless of what was typed.
  const reply = topic === "meet" && priorMeeting
    ? "うん、会いに行くって決めたんだね。今度はちゃんと気持ちを伝えられるといいね。"
    : choices[topic][priorSame % choices[topic].length];
  return { text, replies: [reply], topic };
}

/** Defensive parsing of older and newer saved conversation turns. */
export function parseSanaAdaptiveTurns(raw: readonly string[]): SanaAdaptiveTurn[] {
  return raw.flatMap((value) => {
    try {
      const obj: unknown = JSON.parse(value);
      if (!obj || typeof obj !== "object") return [];
      const turn = obj as Record<string, unknown>;
      if (typeof turn.text !== "string" || !turn.text.trim() || turn.text.length > 2000) return [];
      if (!Array.isArray(turn.replies) || turn.replies.length < 1 || turn.replies.length > 3 ||
          !turn.replies.every((item) => typeof item === "string" && item.length > 0 && item.length <= 400)) return [];
      const topic = classifySanaTopic(turn.text);
      return [{ text: turn.text, replies: [...turn.replies] as string[], topic }];
    } catch { return []; }
  }).slice(-30);
}
