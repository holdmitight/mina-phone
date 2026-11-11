import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppArtwork } from "./AppArtwork";
import { notificationContent, SystemNotifications } from "./SystemNotifications";
import type { Work } from "./schema";

const apps = [
  { id: "kakao", name: "KakaoTalk" },
  { id: "messages", name: "Messages" },
] as Work["apps"];

describe("KakaoTalk lock-screen notifications", () => {
  it("removes only 君 from the notification title and keeps the heart", () => {
    const notice = notificationContent(
      "KakaoTalk · 君 ♡：私も。会いに来ても、電話だけでもいいよ。無理しないでね。",
      apps,
    );
    expect(notice).toEqual({
      title: "KakaoTalk · ♡",
      body: "私も。会いに来ても、電話だけでもいいよ。無理しないでね。",
      appId: "kakao",
    });
    expect(notice.title).not.toContain("君");
  });

  it("also handles the contact name inside the notification body", () => {
    expect(notificationContent("KakaoTalk: 君 ♡：私も。", apps)).toEqual({
      title: "KakaoTalk · ♡",
      body: "私も。",
      appId: "kakao",
    });
  });

  it("leaves other KakaoTalk senders and non-Kakao notifications intact", () => {
    expect(notificationContent("KakaoTalk: Sana：まだ起きてる？", apps)).toEqual({
      title: "KakaoTalk",
      body: "Sana：まだ起きてる？",
      appId: "kakao",
    });
    expect(notificationContent("KakaoTalk · Jeongyeon：야, 잘 지내?", apps)).toEqual({
      title: "KakaoTalk · Jeongyeon",
      body: "야, 잘 지내?",
      appId: "kakao",
    });
    expect(notificationContent("Messages: Hello", apps)).toEqual({
      title: "Messages",
      body: "Hello",
      appId: "messages",
    });
  });

  it("renders a missed final call with the Phone icon so A can call back", () => {
    const result = notificationContent("Phone: Jeongyeon · 不在着信（タップして折り返す）", apps);
    expect(result.appId).toBe("phone");
    expect(result.body).toContain("折り返す");
  });

  it("renders the KakaoTalk artwork on the lock screen instead of Messages", () => {
    const html = renderToStaticMarkup(
      createElement(SystemNotifications, {
        notices: ["KakaoTalk · 君 ♡：私も。"],
        apps,
        onOpen: vi.fn(),
        onDismiss: vi.fn(),
        compact: true,
      }),
    );
    expect(html).toContain("KakaoTalk · ♡");
    expect(html).not.toContain("KakaoTalk · 君");
    expect(html).toContain("私も。");
    expect(html).toContain('aria-label="KakaoTalk"');
    const art = renderToStaticMarkup(createElement(AppArtwork, { id: "kakao" }));
    expect(art).toContain('fill="#FEE500"');
    expect(art).toContain("TALK");
  });
});
