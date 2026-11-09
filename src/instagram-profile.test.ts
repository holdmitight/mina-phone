import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MymyInstagram } from "./vendor/mymy/Apps";
import type { SkinProps } from "./AppSkins";

import storySource from "../stories/template/story.json?raw";
const story = JSON.parse(storySource);

describe("requested empty Instagram account", () => {
  it("keeps the requested account configuration without authored posts, stories or messages", () => {
    expect(story.variables.instagramProfileName).toBe("im not sharon");
    expect(story.content.instagram).toEqual([]);
    expect(story.chats.filter((chat: { app: string }) => chat.app === "instagram")).toEqual([]);
  });

  it("shows the custom profile name, zero posts and a Japanese empty state", () => {
    const p: SkinProps = {
      appId: "instagram", name: "Instagram", owner: "名井南",
      profileName: "im not sharon", items: [], creator: false,
      ui: { mymyTab: "个人主页" }, thread: "", onRead: vi.fn(), onItem: vi.fn(),
      onAdd: vi.fn(), onBack: vi.fn(), onThread: vi.fn(), onUi: vi.fn(),
    };
    const html = renderToStaticMarkup(createElement(MymyInstagram, p));
    expect(html).toContain("im not sharon");
    expect(html).toContain("投稿はまだありません");
    expect(html).toContain("<b>0</b>");
    expect(html).not.toContain('class="igp"');
    expect(html).not.toContain('class="st"');
    expect(p.onUi).not.toHaveBeenCalled();
    expect(p.onAdd).not.toHaveBeenCalled();
  });
});
