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
