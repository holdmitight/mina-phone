import { describe, expect, it } from "vitest";
import { makeItem } from "../../schema";
import {
  classifySanaTopic,
  parseSanaAdaptiveTurns,
  replyToSanaText,
  sanaConversationCanContinueStory,
} from "./sanaAdaptive";
import { minaSanaInteractiveMessages, matchSanaFreeText } from "./mina-sana-replies";

const ping = makeItem({
  id: "mina-story-cafe-sana-ping",
  title: "Sana",
  sender: "Sana",
  body: "みーたん、まだ起きてる？",
  time: "2025-11-09 21:09",
});

describe("adaptive Sana replies", () => {
  it.each([
    ["I'll meet her tomorrow", "meet-tomorrow"],
    ["I’ll meet her tomorrow", "meet-tomorrow"],
    ["我明天去见她", "meet-tomorrow"],
    ["我会去见她的", "meet"],
    ["我會去見她", "meet"],
    ["明日あの子に会う", "meet-tomorrow"],
    ["내일 그녀를 만나", "meet-tomorrow"],
    ["我不想见她", "avoid"],
    ["I won't meet her", "avoid"],
    ["我有点害怕", "fear"],
    ["I still love her", "affection"],
    ["想起十年前的事情", "memory"],
    ["我什么都没瞒着你", "deny"],
    ["为什么这么说？", "why"],
    ["En", "short"],
    ["嗯", "short"],
    ["🥺", "short"],
    ["好吧", "short"],
    ["What about ramen?", "food"],
  ])("understands the player's words without a required script: %s", (text, topic) => {
    expect(classifySanaTopic(text)).toBe(topic);
  });

  it("responds specifically to meeting her tomorrow, not with a dismissal", () => {
    const first = replyToSanaText("I'll meet her tomorrow", []);
    expect(first.replies.join(" ")).toContain("明日");
    expect(first.replies.join(" ")).toContain("あの子");
    expect(first.replies.join(" ")).not.toContain("無理に話さなく");
    const next = replyToSanaText("我会去见她的", [first]);
    expect(next.replies.join(" ")).toContain("会いに行く");
    expect(next.replies.join(" ")).not.toBe(first.replies.join(" "));
    expect(next.replies.join(" ")).not.toContain("無理に話さなく");
  });

  it("does not mistake a refusal for agreeing to meet", () => {
    const turn = replyToSanaText("我不想见她", []);
    expect(turn.topic).toBe("avoid");
    expect(turn.replies[0]).toContain("会いたくない");
    expect(turn.replies[0]).not.toContain("会いに行く");
  });

  it("adapts short answers and unknown topics without repeating the same fallback", () => {
    const turns = ["En", "🥺", "好吧", "hmmmm", "random unrelated message"].reduce(
      (previous, text) => [...previous, replyToSanaText(text, previous)],
      [] as ReturnType<typeof replyToSanaText>[],
    );
    expect(turns[0].replies[0]).not.toBe(turns[1].replies[0]);
    expect(turns[3].replies[0]).not.toBe(turns[4].replies[0]);
    expect(turns.every((turn) => !turn.replies[0].includes("ん？まだ起きてる？"))).toBe(true);
  });

  it("advances on a meaningful line, but not merely a string of emoji", () => {
    const filler = [replyToSanaText("En", []), replyToSanaText("🥺", [])];
    expect(sanaConversationCanContinueStory(filler)).toBe(false);
    const meeting = replyToSanaText("我会去见她的", filler);
    expect(sanaConversationCanContinueStory([...filler, meeting])).toBe(true);
    expect(sanaConversationCanContinueStory([
      replyToSanaText("random text 1", []),
      replyToSanaText("random text 2", []),
      replyToSanaText("random text 3", []),
    ])).toBe(true);
  });

  it("saves exactly what the player typed and reconstructs contextual replies", () => {
    const first = replyToSanaText("I'll meet her tomorrow", []);
    const second = replyToSanaText("我会去见她的", [first]);
    const stored = parseSanaAdaptiveTurns([JSON.stringify(first), JSON.stringify(second)]);
    const messages = minaSanaInteractiveMessages(ping, "awake", "Nono", "", [], stored);
    expect(messages.map((message) => message.body)).toContain("Nono");
    expect(messages.map((message) => message.body)).toContain("I'll meet her tomorrow");
    expect(messages.map((message) => message.body)).toContain("我会去见她的");
    expect(messages.map((message) => message.body)).toContain(first.replies[0]);
    expect(messages.map((message) => message.body)).toContain(second.replies[0]);
    expect(messages.map((message) => message.time)).toEqual(
      [...messages.map((message) => message.time)].sort(),
    );
    const ids = messages.map((message) => message.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("continues after any legacy completed branch without removing that branch", () => {
    const extra = replyToSanaText("I'll meet her tomorrow", []);
    const messages = minaSanaInteractiveMessages(
      ping, "deny", "まだ起きてるよ", "別に何もないよ", [], [extra],
    );
    expect(messages.map((m) => m.body)).toContain("ほんとに〜？笑");
    expect(messages.map((m) => m.body)).toContain("I'll meet her tomorrow");
    expect(messages.map((m) => m.body)).toContain(extra.replies[0]);
  });

  it("understands Nono and En as initial acknowledgments instead of entering a loop", () => {
    expect(matchSanaFreeText("Nono", "")).toBe("awake");
    expect(matchSanaFreeText("En", "")).toBe("awake");
  });

  it("ignores malformed stored turns", () => {
    const stored = parseSanaAdaptiveTurns([
      "{oops",
      JSON.stringify({ text: "?", replies: ["okay"], topic: "wrong" }),
      JSON.stringify({ text: "", replies: ["oops"] }),
      JSON.stringify({ text: "ok", replies: [] }),
    ]);
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("?");
    expect(stored[0].topic).toBe("why");
  });
});
