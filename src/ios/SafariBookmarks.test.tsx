import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem } from "../schema";
import { NativeDetail } from "./Details";
import { curatedSafariTitles, isCuratedSafariBookmark } from "./SafariBookmarks";

describe("Mina Phone's saved Safari webpages", () => {
  const forbiddenSource = "名井南はAに会いたい。十年前の約束と指輪を覚えている。";

  it("keeps the existing three bookmarked page titles", () => {
    expect(curatedSafariTitles).toEqual([
      "少し静かなカフェ",
      "今夜の映画リスト",
      "スープの温め直し方",
    ]);
    expect(curatedSafariTitles.every(isCuratedSafariBookmark)).toBe(true);
  });

  it.each(curatedSafariTitles)(
    "shows %s as a natural website without the explanatory story text",
    (title) => {
      const item = makeItem({
        id: "safari-demo",
        title,
        body: forbiddenSource,
        richText: forbiddenSource,
        folder: "书签",
        meta: { url: "example.com" },
      });
      const html = renderToStaticMarkup(
        createElement(NativeDetail, {
          app: "safari",
          item,
          back: vi.fn(),
        }),
      );
      expect(html).toContain("safari-bookmark-site");
      expect(html).toContain("safari-curated-reader");
      expect(html).not.toContain(forbiddenSource);
      expect(html).not.toContain("十年前の約束");
      expect(html).toContain("example.com");
    },
  );

  it("keeps the normal Safari reader for unrelated bookmarks", () => {
    const item = makeItem({
      id: "another",
      title: "今日の天気",
      body: "普通の天気情報です。",
    });
    const html = renderToStaticMarkup(
      createElement(NativeDetail, { app: "safari", item, back: vi.fn() }),
    );
    expect(isCuratedSafariBookmark(item.title)).toBe(false);
    expect(html).toContain("普通の天気情報です。");
    expect(html).not.toContain("safari-curated-reader");
  });
});
