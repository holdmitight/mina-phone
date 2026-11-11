import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem, type Item } from "../../schema";
import type { SkinProps } from "../../AppSkins";
import { MymyKakao } from "./Apps";
import { markKakaoThreadRead, orderKakaoMessages, unreadKakaoMessages } from "./kakaoUnread";

const oldSana = makeItem({
  id: "kaka-sana-1",
  title: "Sana",
  sender: "Sana",
  body: "おやすみ。",
  time: "2026-11-09 20:57",
  read: true,
});
const oldJeongyeon = makeItem({
  id: "kaka-jeongyeon-1",
  title: "Jeongyeon",
  sender: "Jeongyeon",
  body: "잘 자.",
  time: "2026-11-09 20:53",
  read: true,
});
const sanaPing = makeItem({
  id: "mina-story-cafe-sana-ping",
  title: "Sana",
  sender: "Sana",
  body: "みーたん、まだ起きてる？",
  time: "2026-11-09 21:09",
  read: false,
  meta: { story: "cafe-crosscheck" },
});
const jeongyeonPing = makeItem({
  id: "mina-story-jeongyeon-gift-ping",
  title: "Jeongyeon",
  sender: "Jeongyeon",
  body: "야, 그거 이번엔 성공했어?ㅋㅋ",
  time: "2026-11-09 21:17",
  read: false,
  meta: { story: "gift-ping" },
});

function phoneProps(items: Item[], seen: string[] = []): SkinProps {
  return {
    appId: "kakao",
    owner: "名井南",
    name: "KakaoTalk",
    thread: "",
    items,
    creator: false,
    ui: { mymyKktSeenIncoming: seen },
    onUi: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onBack: vi.fn(),
    onAdd: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("KakaoTalk unread incoming messages", () => {
  it("shows one unread badge beside each newly received thread and on the chats tab", () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, phoneProps([
      oldSana, oldJeongyeon, sanaPing, jeongyeonPing,
    ])));
    expect(html).toContain('aria-label="Sana 未読1件"');
    expect(html).toContain('aria-label="Jeongyeon 未読1件"');
    expect(html).toContain('aria-label="2件未読"');
    expect(html).toContain("みーたん、まだ起きてる？");
    expect(html).toContain("야, 그거 이번엔 성공했어?ㅋㅋ");
  });

  it("clears only the opened contact's unread message and retains other unread chats", () => {
    const sanaMessages = [oldSana, sanaPing];
    const jeongyeonMessages = [oldJeongyeon, jeongyeonPing];
    const seen = markKakaoThreadRead([], sanaMessages);
    expect(seen).toContain(sanaPing.id);
    expect(unreadKakaoMessages(sanaMessages, seen)).toHaveLength(0);
    expect(unreadKakaoMessages(jeongyeonMessages, seen)).toHaveLength(1);

    const html = renderToStaticMarkup(createElement(MymyKakao, phoneProps([
      ...sanaMessages, ...jeongyeonMessages,
    ], seen)));
    expect(html).not.toContain('aria-label="Sana 未読1件"');
    expect(html).toContain('aria-label="Jeongyeon 未読1件"');
    expect(html).toContain('aria-label="1件未読"');
  });

  it("keeps read receipts after reopening and counts a later incoming message once", () => {
    const initial = [oldSana, sanaPing];
    const seen = markKakaoThreadRead([], initial);
    expect(markKakaoThreadRead(seen, initial)).toEqual(seen);
    expect(unreadKakaoMessages(initial, JSON.parse(JSON.stringify(seen)))).toHaveLength(0);

    const later = makeItem({
      id: "sana-new-followup",
      title: "Sana",
      sender: "Sana",
      body: "みーたん？",
      time: "2026-11-09 21:30",
      read: false,
    });
    expect(unreadKakaoMessages([...initial, later], seen).map((item) => item.id)).toEqual([later.id]);
    const updated = markKakaoThreadRead(seen, [...initial, later]);
    expect(unreadKakaoMessages([...initial, later], updated)).toHaveLength(0);
  });

  it("ignores Mina's sent messages and fully read archives", () => {
    const outgoing = makeItem({
      id: "mina-reply",
      title: "Sana",
      sender: "名井南",
      body: "まだ寝てないよ",
      time: "2026-11-09 21:10",
      outgoing: true,
    });
    expect(unreadKakaoMessages([oldSana, sanaPing, outgoing], [])).toHaveLength(0);
    expect(unreadKakaoMessages([oldSana], [])).toHaveLength(0);
  });

  it("keeps new Jeongyeon arrivals at the bottom despite later-dated authored messages", () => {
    const lateOld = makeItem({
      id: "old-jeongyeon-next-year",
      title: "Jeongyeon",
      sender: "Jeongyeon",
      body: "過去のメッセージ",
      time: "2026-11-10 22:14",
      read: true,
    });
    const ordered = orderKakaoMessages([jeongyeonPing, lateOld, oldJeongyeon]);
    expect(ordered.at(-1)?.id).toBe(jeongyeonPing.id);
    expect(unreadKakaoMessages(ordered, [])).toHaveLength(1);
    const html = renderToStaticMarkup(createElement(MymyKakao, phoneProps([
      oldSana, lateOld, jeongyeonPing,
    ])));
    expect(html).toContain('aria-label="Jeongyeon 未読1件"');
    expect(html).toContain("야, 그거 이번엔 성공했어?ㅋㅋ");
    const seen = markKakaoThreadRead([], ordered);
    expect(unreadKakaoMessages(ordered, seen)).toHaveLength(0);
  });

  it("shows an actionable Jeongyeon popup while Sana's chat is open and hides it after read", () => {
    const pending = {
      ...phoneProps([oldSana, oldJeongyeon, sanaPing, jeongyeonPing]),
      thread: "Sana",
    };
    const html = renderToStaticMarkup(createElement(MymyKakao, pending));
    expect(html).toContain('aria-label="Jeongyeonから新しいメッセージ"');
    expect(html).toContain("kakao-story-popup-open");
    expect(html).toContain("야, 그거 이번엔 성공했어?ㅋㅋ");
    const read = renderToStaticMarkup(createElement(MymyKakao, {
      ...pending,
      ui: { mymyKktSeenIncoming: [jeongyeonPing.id] },
    }));
    expect(read).not.toContain('aria-label="Jeongyeonから新しいメッセージ"');
  });

  it("honors an authored unread marker but clears it after opening the chat", () => {
    const marked = makeItem({
      id: "kakao-authored-unread",
      title: "Jeongyeon",
      sender: "Jeongyeon",
      body: "見てね",
      time: "2026-11-09 21:18",
      read: true,
      meta: { unread: "1" },
    });
    expect(unreadKakaoMessages([oldJeongyeon, marked], [])).toHaveLength(1);
    const seen = markKakaoThreadRead([], [oldJeongyeon, marked]);
    expect(unreadKakaoMessages([oldJeongyeon, marked], seen)).toHaveLength(0);
  });
});
