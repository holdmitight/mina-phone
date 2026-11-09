import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { MinaLineSkin } from "./MinaLineSkin";
import { minaLineMemories, minaLineLastMessage, minaLineThreadName } from "./minaLineMemories";

function props(thread = ""): Props {
  return {
    appId:"line",
    name:"LINE",
    owner:"名井南",
    profileName:"名井南",
    thread,
    items:[],
    creator:false,
    onBack:vi.fn(),
    onAdd:vi.fn(),
    onRead:vi.fn(),
    onItem:vi.fn(),
    onThread:vi.fn(),
  };
}

describe("Mina's ten-year-old LINE conversation", () => {
  it("shows A as a saved chat on the phone and previews the final unanswered line", () => {
    const html=renderToStaticMarkup(createElement(MinaLineSkin,props()));
    expect(html).toContain("A ♡");
    expect(html).toContain("你真的走了吗？");
    expect(html).toContain("2015/11/03");
  });

  it("has a chronological 2014–2015 conversation and finishes with A, without Mina replying", () => {
    expect(minaLineMemories.length).toBeGreaterThan(90);
    expect(minaLineMemories[0].day).toBe("2014-06-16");
    expect(minaLineThreadName).toBe("A ♡");
    expect(minaLineMemories[0].from).toBe("a");
    expect(minaLineLastMessage).toMatchObject({
      id:"2015-11-03-04",
      day:"2015-11-03",
      time:"00:17",
      from:"a",
      text:"你真的走了吗？",
    });
    expect(minaLineMemories.at(-1)?.id).toBe(minaLineLastMessage.id);
    const stamps=minaLineMemories.map((m)=>m.day+"T"+m.time);
    expect(stamps).toEqual([...stamps].sort());
  });

  it("includes A's rain vocabulary slip and Mina's gentle correction in July 2014", () => {
    const rainy = minaLineMemories.filter((item) => item.id.startsWith("2014-07-04-rain-"));
    expect(rainy).toHaveLength(6);
    expect(rainy[0]).toMatchObject({ from: "a", text: "雨が大きいね！☔️" });
    expect(rainy[1].text).toContain("雨が強い");
    expect(rainy[3].text).toContain("かわいい間違い");
    expect(minaLineLastMessage.text).toBe("你真的走了吗？");
  });

  it("places Mina's move in December 2014, keeping early affection unspoken", () => {
    const departure = minaLineMemories.find((msg) => msg.id === "2014-12-04-06");
    expect(departure?.from).toBe("mina");
    expect(departure?.text).toBe("着いたよ。");
    expect(minaLineMemories.find((msg) => msg.id === "2014-11-19-03")?.text).toContain("年末には韓国に戻る");
    expect(minaLineMemories.filter((msg) => msg.day.startsWith("2014")).some((msg) => /好きだよ|付き合おう|恋人/.test(msg.text))).toBe(false);
  });

  it("shows A reaching out many times during 2015 while Mina replies rarely", () => {
    const messages2015 = minaLineMemories.filter((msg) => msg.day.startsWith("2015"));
    const fromA = messages2015.filter((msg) => msg.from === "a");
    const fromMina = messages2015.filter((msg) => msg.from === "mina");
    expect(fromA.length).toBeGreaterThan(20);
    expect(fromMina.length).toBe(4);
    expect(messages2015.filter((msg) => msg.day >= "2015-10-20").every((msg) => msg.from === "a")).toBe(true);
    expect(minaLineLastMessage.text).toBe("你真的走了吗？");
  });

  it("renders Mina's LINE messages on her right and A's messages on her left", () => {
    const html=renderToStaticMarkup(createElement(MinaLineSkin,props(minaLineThreadName)));
    expect(html).toContain('data-view="memory"');
    expect(html).toContain("mina-line-message mine");
    expect(html).toContain("mina-line-message theirs");
    expect(html).toContain("いつか一緒にレゴ作ろう");
    expect(html).toContain("你真的走了吗？");
    expect(html).not.toContain("2014–2015年のトーク履歴</span><button aria-label=\"送信\"");
    const last=html.lastIndexOf("你真的走了吗？");
    expect(html.slice(last)).not.toContain("mina-line-message mine");
  });
});
