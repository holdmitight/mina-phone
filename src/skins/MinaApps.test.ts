import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { makeItem } from "../schema";
import { registry } from "../registry";
import type { Props } from "./shared";
import { BubbleSkin, MinaShoppingSkin } from "./MinaApps";

function props(overrides: Partial<Props> = {}): Props {
  return {
    appId: "bubble", owner: "名井南", name: "JYP bubble", items: [],
    creator: false, thread: "", onUi: vi.fn(), onRead: vi.fn(),
    onItem: vi.fn(), onAdd: vi.fn(), onBack: vi.fn(), onThread: vi.fn(),
    ...overrides,
  };
}

describe("Bubble reference screens", () => {
  it("opens on MINA's account with ONCE as the conversation recipient", () => {
    const html = renderToStaticMarkup(createElement(BubbleSkin, props()));
    expect(html).toContain("Favorite Chat List");
    expect(html).toContain("Recent Chat Room");
    expect(html).toContain("MINAのトークを開く");
    expect(html).toContain("bubble for JYPnation");
    expect(html).not.toContain("mina-bubble-composer");
  });
  it("shows MINA's authored messages on the outgoing side and ONCE replies on the incoming side", () => {
    const items = [
      makeItem({ id: "mina-message", sender: "名井南", body: "ONCE、今日はありがとう。", outgoing: true, folder: "ONCE" }),
      makeItem({ id: "once-reply", sender: "ONCE", body: "ミナも、ゆっくり休んでね。", outgoing: false, folder: "ONCE" }),
    ];
    const before = structuredClone(items);
    const html = renderToStaticMarkup(createElement(BubbleSkin, props({
      items, ui: { "bubble-screen": "thread" },
    })));
    const rows = html.split('<div class="bubble-reference-message ').slice(1);
    const artist = rows.find((row) => row.startsWith('outgoing artist"'));
    const fan = rows.find((row) => row.startsWith('fan"'));
    expect(artist).toBeDefined();
    expect(fan).toBeDefined();
    expect(artist).toContain("ONCE、今日はありがとう。");
    expect(artist?.split("ONCE、今日はありがとう。")[0]).toContain("MINA");
    expect(artist).not.toContain("ミナも、ゆっくり休んでね。");
    expect(fan).toContain("ミナも、ゆっくり休んでね。");
    expect(fan?.split("ミナも、ゆっくり休んでね。")[0]).not.toContain("ARTIST");
    expect(items).toEqual(before);
  });
  it("restores composed letters as safe text without modifying authored records", () => {
    const p = props({
      items: [
        makeItem({ id: "artist-note", body: "今日はありがとう", outgoing: true, folder: "ONCE" }),
        makeItem({ id: "other-folder", body: "Separate private record", folder: "日记" }),
      ],
      ui: { "bubble-screen": "thread", "bubble-letters": ["ONCE，今天过得好吗？", "<script>alert('hello')</script>"] },
    });
    const before = structuredClone(p.items);
    const html = renderToStaticMarkup(createElement(BubbleSkin, p));
    expect(html).toContain("MINAとのトーク");
    expect(html).toContain("今日はありがとう");
    expect(html).toContain("ONCE，今天过得好吗？");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("Separate private record");
    expect(p.items).toEqual(before);
    expect(p.onUi).not.toHaveBeenCalled();
  });

  it("shows a free-form composer for MINA without forcing preset message choices", () => {
    const items = [
      makeItem({ id: "mina-sent", sender: "名井南", body: "사랑해 💗", outgoing: true, folder: "ONCE" }),
    ];
    const html = renderToStaticMarkup(createElement(BubbleSkin, props({
      items, ui: { "bubble-screen": "thread" },
    })));
    expect(html).toContain("MINAとして送信");
    expect(html).toContain("MINAとして送るメッセージを入力");
    expect(html).toContain("メッセージを入力…");
    expect(html).toContain("사랑해 💗");
    expect(html).toContain('bubble-reference-message outgoing artist');
    expect(html).toContain("mina-bubble-reference-avatar");
    expect(html).not.toContain("mina-bubble-quick-messages");
    expect(html).not.toContain("メッセージ候補");
  });

  it("renders saved fan-fiction messages as editable MINA messages", () => {
    const html = renderToStaticMarkup(createElement(BubbleSkin, props({
      items: [],
      ui: {
        "bubble-screen": "thread",
        "bubble-letters": ["직접 쓴 메시지 💌", "잘 자 🌙"],
      },
    })));
    expect(html).toContain("직접 쓴 메시지 💌");
    expect(html).toContain("잘 자 🌙");
    expect(html).toContain("編集");
    expect(html).toContain("bubble-reference-message outgoing artist");
  });

  it("ignores an invalid saved letter value and starts with an empty composer", () => {
    const html = renderToStaticMarkup(createElement(BubbleSkin, props({ ui: { "bubble-screen": "thread", "bubble-letters": 42 } })));
    expect(html).toContain("メッセージはまだありません");
    expect(html).toContain('aria-label="MINAとして送信" disabled=""');
  });
});

const products = [
  makeItem({ id: "product-a", title: "Soft cotton shirt", favorite: true, meta: { price: "1,280", category: "日常" } }),
  makeItem({ id: "product-b", title: "Tiny everyday bag", meta: { price: "300", category: "配件" } }),
  makeItem({ id: "order-a", title: "A previous order", kind: "order", folder: "订单", meta: { price: "9,999", status: "已送达" } }),
];

describe("independent shopping identities and saved player selections", () => {
  it.each([
    ["amazonjp", "amazon.co.jp", "JPY"],
    ["rakuten", "Rakuten", "JPY"],
    ["qoo10", "Qoo10", "JPY"],
    ["coupang", "coupang", "KRW"],
    ["musinsa", "MUSINSA", "KRW"],
  ])("renders %s with its own identity and local currency", (appId, brand, currency) => {
    const p = props({ appId, items: products });
    const html = renderToStaticMarkup(createElement(MinaShoppingSkin, p));
    const formatted = new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "ja-JP", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(1280);
    expect(registry.find((app) => app.id === appId)?.engine).toBe("records");
    expect(html).toContain(`<h1>${brand}</h1>`);
    expect(html).toContain(`data-shop="${appId}"`);
    expect(html).toContain(formatted);
    expect(html).toContain("Soft cotton shirt");
    expect(html).not.toContain("A previous order");
  });

  it("restores an explicitly cleared wishlist instead of re-seeding authored favorites", () => {
    const html = renderToStaticMarkup(createElement(MinaShoppingSkin, props({
      appId: "qoo10", items: products, ui: { "shop-tab": "收藏", "shop-saved": [] },
    })));
    expect(html).toContain("お気に入りはまだありません。おすすめを見てみましょう。");
    expect(html).not.toContain("Soft cotton shirt");
  });

  it("restores a shopping bag, excludes orders from its total and preserves source items", () => {
    const before = structuredClone(products);
    const html = renderToStaticMarkup(createElement(MinaShoppingSkin, props({
      appId: "amazonjp", items: products,
      ui: { "shop-tab": "购物袋", "shop-cart": ["product-a", "product-b", "order-a"] },
    })));
    expect(html).toContain("買い物リスト · 2 件");
    expect(html).toContain(new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(1580));
    expect(html).toContain('aria-label="削除：Soft cotton shirt"');
    expect(html).not.toContain("A previous order");
    expect(html).toContain("決済や注文は行いません");
    expect(products).toEqual(before);
  });

  it("keeps order records in the order tab instead of the product grid", () => {
    const html = renderToStaticMarkup(createElement(MinaShoppingSkin, props({
      appId: "musinsa", items: products, ui: { "shop-tab": "订单" },
    })));
    expect(html).toContain("A previous order");
    expect(html).toContain("配達済み");
    expect(html).not.toContain("Soft cotton shirt");
  });
});
