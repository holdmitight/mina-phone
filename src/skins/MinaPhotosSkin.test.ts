import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { MinaPhotosSkin } from "./MinaPhotosSkin";

function props(): Props {
  return {
    appId: "photos",
    name: "写真",
    owner: "名井南",
    items: [],
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
