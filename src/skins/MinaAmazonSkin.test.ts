import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { makeItem } from "../schema";
import { MinaAmazonSkin, amazonCartCatalog, amazonInitialHistory, amazonMiniPartsSuggestions, matchesAmazonGiftPartsSearch } from "./MinaAmazonSkin";

function props(ui: Props["ui"] = {}, unlocked = false): Props {
  return {
    appId: "amazonjp",
    owner: "名井南",
    name: "Amazon JP",
    items: unlocked ? [makeItem({ id: "mina-story-lego-amazon-unlocked" })] : [],
    creator: false,
    thread: "",
    ui,
    onUi: vi.fn(),
    onRead: vi.fn(),
    onItem: vi.fn(),
    onAdd: vi.fn(),
    onBack: vi.fn(),
    onThread: vi.fn(),
  };
}

describe("Mina's Amazon screenshot-based offline replica", () => {
  it("uses the four provided products and exactly matches the ¥35,881 cart and 202 points", () => {
    expect(amazonCartCatalog).toHaveLength(4);
    expect(amazonCartCatalog.reduce((sum, item) => sum + item.price, 0)).toBe(35881);
    expect(amazonCartCatalog.reduce((sum, item) => sum + item.points, 0)).toBe(202);
    const html = renderToStaticMarkup(createElement(MinaAmazonSkin, props({"amazon-screen":"cart"})));
    expect(html).toContain("¥35,881");
    expect(html).toContain("202ポイント");
    expect(html).toContain("レジに進む（4個の商品）（税込）");
    expect(html).toContain("JMBricklayer");
    expect(html).toContain("Wallace &amp; Gromit");
    expect(html).toContain("Ferrari SF-24");
    expect(html).toContain("エルサのアイスパレス");
    expect((html.match(/class="amazon-cart-card"/g)||[]).length).toBe(4);
    expect(html).toContain("あとで買う");
    expect(html).toContain("data:image/webp;base64,");
  });
  it("starts on home with a search box, sale hero, category links and four cart items", () => {
    const html = renderToStaticMarkup(createElement(MinaAmazonSkin, props()));
    expect(html).toContain('data-amazon-screen="home"');
    expect(html).toContain("検索または質問する");
    expect(html).toContain("スマイルSale");
    expect(html).toContain("カートの中身を見る（4点）");
  });
  it("shows removable search history from the screenshot", () => {
    expect(amazonInitialHistory).toEqual(["switch2", "lego dragon", "lego 32110", "lego"]);
    const html = renderToStaticMarkup(createElement(MinaAmazonSkin, props({"amazon-screen":"search"})));
    for (const term of amazonInitialHistory) {
      expect(html).toContain(term);
      expect(html).toContain(term + "を履歴から削除");
    }
  });
  it("reveals one LEGO parts hint only when unlocked, preserving existing search history", () => {
    const before = renderToStaticMarkup(createElement(MinaAmazonSkin, props({ "amazon-screen": "search" })));
    const after = renderToStaticMarkup(createElement(MinaAmazonSkin, props({ "amazon-screen": "search" }, true)));
    expect(before).not.toContain("レゴ 小さいパーツ 白 ピンク");
    expect(after).toContain("レゴ 小さいパーツ 白 ピンク");
    for (const original of amazonInitialHistory) expect(after).toContain(original);
  });

  it("shows useful small-parts search results without changing the original four-item cart", () => {
    expect(matchesAmazonGiftPartsSearch("レゴ 小さいパーツ 白 ピンク")).toBe(true);
    expect(matchesAmazonGiftPartsSearch("lego small parts")).toBe(true);
    expect(matchesAmazonGiftPartsSearch("ミニブロック パーツ")).toBe(true);
    expect(matchesAmazonGiftPartsSearch("レゴ フェラーリ")).toBe(false);
    expect(amazonMiniPartsSuggestions).toHaveLength(2);
    const html = renderToStaticMarkup(createElement(MinaAmazonSkin, props({
      "amazon-screen": "results",
      "amazon-active-query": "レゴ 小さいパーツ 白 ピンク",
    }, true)));
    expect(html).toContain("ミニブロック パーツ 1×2 ホワイト");
    expect(html).toContain("ミニブロック パーツ 1×1 パステルピンク");
    expect(html).toContain("2件の商品");
    expect(html).not.toContain("該当する商品はありません");
    expect(amazonCartCatalog).toHaveLength(4);
    expect(amazonCartCatalog.reduce((sum, item) => sum + item.price, 0)).toBe(35881);
  });

  it("allows empty carts with a zero total and never performs a live checkout", () => {
    const html = renderToStaticMarkup(createElement(MinaAmazonSkin, props({
      "amazon-screen": "cart",
      "amazon-cart-lines": [],
    })));
    expect(html).toContain("レジに進む（0個の商品）（税込）");
    expect(html).toContain("¥0");
    expect(html).toContain("実際の注文・決済は行われません");
  });
});
