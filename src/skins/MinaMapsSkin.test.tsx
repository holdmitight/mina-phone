import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { makeItem } from "../schema";
import { MinaMapsSkin } from "./MinaMapsSkin";
import {
  minaCafeId,
  minaCafeVisitHistory,
  minaStoryMapCopy,
} from "./minaMapStory";

const locations = [
  makeItem({
    id: "maps-studio",
    title: "練習室",
    body: "An old authored location",
    meta: { x: "37", y: "42" },
  }),
  makeItem({
    id: "maps-cafe",
    title: "君を連れていきたいカフェ",
    body: "An overly direct existing narrative",
    meta: { x: "64", y: "31" },
  }),
  makeItem({
    id: "maps-home",
    title: "家に帰る方向",
    body: "An old authored location",
    meta: { x: "48", y: "67" },
  }),
];

function props(override: Partial<Props> = {}): Props {
  return {
    appId: "maps",
    name: "マップ",
    owner: "名井南",
    profileName: "名井南",
    creator: false,
    items: locations,
    thread: "",
    onRead: vi.fn(),
    onItem: vi.fn(),
    onAdd: vi.fn(),
    onBack: vi.fn(),
    onThread: vi.fn(),
    ...override,
  };
}

describe("Mina Phone interactive map clues", () => {
  it("keeps the exact three fictional visits consistent with Jeongyeon's chat", () => {
    expect(minaCafeId).toBe("maps-cafe");
    expect(minaCafeVisitHistory).toHaveLength(3);
    expect(minaCafeVisitHistory.map((v) => v.date)).toEqual([
      "2025.11.04",
      "2025.10.30",
      "2025.10.28",
    ]);
    const ordered = minaCafeVisitHistory.map((v) => v.time);
    expect(ordered).toEqual([...ordered].sort().reverse());
  });

  it("uses the same cafe name as Safari without disclosing A's identity", () => {
    expect(minaStoryMapCopy[minaCafeId].name).toBe("少し静かなカフェ");
    expect(minaStoryMapCopy[minaCafeId].snippet).toContain("窓際");
    expect(JSON.stringify(minaStoryMapCopy)).not.toContain("Aが働");
  });

  it("shows a tappable cafe pin and location row in the phone map", () => {
    const html = renderToStaticMarkup(createElement(MinaMapsSkin, props()));
    expect(html).toContain("mina-map-stage");
    expect(html).toContain("mina-map-sheet");
    expect(html).toContain("少し静かなカフェ");
    expect(html).toContain("地図から少し静かなカフェを開く");
    expect(html).toContain("保存済みの場所");
    expect(html).toContain("練習室");
    expect(html).toContain("自宅付近");
    expect(html).toContain("場所を検索");
    expect(html).not.toContain("君を連れていきたいカフェ");
    expect(html).not.toContain("An overly direct existing narrative");
  });

  it("does not expose the three dates until the visitor opens cafe history", () => {
    const html = renderToStaticMarkup(createElement(MinaMapsSkin, props()));
    expect(html).not.toContain("2025.11.04");
    expect(html).not.toContain("2025.10.30");
    expect(html).not.toContain("2025.10.28");
    expect(html).not.toContain("Aの働");
    expect(html).toContain("物語内の架空の地図");
  });

  it("does not replace the standard Maps app for another owner", () => {
    const html = renderToStaticMarkup(createElement(MinaMapsSkin, props({ owner: "Other phone" })));
    expect(html).toContain("native-maps");
    expect(html).not.toContain("mina-map-stage");
  });

  it("does not inject the cafe storyline in a different story without the cafe", () => {
    const html = renderToStaticMarkup(
      createElement(MinaMapsSkin, props({ items: locations.filter((p) => p.id !== minaCafeId) })),
    );
    expect(html).toContain("native-maps");
    expect(html).not.toContain("mina-map-stage");
  });
});
