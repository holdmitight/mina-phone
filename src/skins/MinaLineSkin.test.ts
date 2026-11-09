import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { MinaLineSkin } from "./MinaLineSkin";
import { minaLineMemories, minaLineLastMessage, minaLineThreadName } from "./minaLineMemories";

function props(thread = ""): Props {
  return {
    appId: "line",
    name: "LINE",
    owner: "名井南",
    profileName: "名井南",
    thread,
    items: [],
    creator: false,
    onBack: vi.fn(),
    onAdd: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("Mina's 2014–2015 LINE archive", () => {
  it("shows Mina's saved private nickname without an A avatar in the chat list", () => {
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props()));
    expect(minaLineThreadName).toBe("うさぎちゃん 🐰");
    expect(html).toContain("うさぎちゃん 🐰");
    expect(html).not.toContain("A ♡");
    expect(html).not.toContain('class="mina-line-avatar">A');
    expect(html).toContain("2015/11/06");
    expect(html).toContain("来年、一緒にハワイに行こうね。");
  });

  it("preserves the 2014 first meeting and Mina's December departure", () => {
    expect(minaLineMemories.length).toBeGreaterThan(90);
    expect(minaLineMemories[0]).toMatchObject({ day: "2014-06-16", from: "a" });
    expect(minaLineMemories.find((m) => m.id === "2014-11-19-03")?.text).toContain("年末には韓国に戻る");
    expect(minaLineMemories.find((m) => m.id === "2014-12-04-06")?.text).toBe("着いたよ。");
    expect(minaLineMemories.filter((m) => m.day.startsWith("2014")).some((m) => /好きだよ|付き合おう|恋人/.test(m.text))).toBe(false);
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

  it("changes the August 2015 scene to A buying a large pretty LEGO and asking Mina to guess", () => {
    const august = minaLineMemories.filter((m) => m.day === "2015-08-09");
    expect(august).toHaveLength(4);
    expect(august.every((m) => m.from === "a")).toBe(true);
    expect(august.map((m) => m.text).join(" ")).toContain("大きくて、きれいなレゴ");
    expect(august.map((m) => m.text).join(" ")).toContain("買っちゃった");
    expect(august.map((m) => m.text).join(" ")).toContain("当ててみて");
    expect(august.at(-1)?.text).toContain("忙しいから");
    expect(august.map((m) => m.text).join(" ")).not.toContain("レゴの指輪、まだ覚えてる");
  });

  it("shows 2015 as increasingly one-sided messages, with only four Mina replies", () => {
    const messages = minaLineMemories.filter((m) => m.day.startsWith("2015"));
    expect(messages.filter((m) => m.from === "a").length).toBeGreaterThan(20);
    expect(messages.filter((m) => m.from === "mina")).toHaveLength(4);
    expect(messages.filter((m) => m.day >= "2015-10-20").every((m) => m.from === "a")).toBe(true);
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

  it("renders incoming messages on the left without avatars and Mina on the right", () => {
    const html = renderToStaticMarkup(createElement(MinaLineSkin, props(minaLineThreadName)));
    expect(html).toContain('data-view="memory"');
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
