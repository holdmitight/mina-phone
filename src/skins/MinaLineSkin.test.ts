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

  it("has a chronological 2015 conversation and finishes with A, without Mina replying", () => {
    expect(minaLineMemories.length).toBeGreaterThan(40);
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

  it("renders Mina's LINE messages on her right and A's messages on her left", () => {
    const html=renderToStaticMarkup(createElement(MinaLineSkin,props(minaLineThreadName)));
    expect(html).toContain('data-view="memory"');
    expect(html).toContain("mina-line-message mine");
    expect(html).toContain("mina-line-message theirs");
    expect(html).toContain("いつか一緒にレゴ作ろう");
    expect(html).toContain("你真的走了吗？");
    expect(html).not.toContain("2015年のトーク履歴</span><button aria-label=\"送信\"");
    const last=html.lastIndexOf("你真的走了吗？");
    expect(html.slice(last)).not.toContain("mina-line-message mine");
  });
});
