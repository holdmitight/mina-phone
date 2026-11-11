/** Offline, context-aware Jeongyeon chat for Mina's fictional lost-phone story.
 * Unlike a one-shot keyword trigger, subsequent messages remember the disclosure.
 * Never assumes who picked the phone up, or spoils the ring's eventual reveal.
 */
import { makeItem, type Item } from "../../schema";

export type JeongyeonTopic = "lost" | "found" | "return" | "identity" | "evasive" | "location" | "gift" | "hello" | "other";
export type JeongyeonTurn = { text: string; reply: string; zh: string; topic: JeongyeonTopic };
const phone = /(?:米娜|mina|ミナ|みーたん|명井|미나|她|her)?\s*(?:的|の|의)?\s*(?:手机|手機|スマホ|휴대폰|핸드폰|폰|phone|mobile)/iu;
const lost = /(?:丢|丟|不见|不見|遗失|遺失|弄丢|弄丟|找不到|なくした|なくなった|失くした|lost|missing|잃어버|없어졌|분실)/iu;
const found = /(?:捡|撿|拾|找到|找到了|发现|發現|found|picked up|주웠|찾았)/iu;
const returnIt = /(?:还给|還給|归还|歸還|交还|交還|返す|返却|return|give.*back|돌려주|반납)/iu;
const notMina = /(?:我不是(?:米娜|mina|ミナ|南)|不是(?:米娜|mina|ミナ|南)本人|i.?m not mina|not mina|ミナじゃない|미나가 아니)/iu;
const evade = /(?:你猜|猜猜|猜我|不告诉|不告訴|秘密|保密|不重要|别问|別問|guess who|not telling|none of your business|비밀|教えない)/iu;
const where = /(?:米娜在哪|米娜在哪里|她在哪|她在哪里|知道她在哪|where is mina|where is she|ミナはどこ|미나 어디|어디 있어|她人呢)/iu;
const gift = /(?:戒指|礼物|禮物|乐高|樂高|指輪|プレゼント|レゴ|lego|ring|gift|반지|선물)/iu;
const hello = /^(?:喂|你好|嗨|哈喽|哈囉|hi|hello|hey|안녕|여보세요|こんにちは|もしもし)[!！。.\s~～]*$/iu;

const message = (reply: string, zh: string, topic: JeongyeonTopic, text: string): JeongyeonTurn =>
  ({ text, reply, zh, topic });

/** Choose a grounded response based on both this message and earlier disclosures. */
export function replyToJeongyeonText(text: string, earlier: readonly JeongyeonTurn[]): JeongyeonTurn {
  const value = text.normalize("NFKC").trim();
  const hasPhone = phone.test(value) || /(?:这部手机|這部手機|这个手机|這個手機|这台|這台|그 폰|the phone)/iu.test(value);
  const concern = earlier.some((turn) => ["lost", "found", "return", "identity", "evasive"].includes(turn.topic));
  if (notMina.test(value))
    return message("그럼 누구세요? 미나 폰은 어떻게 가지고 계세요?", "那你是谁？米娜的手机怎么会在你手上？", "identity", text);
  if (evade.test(value))
    return message("이런 상황에 장난은 곤란해요. 누구인지 먼저 알려 주세요.", "这种时候就别开玩笑了。请先告诉我你是谁。", "evasive", text);
  if (hasPhone && returnIt.test(value) || (concern && returnIt.test(value)))
    return message("돌려주신다니 고마워요. 안전한 곳에 맡겨 주세요. 제가 미나한테 확인할게요.", "谢谢你愿意归还。请先放在安全的地方，我会向米娜确认。", "return", text);
  if (hasPhone && found.test(value) || (concern && found.test(value)))
    return message("주워 주신 거예요? 고마워요. 어디서 찾으셨는지 알려 주실래요?", "是你捡到的吗？谢谢。能告诉我在哪里找到的吗？", "found", text);
  if ((hasPhone && lost.test(value)) || /(?:米娜手机丢了|米娜的手机丢了|미나 폰 잃어)/iu.test(value))
    return message("잠깐, 미나가 폰을 잃어버렸다고요? 그럼 지금 메시지 보내는 분은 누구세요?", "等等，你说米娜手机丢了？那现在给我发消息的是谁？", "lost", text);
  if (where.test(value))
    return message("미나가 어디 있는지는 먼저 확인해 볼게요. 그런데 지금 누구랑 이야기하고 있는 거죠?", "我会先确认米娜在哪里。不过现在跟我聊天的是谁？", "location", text);
  if (gift.test(value))
    return message("그건 미나가 직접 이야기할 일이에요. 지금은 이 폰이 안전한지 먼저 확인하고 싶어요.", "那件事应该由米娜亲自告诉你。我现在更想先确认手机是否安全。", "gift", text);
  if (concern && /(?:我是谁|我是誰|who am i|누구|誰|だれ|为什么|為什麼|why|왜)/iu.test(value))
    return message("아직 누군지 모르겠어서 그래요. 미나 폰을 어디서 받았는지 말해 줄 수 있어요?", "因为我还不知道你是谁。可以告诉我你在哪里拿到米娜的手机吗？", "identity", text);
  if (concern)
    return message("알겠어요. 그런데 아직 미나 폰 상황을 확인 못 했어요. 어디서 발견했는지 알려 주실래요?", "我知道了。但还没确认米娜手机的情况。能先告诉我你在哪里发现的吗？", "other", text);
  if (hello.test(value))
    return message("어, 안녕. 미나야? 무슨 일이야?", "啊，你好。是米娜吗？怎么了？", "hello", text);
  return message("응? 무슨 일이야? 미나 폰으로 이야기하는 거 맞지?", "嗯？怎么了？你是在用米娜的手机发消息，对吧？", "other", text);
}

export function parseJeongyeonTurns(raw: readonly string[]): JeongyeonTurn[] {
  const out: JeongyeonTurn[] = [];
  for (const entry of raw) {
    try {
      const value: unknown = JSON.parse(entry);
      if (!value || typeof value !== "object") continue;
      const turn = value as Record<string, unknown>;
      if (typeof turn.text !== "string" || !turn.text.trim() || turn.text.length > 2000 ||
          typeof turn.reply !== "string" || turn.reply.length > 400 ||
          typeof turn.zh !== "string" || turn.zh.length > 400 ||
          !["lost","found","return","identity","evasive","location","gift","hello","other"].includes(String(turn.topic))) continue;
      out.push({ text: turn.text, reply: turn.reply, zh: turn.zh, topic: turn.topic as JeongyeonTopic });
    } catch { /* Ignore old or corrupted local saves. */ }
  }
  return out.slice(-30);
}

export function minaJeongyeonInteractiveMessages(turns: readonly JeongyeonTurn[]): Item[] {
  const start = Date.parse("2025-11-09T22:00:00Z");
  const time = (index: number) => new Date(start + index * 60_000).toISOString().slice(0,16).replace("T"," ");
  return turns.flatMap((turn, index) => [
    makeItem({
      id: "mina-jeongyeon-interactive-" + index + "-input",
      title: "Jeongyeon", sender: "名井南", body: turn.text,
      outgoing: true, read: true, time: time(index * 2), folder: "聊天",
      meta: { local: "true", story: "jeongyeon-interactive" },
    }),
    makeItem({
      id: "mina-jeongyeon-interactive-" + index + "-reply",
      title: "Jeongyeon", sender: "Jeongyeon", body: turn.reply,
      outgoing: false, read: true, time: time(index * 2 + 1), folder: "聊天",
      meta: { local: "true", story: "jeongyeon-interactive", zh: turn.zh },
    }),
  ]);
}
