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
});
