import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem, type Item } from "../../schema";
import type { SkinProps } from "../../AppSkins";
import { MymyKakao } from "./Apps";
import {
  hasSanaStoryPrompt,
  minaSanaChoices,
  minaSanaInteractiveMessages,
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

function props(stage = "", items: Item[] = [...existing, ping], owner = "名井南"): SkinProps {
  return {
    appId: "kakao",
    owner,
    name: "KakaoTalk",
    thread: "Sana",
    items,
    creator: false,
    ui: { minaSanaReplyStage: stage },
    onUi: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onBack: vi.fn(),
    onAdd: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("interactive Sana KakaoTalk replies", () => {
  it("has exactly three meanings and different Sana replies for each", () => {
    expect(minaSanaChoices.map((option) => option.id)).toEqual(["deny", "why", "memory"]);
    expect(new Set(minaSanaChoices.map((option) => option.text)).size).toBe(3);
    expect(new Set(minaSanaChoices.map((option) => option.responses.join(" "))).size).toBe(3);
  });

  it("does not offer replies before the cross-app cafe clue unlocks Sana's ping", () => {
    expect(hasSanaStoryPrompt(existing)).toBe(false);
    expect(minaSanaInteractiveMessages(undefined, "awake")).toEqual([]);
    const html = renderToStaticMarkup(createElement(MymyKakao, props("", existing)));
    expect(html).not.toContain("kz-story-reply-bar");
    expect(html).not.toContain("上の返信から選択してください");
  });

  it("first shows 'I'm awake' as a tappable quick reply", () => {
    expect(hasSanaStoryPrompt([...existing, ping])).toBe(true);
    const html = renderToStaticMarkup(createElement(MymyKakao, props()));
    expect(html).toContain("みーたん、まだ起きてる？");
    expect(html).toContain("kz-story-reply-bar");
    expect(html).toContain("まだ寝てないよ。");
    expect(html).not.toContain("ちょっと、昔のことを思い出してた。");
    expect(html).toContain("上の返信から選択してください");
  });

  it("after the awake response shows Sana's intro and all three options", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("awake")));
    expect(html).toContain("最近、みーたん一人で考え込んでること多くない？");
    expect(html).toContain("また何か隠してるでしょ？");
    expect(html).toContain("別に何もないよ。");
    expect(html).toContain("……なんでそう思うの？");
    expect(html).toContain("ちょっと、昔のことを思い出してた。");
    expect(html).not.toContain("何か待ってるみたいだったから。");
  });

  it.each([
    ["deny", "ほんとに〜？笑", "何か待ってるみたいだったから。"],
    ["why", "何か待ってるみたいだったから。", "その人のこと、まだ大事なんだね。"],
    ["memory", "その人のこと、まだ大事なんだね。", "ほんとに〜？笑"],
  ])("persists only the %s branch and its distinct Sana replies", (branch, expected, other) => {
    const story = minaSanaInteractiveMessages(ping, branch);
    expect(story).toHaveLength(8);
    expect(story.filter((line) => line.outgoing)).toHaveLength(2);
    expect(story.at(-1)?.outgoing).toBe(false);
    expect(story.at(-1)?.sender).toBe("Sana");
    expect(story.map((line) => line.time)).toEqual([...story.map((line) => line.time)].sort());
    expect(new Set(story.map((line) => line.id)).size).toBe(story.length);

    const html = renderToStaticMarkup(createElement(MymyKakao, props(branch)));
    expect(html).toContain(expected);
    expect(html).not.toContain(other);
    expect(html).not.toContain("kz-story-reply-bar");
    expect(html).not.toContain("上の返信から選択してください");
  });

  it("never injects the replies into unrelated phones or threads", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("awake", [...existing, ping], "Other")));
    expect(html).not.toContain("最近、みーたん一人で考え込んでること多くない？");
    expect(html).not.toContain("kz-story-reply-bar");
  });
});
