import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem } from "../../schema";
import type { SkinProps } from "../../AppSkins";
import { MymyKakao } from "./Apps";
import { minaKakao2025Items, minaKakao2025Lines } from "./mina-kakao-2025";

const baseItems = [
  makeItem({
    id: "kaka-you-last",
    title: "君 ♡",
    sender: "君 ♡",
    body: "おやすみ。",
    time: "2026-11-09 21:09",
    outgoing: false,
  }),
  makeItem({
    id: "kaka-sana-1",
    title: "Sana",
    sender: "Sana",
    body: "おやすみ。",
    time: "2026-11-09 20:57",
    outgoing: false,
  }),
  makeItem({
    id: "kaka-jeongyeon-1",
    title: "Jeongyeon",
    sender: "Jeongyeon",
    body: "잘 자.",
    time: "2026-11-09 20:53",
    outgoing: false,
  }),
];

function props(thread = "", override: Partial<SkinProps> = {}): SkinProps {
  return {
    appId: "kakao",
    name: "KakaoTalk",
    owner: "名井南",
    thread,
    items: baseItems,
    creator: false,
    onBack: vi.fn(),
    onThread: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onAdd: vi.fn(),
    ...override,
  };
}

describe("2025 KakaoTalk concert-and-cafe flashback", () => {
  it("has complete, dated exchanges from both members' points of view", () => {
    expect(minaKakao2025Lines).toHaveLength(43);
    expect(minaKakao2025Lines.filter((m) => m.title === "Sana")).toHaveLength(23);
    expect(minaKakao2025Lines.filter((m) => m.title === "Jeongyeon")).toHaveLength(20);
    expect(minaKakao2025Items.every((m) => m.time.startsWith("2025-"))).toBe(true);
    expect(minaKakao2025Items.some((m) => m.outgoing)).toBe(true);
    expect(minaKakao2025Items.some((m) => !m.outgoing)).toBe(true);
    const ids = minaKakao2025Items.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const title of ["Sana", "Jeongyeon"]) {
      const items = minaKakao2025Items.filter((m) => m.title === title);
      expect(items.map((m) => m.time)).toEqual([...items.map((m) => m.time)].sort());
    }
  });

  it("shows concert clues in Sana's chat before the existing 2026 conversation", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("Sana")));
    expect(html).toContain("今日のアンコール");
    expect(html).toContain("見間違いかもしれない。");
    expect(html).toContain("昔、よく知ってた人に。");
    expect(html).toContain("2025.10.25");
    expect(html).toContain("2026.11.09");
    expect(html.indexOf("今日のアンコール")).toBeLessThan(html.indexOf("おやすみ。"));
  });

  it("shows the cafe conversation and quiet aftermath in Jeongyeon's chat", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("Jeongyeon")));
    expect(html).toContain("너 또 그 카페 갔어?");
    expect(html).toContain("그냥 평범해.");
    expect(html).toContain("내가 너무 늦었나 봐.");
    expect(html).toContain("2025.10.30");
    expect(html).toContain("2025.11.04");
  });

  it("preserves the contact ordering and latest 2026 previews on the list", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props()));
    expect(html.indexOf("<b>💗</b>")).toBeLessThan(html.indexOf("<b>Sana</b>"));
    expect(html.indexOf("<b>Sana</b>")).toBeLessThan(html.indexOf("<b>Jeongyeon</b>"));
    expect(html).toContain("<b>Sana</b><small>おやすみ。</small>");
    expect(html).toContain("<b>Jeongyeon</b><small>잘 자.</small>");
  });

  it("does not inject Mina's personal story into unrelated KakaoTalk projects", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("Sana", {
      owner: "Someone Else",
    })));
    expect(html).not.toContain("今日のアンコール");
    expect(html).toContain("おやすみ。");
  });
});
