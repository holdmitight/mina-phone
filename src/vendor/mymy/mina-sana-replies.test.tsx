import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem, type Item } from "../../schema";
import type { SkinProps } from "../../AppSkins";
import { MymyKakao } from "./Apps";
import {
  hasSanaStoryPrompt,
  matchSanaFreeText,
  minaSanaChoices,
  minaSanaInteractiveMessages,
  parseSanaAttempts,
  recoverSanaAttemptHistory,
  type SanaStage,
} from "./mina-sana-replies";

const ping = makeItem({
  id: "mina-story-cafe-sana-ping",
  title: "Sana",
  body: "みーたん、まだ起きてる？",
  sender: "Sana",
  time: "2026-11-09 21:09",
});
const existing = [
  makeItem({ id: "kaka-sana-1", title: "Sana", body: "おやすみ。", sender: "Sana", time: "2026-11-09 20:57" }),
  makeItem({ id: "kaka-jeongyeon-1", title: "Jeongyeon", body: "잘 자.", sender: "Jeongyeon", time: "2026-11-09 20:53" }),
];

function props(stage = "", items: Item[] = [...existing, ping], owner = "名井南", awakeText = "", replyText = ""): SkinProps {
  return {
    appId: "kakao",
    owner,
    name: "KakaoTalk",
    thread: "Sana",
    items,
    creator: false,
    ui: {
      minaSanaReplyStage: stage,
      minaSanaAwakeText: awakeText,
      minaSanaReplyText: replyText,
      minaSanaAttempts: [],
    },
    onUi: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onBack: vi.fn(),
    onAdd: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("free-text Sana KakaoTalk replies", () => {
  it("retains three different Sana responses for the same three story branches", () => {
    expect(minaSanaChoices.map((option) => option.id)).toEqual(["deny", "why", "memory"]);
    expect(new Set(minaSanaChoices.map((option) => option.responses.join(" "))).size).toBe(3);
  });

  it.each([
    ["まだ寝てないよ。", "awake"],
    ["まだです", "awake"],
    ["まだです！", "awake"],
    ["まだ", "awake"],
    ["嗯", "awake"],
    ["嗯嗯", "awake"],
    ["うん、起きてるよ！", "awake"],
    ["没睡呢", "awake"],
    ["还没睡觉呀", "awake"],
    ["我还没有睡觉呢", "awake"],
    ["まだ寝ていないよ", "awake"],
    ["I'm still up!", "awake"],
    ["아직 안 자고 있어", "awake"],
    ["別に何もないよ。", "deny"],
    ["なんでもないってば", "deny"],
    ["没什么事情", "deny"],
    ["我什么都没有瞒着你", "deny"],
    ["I'm fine", "deny"],
    ["아무것도 아니야", "deny"],
    ["……なんでそう思うの？", "why"],
    ["?", "why"],
    ["？？", "why"],
    ["どうしてそう思った？", "why"],
    ["你怎么知道我心事的", "why"],
    ["为什么这么说呢", "why"],
    ["怎么了？", "why"],
    ["Why do you think so?", "why"],
    ["왜 그렇게 생각해?", "why"],
    ["ちょっと、昔のことを思い出してた。", "memory"],
    ["前のことを思い返してただけ。", "memory"],
    ["只是突然想起以前的事", "memory"],
    ["在回忆十年前", "memory"],
    ["I remembered the old days", "memory"],
    ["옛날 일이 생각났어", "memory"],
  ])("recognizes paraphrased typed reply %s", (typed, intent) => {
    expect(matchSanaFreeText(typed, intent === "awake" ? "" : "awake")).toBe(intent);
  });

  it.each([
    ["", ""],
    ["おやすみ", ""],
    ["我已经睡了", ""],
    ["What do you want to eat?", "awake"],
    ["明日は雨かな", "awake"],
    ["カフェの名前は？", "awake"],
    ["hi", "awake"],
  ])("does not invent an intent from unrelated input %s", (typed, stage) => {
    expect(matchSanaFreeText(typed, stage as SanaStage)).toBeNull();
  });

  it("keeps the story intro locked but allows early free-text conversation", () => {
    expect(hasSanaStoryPrompt(existing)).toBe(false);
    expect(minaSanaInteractiveMessages(undefined, "awake")).toEqual([]);
    const html = renderToStaticMarkup(createElement(MymyKakao, props("", existing)));
    expect(html).not.toContain("kz-story-reply-bar");
    expect(html).toContain("自由に返信を入力");
  });

  it("shows the enabled normal chat composer rather than quick reply buttons", () => {
    expect(hasSanaStoryPrompt([...existing, ping])).toBe(true);
    const html = renderToStaticMarkup(createElement(MymyKakao, props()));
    expect(html).toContain("みーたん、まだ起きてる？");
    expect(html).toContain("自由に返信を入力");
    expect(html).toContain('aria-label="KakaoTalkメッセージ"');
    expect(html).not.toContain("kz-story-reply-options");
    expect(html).not.toContain("上の返信から選択してください");
    expect(html).not.toContain('disabled="" value=""');
    expect(html).not.toContain("まだ寝てないよ。");
  });

  it("keeps the player's exact first message then shows Sana's intro", () => {
    const message = "我还没睡觉呢！";
    const html = renderToStaticMarkup(createElement(MymyKakao, props("awake", [...existing, ping], "名井南", message)));
    expect(html).toContain(message);
    expect(html).toContain("最近、みーたん一人で考え込んでること多くない？");
    expect(html).toContain("また何か隠してるでしょ？");
    expect(html).not.toContain("別に何もないよ。");
    expect(html).not.toContain("kz-story-reply-bar");
  });

  it.each([
    ["deny", "没什么啦，真的", "ほんとに〜？笑", "何か待ってるみたいだったから。"],
    ["why", "你怎么知道的？", "何か待ってるみたいだったから。", "その人のこと、まだ大事なんだね。"],
    ["memory", "刚想起了一些以前的事", "その人のこと、まだ大事なんだね。", "ほんとに〜？笑"],
  ])("records typed %s branch verbatim with only its unique Sana response", (branch, typed, expected, other) => {
    const story = minaSanaInteractiveMessages(ping, branch, "まだ起きてるよ", typed);
    expect(story).toHaveLength(8);
    expect(story.filter((line) => line.outgoing)).toHaveLength(2);
    expect(story.map((line) => line.time)).toEqual([...story.map((line) => line.time)].sort());
    expect(story.find((line) => line.id === "mina-sana-interactive-choice-" + branch)?.body).toBe(typed);

    const html = renderToStaticMarkup(createElement(MymyKakao, props(branch, [...existing, ping], "名井南", "まだ起きてるよ", typed)));
    expect(html).toContain(typed);
    expect(html).toContain(expected);
    expect(html).not.toContain(other);
    expect(html).not.toContain("kz-story-reply-bar");
    expect(html).toContain("自由に返信を入力");
  });

  it("saves unrecognized messages and displays Sana's clarification instead of guessing", () => {
    const attempts = parseSanaAttempts([
      JSON.stringify(["", "お茶でも飲もうか"]),
      JSON.stringify(["awake", "このゲーム面白い"]),
      JSON.stringify(["nope", "invalid phase"]),
      "not json",
    ]);
    expect(attempts).toEqual([
      { phase: "", text: "お茶でも飲もうか" },
      { phase: "awake", text: "このゲーム面白い" },
    ]);
    const story = minaSanaInteractiveMessages(ping, "awake", "まだ寝てない", "", attempts);
    expect(story.map((line) => line.body)).toContain("お茶でも飲もうか");
    expect(story.map((line) => line.body)).toContain("このゲーム面白い");
    expect(story.map((line) => line.body)).toContain("ん？まだ起きてる？笑");
    expect(story.map((line) => line.body)).toContain("うん、聞いてるよ。もう少し詳しく教えてくれる？");
    expect(story.map((line) => line.time)).toEqual([...story.map((line) => line.time)].sort());
  });

  it("recovers a stuck chat with the exact messages まだです / 嗯 / ?", () => {
    const attempts = parseSanaAttempts([
      JSON.stringify(["", "まだです"]),
      JSON.stringify(["", "嗯"]),
      JSON.stringify(["", "?"]),
    ]);
    const recovered = recoverSanaAttemptHistory("", "", "", attempts);
    expect(recovered).toMatchObject({
      recovered: true,
      stage: "why",
      awakeText: "まだです",
      replyText: "?",
      attempts: [{ phase: "awake", text: "嗯" }],
    });
    const story = minaSanaInteractiveMessages(
      ping, recovered.stage, recovered.awakeText,
      recovered.replyText, recovered.attempts,
    );
    expect(story.find((item) => item.id === "mina-sana-interactive-awake")?.body).toBe("まだです");
    expect(story.find((item) => item.id === "mina-sana-interactive-choice-why")?.body).toBe("?");
    expect(story.some((item) => item.body === "だって、最近ずっとスマホ見てるし。")).toBe(true);
    expect(story.some((item) => item.body === "ん？まだ起きてる？笑")).toBe(false);
    const olderSave = props();
    olderSave.ui = {
      ...olderSave.ui,
      minaSanaAttempts: attempts.map((attempt) => JSON.stringify([attempt.phase, attempt.text])),
    };
    const html = renderToStaticMarkup(createElement(MymyKakao, olderSave));
    expect(html).toContain("最近、みーたん一人で考え込んでること多くない？");
    expect(html).toContain("だって、最近ずっとスマホ見てるし。");
    expect(html).not.toContain("ん？まだ起きてる？笑");
  });

  it("varies replies instead of repeating the identical fallback", () => {
    const attempts = [
      { phase: "" as const, text: "お茶でも飲もうか" },
      { phase: "" as const, text: "..." },
      { phase: "" as const, text: "どうしよう" },
    ];
    const replies = minaSanaInteractiveMessages(ping, "", "", "", attempts)
      .filter((item) => !item.outgoing)
      .map((item) => item.body);
    expect(new Set(replies).size).toBe(3);
  });

  it("never adds free-text story prompts into other people's phones", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("awake", [...existing, ping], "Other")));
    expect(html).not.toContain("最近、みーたん一人で考え込んでること多くない？");
    expect(html).not.toContain("自由に返信を入力");
  });
});
