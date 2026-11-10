import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem } from "../schema";
import type { Props } from "./shared";
import { SafariSkin } from "./SystemSkins";
import {
  minaSafariRingSearches,
  minaSafariPartsSearches,
  minaSafariSearchHistory,
  minaSafariResearchResults,
  isMinaSafariResearchTerm,
} from "./minaSafariResearch";

function props(unlocked = false, tab = "历史记录"): Props {
  return {
    appId: "safari",
    owner: "名井南",
    name: "Safari",
    items: unlocked
      ? [makeItem({ id: "mina-story-lego-safari-unlocked", title: "作業中" })]
      : [],
    creator: false,
    thread: "",
    ui: { "mina-safari-tab": tab },
    onUi: vi.fn(),
    onRead: vi.fn(),
    onClue: vi.fn(),
    onItem: vi.fn(),
    onAdd: vi.fn(),
    onBack: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("Mina Safari research and history", () => {
  it("preserves all three existing ring-search entries verbatim", () => {
    expect(minaSafariRingSearches).toEqual(["指輪の図面", "指輪の作り方", "かわいい指輪"]);
    expect(minaSafariSearchHistory(false)).toEqual(minaSafariRingSearches);
    const html = renderToStaticMarkup(createElement(SafariSkin, props()));
    for (const term of minaSafariRingSearches) {
      expect(html).toContain(term);
      expect(html).toContain("検索履歴: " + term);
    }
    for (const term of minaSafariPartsSearches) expect(html).not.toContain(term);
  });

  it("adds practical LEGO searches only after Jeongyeon's gift chat is read", () => {
    const html = renderToStaticMarkup(createElement(SafariSkin, props(true)));
    for (const term of [...minaSafariRingSearches, ...minaSafariPartsSearches]) {
      expect(html).toContain(term);
      expect(isMinaSafariResearchTerm(term)).toBe(true);
    }
    expect(html).not.toContain("mina-story-lego-safari-unlocked");
    expect(html).not.toContain("作業中");
  });

  it("keeps existing authored Safari bookmarks separate from story history", () => {
    const html = renderToStaticMarkup(createElement(SafariSkin, {
      ...props(true, "书签"),
      items: [
        makeItem({ id: "mina-story-lego-safari-unlocked", title: "作業中" }),
        makeItem({ id: "safari-bookmark", title: "いつものサイト", favorite: true, meta: { url: "https://site.example" } }),
      ],
    }));
    expect(html).toContain("いつものサイト");
    expect(html).toContain("site.example");
    expect(html).not.toContain("作業中");
    expect(html).not.toContain("指輪の図面");
  });

  it("uses fictional practical pages instead of revealing A or the deliberate phone drop", () => {
    const practical = minaSafariResearchResults(minaSafariPartsSearches[0]);
    const ring = minaSafariResearchResults(minaSafariRingSearches[1]);
    expect(practical.length).toBeGreaterThanOrEqual(2);
    expect(ring.length).toBeGreaterThanOrEqual(2);
    for (const article of [...practical, ...ring]) {
      expect(article.paragraphs.length).toBeGreaterThan(0);
      expect(article.url).toContain(".example");
      const copy = [article.title, article.excerpt, ...article.paragraphs].join(" ");
      expect(copy).not.toContain("十年前");
      expect(copy).not.toContain("スマホをわざと");
      expect(copy).not.toContain("名井南");
    }
    expect(minaSafariResearchResults("天気")).toEqual([]);
    expect(isMinaSafariResearchTerm("レゴ パーツ 外れない")).toBe(true);
    expect(isMinaSafariResearchTerm("ミニブロック 固定")).toBe(true);
    expect(isMinaSafariResearchTerm("指輪 サイズ")).toBe(true);
    expect(isMinaSafariResearchTerm("天気")).toBe(false);
  });
});
