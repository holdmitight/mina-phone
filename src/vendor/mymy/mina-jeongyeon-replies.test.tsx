import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem } from "../../schema";
import type { SkinProps } from "../../AppSkins";
import { MymyKakao } from "./Apps";
import { minaKakaoChineseSubtitle } from "./minaKakaoZh";
import {
  minaJeongyeonInteractiveMessages,
  parseJeongyeonTurns,
  replyToJeongyeonText,
} from "./mina-jeongyeon-replies";

describe("Jeongyeon responds to the phone's finder", () => {
  it("answers the player's message about Mina's missing phone", () => {
    const turn = replyToJeongyeonText("你知道米娜手机丢了吗？", []);
    expect(turn.topic).toBe("lost");
    expect(turn.reply).toContain("누구세요");
    expect(turn.zh).toContain("谁");
    const next = replyToJeongyeonText("我是捡到手机的人", [turn]);
    expect(next.topic).toBe("found");
    expect(next.reply).toContain("어디서");
    const evasive = replyToJeongyeonText("你猜我是谁", [turn, next]);
    expect(evasive.topic).toBe("evasive");
    expect(evasive.reply).toContain("누구");
    const gift = replyToJeongyeonText("戒指做好了吗？", [turn, next]);
    expect(gift.topic).toBe("gift");
    expect(gift.reply).not.toContain("레고");
  });

  it("does not misread a question about FINDING MINA as finding her PHONE", () => {
    const first = replyToJeongyeonText("你知道米娜手机丢了吗？", []);
    const pickedUp = replyToJeongyeonText("我是捡到手机的人", [first]);
    for (const question of [
      "怎么才可以找到她",
      "我要怎么找到米娜",
      "米娜在哪里？",
      "How do I find her?",
      "我想联系她",
    ]) {
      const answer = replyToJeongyeonText(question, [first, pickedUp]);
      expect(answer.topic, question).toBe("location");
      expect(answer.zh, question).not.toContain("你捡到了手机");
      expect(answer.zh, question).toMatch(/联系米娜|找到米娜/);
    }
  });

  it("answers the second and third turn based on the prior disclosure, not one fixed script", () => {
    const first = replyToJeongyeonText("米娜的手机丢了", []);
    const repeated = replyToJeongyeonText("米娜的手机丢了", [first]);
    expect(repeated.reply).not.toBe(first.reply);
    const finder = replyToJeongyeonText("我捡到手机了", [first]);
    const thanks = replyToJeongyeonText("我会还给她", [first, finder]);
    expect(finder.topic).toBe("found");
    expect(thanks.topic).toBe("return");
    const worry = replyToJeongyeonText("戒指的事情你知道吗", [first, finder]);
    expect(worry.topic).toBe("gift");
    expect(worry.zh).toContain("直接问米娜");
    const offTopic = replyToJeongyeonText("我觉得这件事好奇怪", [first, finder]);
    expect(offTopic.topic).toBe("other");
    expect(offTopic.zh).not.toContain("那件事应该");
  });

  it("persists the conversation and keeps a Chinese translation for each reply", () => {
    const first = replyToJeongyeonText("你知道米娜手机丢了吗？", []);
    const second = replyToJeongyeonText("我会把手机还给她", [first]);
    const turns = parseJeongyeonTurns([JSON.stringify(first), JSON.stringify(second)]);
    const messages = minaJeongyeonInteractiveMessages(turns);
    expect(messages).toHaveLength(4);
    expect(messages[0].body).toBe("你知道米娜手机丢了吗？");
    expect(messages[1].body).toBe(first.reply);
    expect(messages[2].body).toBe("我会把手机还给她");
    expect(messages[3].meta.zh).toBe(second.zh);
    expect(minaKakaoChineseSubtitle(messages[1])).toBe(first.zh);
    expect(messages.map((msg) => msg.time)).toEqual([...messages.map((msg) => msg.time)].sort());
    expect(new Set(messages.map((msg) => msg.id)).size).toBe(4);
  });

  it("renders restored replies in the real KakaoTalk thread", () => {
    const first = replyToJeongyeonText("你知道米娜手机丢了吗？", []);
    const items = [
      makeItem({ id: "kaka-sana-1", title: "Sana", sender: "Sana", body: "おやすみ。", time: "2025-11-09 21:09" }),
      makeItem({ id: "kaka-jeongyeon-1", title: "Jeongyeon", sender: "Jeongyeon", body: "잘 자.", time: "2025-11-09 21:08" }),
    ];
    const props: SkinProps = {
      appId: "kakao",
      name: "KakaoTalk",
      owner: "名井南",
      thread: "Jeongyeon",
      creator: false,
      items,
      ui: { minaJeongyeonChatTurns: [JSON.stringify(first)] },
      onUi: vi.fn(), onBack: vi.fn(), onThread: vi.fn(),
      onRead: vi.fn(), onItem: vi.fn(), onAdd: vi.fn(),
    };
    const html = renderToStaticMarkup(createElement(MymyKakao, props));
    expect(html).toContain("你知道米娜手机丢了吗？");
    expect(html).toContain(first.reply);
    expect(html).toContain(first.zh);
    expect(html).toContain("KakaoTalkメッセージを送信");
  });

  it("ignores corrupt saved chat entries", () => {
    expect(parseJeongyeonTurns(["invalid", JSON.stringify({text:"X",reply:"Y",zh:"中文",topic:"nonsense"})])).toEqual([]);
  });
});
