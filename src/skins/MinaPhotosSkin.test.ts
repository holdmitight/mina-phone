import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { makeItem } from "../schema";
import { MinaPhotosSkin } from "./MinaPhotosSkin";

function props(unlocked = false, album = ""): Props {
  return {
    appId: "photos",
    name: "写真",
    owner: "名井南",
    items: unlocked ? [makeItem({ id: "mina-story-lego-photos-unlocked" })] : [],
    ui: album ? { "mina-photo-tab": album } : {},
    creator: false,
    thread: "",
    onBack: vi.fn(),
    onAdd: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("Mina's eight-photo album", () => {
  it("reveals a separate workbench album while preserving all eight originals", () => {
    const locked = renderToStaticMarkup(createElement(MinaPhotosSkin, props()));
    expect(locked).not.toContain("作業中");
    const recent = renderToStaticMarkup(createElement(MinaPhotosSkin, props(true)));
    expect(recent).toContain("作業中");
    expect(recent).toContain("8枚");
    const work = renderToStaticMarkup(createElement(MinaPhotosSkin, props(true, "作業中")));
    expect(work).toContain("1枚");
    expect(work).toContain("data:image/svg+xml");
    expect(work).toContain('alt="作業中"');
  });

  it("shows the six uploaded photos in the supplied sequence, then retains the original two", () => {
    const html = renderToStaticMarkup(createElement(MinaPhotosSkin, props()));
    const titles = Array.from(html.matchAll(/<img[^>]*alt="([^"]+)"/g), (match) => match[1]);
    expect(titles).toEqual([
      "古いセルフィー",
      "バレエの舞台",
      "窓辺",
      "白いドレス",
      "トウシューズ",
      "光と影",
      "ピンクの午後",
      "うさぎといっしょ",
    ]);
    expect(html).toContain("8枚");
    expect(titles).toHaveLength(8);
  });
});
