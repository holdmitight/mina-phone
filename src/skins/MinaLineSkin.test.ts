import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import type { Item } from "../schema";
import { MinaLineSkin } from "./MinaLineSkin";
import { minaLineMemories, minaLineLastMessage, minaLineThreadName } from "./minaLineMemories";

function props(thread = "", items: Item[] = []): Props {
  return {
    appId: "line",
    name: "LINE",
    owner: "名井南",
    profileName: "名井南",
    thread,
    items,
    creator: false,
    onBack: vi.fn(),
    onAdd: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("Mina's summer-to-November 2015 LINE archive", () => {
  it("shows Mina's saved private nickname without an A avatar in the chat list", () => {
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props()));
    expect(minaLineThreadName).toBe("うさぎちゃん 🐰");
    expect(html).toContain("うさぎちゃん 🐰");
    expect(html).not.toContain("A ♡");
    expect(html).not.toContain('class="mina-line-avatar">A');
    expect(html).toContain('class="mina-line-avatar empty"');
    expect(html).toContain("2015/11/06");
    expect(html).toContain("来年、一緒にハワイに行こうね。");
  });

  it("exposes the two LINE clue actions even if scroll observers do not fire", () => {
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props(minaLineThreadName)));
    expect(html).toContain("继续寻找线索");
    expect(html).toContain("回看2014年的乐高戒指约定");
  });

  it("preserves A's 2015 ballet meeting, departure and the original message IDs", () => {
    expect(minaLineMemories.length).toBeGreaterThan(90);
    expect(minaLineMemories[0]).toMatchObject({ id: "2014-06-16-01", day: "2015-06-16", from: "a" });
    expect(minaLineMemories.find((m) => m.id === "2014-11-19-03")).toMatchObject({ day: "2015-09-14" });
    expect(minaLineMemories.find((m) => m.id === "2014-12-04-06")?.day).toBe("2015-09-20");
    expect(minaLineMemories.every((m) => m.day.startsWith("2015"))).toBe(true);
    const times = minaLineMemories.map((m) => m.day + "T" + m.time);
    expect(times).toEqual([...times].sort());
  });

  it("keeps the rainy Japanese correction, but removes its redundant explanation from 2015", () => {
    const rainy = minaLineMemories.filter((m) => m.id.startsWith("2014-07-04-rain-"));
    expect(rainy).toHaveLength(12);
    expect(rainy[0]).toMatchObject({ from: "a", text: "雨が大きいね！☔️" });
    expect(rainy[1].text).toContain("雨が強い");
    expect(minaLineMemories.find((m) => m.id === "2015-07-04-01")?.text).toContain("雨が強い");
    expect(minaLineMemories.some((m) => m.text.includes("あの時、南が「大きいじゃなくて強い」"))).toBe(false);
    expect(minaLineMemories.some((m) => m.id === "2015-07-04-03")).toBe(false);
  });

  it("preserves the toy-store LEGO promise and the later unanswered gift photos", () => {
    const toyStore = minaLineMemories.filter((m) => m.id.startsWith("2014-08-09"));
    expect(toyStore).toHaveLength(6);
    expect(toyStore.every((m) => m.day === "2015-08-09")).toBe(true);
    expect(toyStore.find((m) => m.id === "2014-08-09-03")?.text).toContain("レゴの指輪");
    const later = minaLineMemories.filter((m) => m.id.startsWith("2015-08-09"));
    expect(later).toHaveLength(4);
    expect(later.every((m) => m.day === "2015-10-14")).toBe(true);
    expect(later.every((m) => m.from === "a")).toBe(true);
    expect(later.at(-1)?.text).toContain("忙しいから");
  });

  it("shows distance growing after her September departure and no reply after debut", () => {
    const unanswered = minaLineMemories.filter((m) => m.day >= "2015-11-04");
    expect(unanswered.every((m) => m.from === "a")).toBe(true);
    expect(minaLineMemories.find((m) => m.id === "2015-11-03-breakup-a")?.text).toContain("別れたほう");
    expect(minaLineMemories.find((m) => m.id === "2015-11-03-breakup-mina")?.text).toBe("ごめんね。");
    const postDeparture = minaLineMemories.filter((m) => m.day >= "2015-09-20");
    expect(postDeparture.filter((m) => m.from === "a").length)
      .toBeGreaterThan(postDeparture.filter((m) => m.from === "mina").length);
  });

  it("ends in 'don't ignore me', 'okay', 'I hate you', then the unanswered Hawaii promise", () => {
    const lastFour = minaLineMemories.slice(-4);
    expect(lastFour.map((m) => m.text)).toEqual([
      "お願い、無視しないで。",
      "……わかった。",
      "南なんて嫌い。",
      "うそだよ。\n来年、一緒にハワイに行こうね。",
    ]);
    expect(lastFour.every((m) => m.from === "a")).toBe(true);
    expect(minaLineMemories.some((m) => m.text === "你真的走了吗？")).toBe(false);
    expect(minaLineLastMessage).toMatchObject({
      id: "2015-11-06-02",
      day: "2015-11-06",
      time: "22:17",
      from: "a",
      text: "うそだよ。\n来年、一緒にハワイに行こうね。",
    });
  });

  it("renders all LINE contacts with matching avatar frames and no letter-avatar for the archived contact", () => {
    const item = {
      id: "sana-1",
      title: "Sana",
      body: "おつかれ！",
      sender: "Sana",
      time: "2025-11-08T20:18",
      avatar: "",
      outgoing: false,
      kind: "text",
    } as Item;
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props("", [item])));
    expect(html).toContain('class="mina-line-avatar empty"');
    expect(html).toContain('class="mina-line-avatar"');
    expect(html).toContain("Sana");
    expect(html).not.toContain("A ♡");
  });

  it("uses the same message bubble, date, and time markup for other LINE threads", () => {
    const other = [
      {
        id: "sana-in",
        title: "Sana",
        body: "やっほー",
        sender: "Sana",
        time: "2025-11-08T20:18",
        outgoing: false,
        kind: "text",
      },
      {
        id: "sana-out",
        title: "Sana",
        body: "元気だよ！",
        sender: "名井南",
        time: "2025-11-08T20:20",
        outgoing: true,
        kind: "text",
      },
    ] as Item[];
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props("Sana", other)));
    expect(html).toContain('data-view="thread"');
    expect(html).toContain('data-archive="false"');
    expect(html).toContain("mina-line-message mine");
    expect(html).toContain("mina-line-message theirs");
    expect(html).toContain("mina-line-balloon");
    expect(html).toContain("2025年11月8日");
    expect(html).toContain("20:18");
    expect(html).toContain("20:20");
    expect(html).not.toContain("catalog-bubbles");
    expect(html).not.toContain("mina-line-small-avatar");
  });

  it("renders incoming messages on the left without avatars and Mina on the right", () => {
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props(minaLineThreadName)));
    expect(html).toContain('data-view="thread"');
    expect(html).toContain('data-archive="true"');
    expect(html).toContain("mina-line-message mine");
    expect(html).toContain("mina-line-message theirs");
    expect(html).not.toContain("mina-line-small-avatar");
    expect(html).toContain("いつか一緒にレゴ作ろう");
    expect(html).not.toContain("你真的走了吗？");
    expect(html).toContain("来年、一緒にハワイに行こうね。");
    const last = html.lastIndexOf("来年、一緒にハワイに行こうね。");
    expect(html.slice(last)).not.toContain("mina-line-message mine");
  });
});
