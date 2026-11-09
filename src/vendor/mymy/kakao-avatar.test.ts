import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SkinProps } from "../../AppSkins";
import { makeItem } from "../../schema";
import { MymyKakao } from "./Apps";
import { kakaoDefaultAvatar } from "./kakao-default-avatar";

function props(thread = ""): SkinProps {
  return {
    appId: "kakao",
    name: "KakaoTalk",
    owner: "名井南",
    thread,
    items: [
      makeItem({ id: "kaka-1", title: "Sana", sender: "Sana", body: "おはよう", time: "2025-11-08 09:00" }),
      makeItem({ id: "kaka-2", title: "定延", sender: "定延", body: "了解！", time: "2025-11-08 09:15" }),
    ],
    creator: false,
    onBack: vi.fn(),
    onThread: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onAdd: vi.fn(),
  };
}

describe("KakaoTalk default contact portraits", () => {
  it("uses the uploaded silhouette in the contacts list", () => {
    expect(kakaoDefaultAvatar).toMatch(/^data:image\/webp;base64,/);
    const html = renderToStaticMarkup(createElement(MymyKakao, props()));
    expect(html).toContain(kakaoDefaultAvatar);
    expect(html.split(kakaoDefaultAvatar).length - 1).toBeGreaterThanOrEqual(2);
    expect(html).toContain("Sana");
    expect(html).toContain("定延");
  });
  it("uses the same uploaded portrait inside incoming chat bubbles", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, props("Sana")));
    expect(html).toContain(kakaoDefaultAvatar);
    expect(html).toContain("おはよう");
  });
  it("previews each chat's latest message even on the Friends tab, not its sender", () => {
    const p = props();
    p.ui = { mymyTab: "好友" };
    p.items.push(
      makeItem({
        id: "kaka-3",
        title: "Sana",
        sender: "名井南",
        body: "また後でね！",
        time: "2025-11-08 09:30",
        outgoing: true,
      }),
    );
    const html = renderToStaticMarkup(createElement(MymyKakao, p));
    expect(html).toContain("<b>Sana</b><small>また後でね！</small>");
    expect(html).toContain("<b>定延</b><small>了解！</small>");
    expect(html).not.toContain("<b>Sana</b><small>名井南</small>");
  });

  it("shows only the pink heart in both the private-chat title and incoming sender label", () => {
    const p = props("君 ♡");
    p.items.push(
      makeItem({
        id: "kaka-you-last",
        title: "君 ♡",
        sender: "君 ♡",
        body: "うん、一緒に見ようね。",
        time: "2025-11-08 21:09",
        outgoing: false,
      }),
    );
    const chat = renderToStaticMarkup(createElement(MymyKakao, p));
    expect(chat).toContain('<span class="kzname">💗</span>');
    expect(chat).toContain('<div class="kzmn">💗</div>');
    expect(chat).not.toContain('<div class="kzmn">君 ♡</div>');
    const list = renderToStaticMarkup(createElement(MymyKakao, { ...p, thread: "", ui: { mymyTab: "好友" } }));
    expect(list).toContain("<b>💗</b><small>うん、一緒に見ようね。</small>");
    expect(list).not.toContain("<b>君 ♡</b>");
  });
});
