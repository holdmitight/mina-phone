/** Offline, context-aware Jeongyeon chat for Mina's fictional lost-phone story.
 * Unlike a one-shot keyword trigger, subsequent messages remember the disclosure.
 * Never assumes who picked the phone up, or spoils the ring's eventual reveal.
 */
import { makeItem, type Item } from "../../schema";

export type JeongyeonTopic = "lost" | "found" | "return" | "identity" | "evasive" | "location" | "gift" | "hello" | "other" | "correction" | "not-yet";
export type JeongyeonTurn = { text: string; reply: string; zh: string; topic: JeongyeonTopic; afterGift?: boolean };
const device = /(?:手机|手機|スマホ|휴대폰|핸드폰|폰|phone|mobile)/iu;
const mina = /(?:米娜|mina|ミナ|みーたん|미나|她|her)/iu;
const lost = /(?:丢|丟|不见|不見|遗失|遺失|弄丢|弄丟|なくした|なくなった|失くした|lost|missing|잃어버|없어졌|분실)/iu;
const phoneFound = /(?:捡到|撿到|拾到|拾った|picked up|주웠|found (?:her |mina.?s |the )?phone|找到(?:了)?(?:米娜的|她的|这部|這部|这个|這個)?(?:手机|手機)|(?:手机|手機)找到了|폰을 찾았)/iu;
const returnIt = /(?:还给|還給|归还|歸還|交还|交還|物归原主|返す|返却|return|give.*back|돌려주|반납)/iu;
const notMina = /(?:我不是(?:米娜|mina|ミナ|南|她)|^我不是(?:呢|呀|啊|哦)?[。！!\s]*$|不是(?:米娜|mina|ミナ|南)本人|i.?m not mina|not mina|ミナじゃない|미나가 아니)/iu;
const evade = /(?:你猜|猜猜|猜我|不告诉|不告訴|秘密|保密|不重要|别问|別問|guess who|not telling|none of your business|비밀|教えない)/iu;
const where = /(?:怎么|怎麼|如何|怎样|怎樣|怎样才|怎样能|去哪里|去哪|哪里|哪裡|在哪|在哪里|在哪儿|在哪裡|何处|何處|where|how|どこ|どうすれば|어디|어떻게).{0,18}(?:找|联系|聯繫|见|見|找到|遇到|聯絡|contact|find|meet|reach|会える|見つけ|찾|만나).{0,12}(?:米娜|mina|ミナ|她|her|미나)?|(?:米娜|mina|ミナ|她|her|미나).{0,9}(?:在哪|哪里|哪裡|在哪里|where|어디)/iu;
const help = /(?:联系米娜|聯絡米娜|联系她|聯絡她|找她|找到她|怎么找她|怎麼找她|见她|見她|把手机交给|把手機交給|告诉她|告訴她|帮我|幫我|能帮忙|能幫忙|call (?:her|mina)|contact (?:her|mina)|reach (?:her|mina)|find (?:her|mina)|連絡して|연락해|찾아 줘)/iu;
const gift = /(?:戒指|礼物|禮物|乐高|樂高|指輪|プレゼント|レゴ|lego|ring|gift|반지|선물)/iu;
const hello = /^(?:喂|你好|嗨|哈喽|哈囉|hi|hello|hey|안녕|여보세요|こんにちは|もしもし)[!！。.\s~～]*$/iu;
const identity = /(?:我叫|我是|我是她|我认识|我認識|我跟她|我和她|my name is|i am |i'm |わたしは|私は|저는|제가)/iu;
const question = /(?:\?|？|什么|什麼|怎么|怎麼|为什么|為什麼|who|why|what|どこ|どう|뭐|왜)/iu;

const message = (reply: string, zh: string, topic: JeongyeonTopic, text: string): JeongyeonTurn =>
  ({ text, reply, zh, topic });

/** Context-sensitive without claiming the app has live AI.
 * A question about FINDING MINA must never be mistaken for FINDING THE PHONE.
 */
export function replyToJeongyeonText(text: string, earlier: readonly JeongyeonTurn[]): JeongyeonTurn {
  const value = text.normalize("NFKC").trim();
  const concerned = earlier.some((turn) => ["lost", "found", "return", "identity", "evasive", "location", "gift"].includes(turn.topic));
  const finderDisclosed = earlier.some((turn) => ["found", "return"].includes(turn.topic));
  const same = (topic: JeongyeonTopic) => earlier.filter((turn) => turn.topic === topic).length;

  if (/^(?:你?(?:是)?(?:怎么|怎麼|咋)知道(?:的)?|how (?:did|do) you know|어떻게 알았어|なんでわかったの)[啊呀呢?？!！。．.\s]*$/iu.test(value))
    return message("미나 계정으로 메시지가 왔거든요. 메모 앱 한번 열어 봐요. 미나가 맨 위에 고정해 둔 글이 있어요.",
      "因为消息是从米娜的账号发来的呀。去看看备忘录吧，米娜在最上面置顶了一条。", "other", text);
  if (/(?:说得?不对|說得?不對|理解错|理解錯|答非所问|答非所問|不是这个意思|不是這個意思|you misunderstood|that's wrong|そうじゃない|違うって)/iu.test(value))
    return message("아, 내가 잘못 이해했네. 어떤 부분이 달랐어? 폰 얘기인지, 아까 물어본 일인지 알려 줄래?", "啊，是我理解错了。是哪部分不对？你说的是手机，还是我刚才问的那件事？", "correction", text);
  if (/^(?:没有[，,\s]*)?(?:还没(?:有|呢|做好)?|還沒(?:有|呢)?|まだ(?:だよ|です|だ)?|not yet|아직)[。！!\s]*$/iu.test(value))
    return message(concerned ? "아직이군요. 폰은 안전하게 가지고 계신가요? 제가 미나에게 연락해 볼게요." : "아직이구나. 서두르지 않아도 돼. 뭔가 막히는 게 있어?", concerned ? "还没有啊。手机还妥善保管着吗？我会试着联系米娜。" : "还没有啊，不用着急。是遇到什么困难了吗？", "not-yet", text);

  if (notMina.test(value))
    return message("그럼 지금 누구랑 얘기하고 있는 거예요? 미나의 폰을 어디서 주웠어요?",
      "那现在跟我说话的人是谁？你在哪里捡到米娜的手机的？", "identity", text);
  if (evade.test(value))
    return message("장난칠 상황이 아니에요. 먼저 누구인지, 그리고 폰을 어디서 찾았는지 알려 주세요.",
      "现在不是开玩笑的时候。请先告诉我你是谁，以及在哪里发现手机的。", "evasive", text);
  if ((device.test(value) || concerned) && returnIt.test(value))
    return message("돌려주신다니 정말 고마워요. 카페 직원분께 맡기거나 안전한 곳에 보관해 주세요. 미나한테 확인해 볼게요.",
      "真的谢谢你愿意归还。可以先交给咖啡店工作人员，或妥善保管，我会联系米娜确认。", "return", text);
  // A search for Mina is a question, not a claim of having found her phone.
  if ((where.test(value) && (mina.test(value) || concerned)) ||
      /(?:怎么|怎麼|如何|哪里|哪裡|where|how).{0,15}(?:找到她|找她|find her|contact her)/iu.test(value))
    return message("미나를 찾으시는 거죠? 제가 연락해 볼게요. 다만 본인 동의 없이 위치나 번호를 알려 드릴 수는 없어요.",
      "你是想找到米娜对吧？我可以试着联系她，但不能未经她同意就告诉你地址或电话。", "location", text);
  if ((device.test(value) || concerned) && phoneFound.test(value))
    return message(same("found") ? "네, 주워 주신 건 알겠어요. 어느 카페에서 찾으셨는지 알려 주시겠어요?"
        : "미나 폰을 주우셨군요. 고마워요! 어디서 찾으셨는지 알려 주시겠어요?",
      same("found") ? "嗯，我知道你捡到了手机。能告诉我是在哪家咖啡店找到的吗？"
        : "原来是你捡到了米娜的手机，谢谢！能告诉我在哪里找到的吗？", "found", text);
  if (device.test(value) && lost.test(value))
    return message(same("lost") ? "네, 폰을 잃어버린 건 알겠어요. 그런데 지금 답장하는 분은 누구세요?"
        : "잠깐, 미나가 폰을 잃어버렸다고요? 그럼 지금 메시지를 보내는 분은 누구세요?",
      same("lost") ? "嗯，我知道手机丢了。但现在给我发消息的人到底是谁？"
        : "等等，你说米娜手机丢了？那现在给我发消息的是谁？", "lost", text);
  if (gift.test(value))
    return message(finderDisclosed ? "선물 얘기는 미나한테 직접 물어봐야 할 것 같아요. 폰은 제가 연락해서 돌려받을 수 있게 해 볼게요."
      : "무슨 선물인지 제가 마음대로 말할 수는 없어요. 그런데 지금 미나 폰으로 연락하시는 분은 누구세요?",
    finderDisclosed ? "礼物的事情最好直接问米娜。我会尝试联系她，安排取回手机。"
      : "礼物的事我不能擅自替她说。不过现在用米娜手机联系我的人是谁？", "gift", text);
  if (help.test(value))
    return message("미나한테 연락해 볼게요. 우선 본인이 누구인지, 폰을 어디서 찾았는지 알려 주세요.",
      "我会试着联系米娜。你先告诉我自己是谁，以及在哪里找到手机的，好吗？", "location", text);
  if (identity.test(value) && concerned)
    return message("알려 주셔서 고마워요. 아직 상황을 확인 중이니 폰은 안전하게 가지고 계셔 주세요.",
      "谢谢你告诉我。我还需要确认情况，请先妥善保管手机。", "identity", text);
  if (question.test(value) && concerned)
    return message("궁금한 건 알겠어요. 그렇지만 먼저 폰을 돌려줄 방법부터 같이 정해 볼까요?",
      "我明白你有疑问。不过我们能先商量一下怎么把手机还回去吗？", "other", text);
  if (concerned)
    return message(same("other") % 2 === 0
      ? "네, 듣고 있어요. 다만 미나의 폰이라서 조금 조심스러워요. 무슨 말씀인지 더 알려 주세요."
      : "그렇군요. 미나한테도 확인해 볼게요. 혹시 그 밖에 알려 주실 게 있나요?",
    same("other") % 2 === 0
      ? "嗯，我在听。毕竟这是米娜的手机，我有点谨慎。你能再说具体一点吗？"
      : "这样啊。我会向米娜确认。还有什么情况想告诉我吗？", "other", text);
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
          !["lost","found","return","identity","evasive","location","gift","hello","other","correction","not-yet"].includes(String(turn.topic))) continue;
      out.push({ text: turn.text, reply: turn.reply, zh: turn.zh, topic: turn.topic as JeongyeonTopic, ...(typeof turn.afterGift === "boolean" ? { afterGift: turn.afterGift } : {}) });
    } catch { /* Ignore old or corrupted local saves. */ }
  }
  return out.slice(-30);
}

export function minaJeongyeonInteractiveMessages(turns: readonly JeongyeonTurn[], ping?: Item): Item[] {
  // Persist which side of the later story arrival each turn belongs to.
  // Missing flags in old saves describe the pre-arrival conversation.
  const start = Date.parse((ping?.time || "2025-11-09 21:09").replace(" ", "T") + "Z");
  const before = turns.filter((turn) => !turn.afterGift).length;
  let pre = 0, post = 0;
  const time = (index: number) => new Date(start + index * 1000).toISOString().slice(0,19).replace("T"," ");
  return turns.flatMap((turn, index) => {
    const offset = ping ? turn.afterGift ? 1 + post++ * 2 : -before * 2 + pre++ * 2 : index * 2;
    return [
    makeItem({
      id: "mina-jeongyeon-interactive-" + index + "-input",
      title: "Jeongyeon", sender: "名井南", body: turn.text,
      outgoing: true, read: true, time: time(offset), folder: "聊天",
      meta: { local: "true", story: "jeongyeon-interactive" },
    }),
    makeItem({
      id: "mina-jeongyeon-interactive-" + index + "-reply",
      title: "Jeongyeon", sender: "Jeongyeon", body: turn.reply,
      outgoing: false, read: true, time: time(offset + 1), folder: "聊天",
      meta: { local: "true", story: "jeongyeon-interactive", zh: turn.zh },
    }),
    ];
  });
}
