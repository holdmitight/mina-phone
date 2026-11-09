import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ja } from "./i18n";
import { Tabs } from "./skins/shared";

describe("Japanese presentation labels", () => {
  it("localizes system labels while leaving the application's source keys unchanged", () => {
    const keys = ["设置", "备忘录", "购物袋", "订单"];
    expect(keys.map(ja)).toEqual(["設定", "メモ", "カート", "注文"]);
    expect(keys).toEqual(["设置", "备忘录", "购物袋", "订单"]);
  });

  it("preserves authored Japanese, Korean and custom profile names", () => {
    for (const text of [
      "今日は一緒に帰ろうね。",
      "언니도 저녁 거르지 마.",
      "im not sharon",
      "MINA · AFTER HOURS",
    ]) expect(ja(text)).toBe(text);
  });

  it("keeps numeric accessibility information in Japanese labels", () => {
    expect(ja("已输入3位密码")).toBe("3桁入力済み");
    expect(ja("12 张照片")).toBe("12枚の写真");
    expect(ja("搜索聊天")).toBe("トークを検索");
  });

  it("renders a selected Japanese tab without changing its persisted internal key", () => {
    const tabs = ["精选", "收藏", "订单"];
    const set = vi.fn();
    const html = renderToStaticMarkup(createElement(Tabs, { tabs, value: "收藏", set }));
    expect(html).toContain("おすすめ");
    expect(html).toContain('<button class="selected"><span>お気に入り</span></button>');
    expect(html).toContain("注文");
    expect(tabs).toEqual(["精选", "收藏", "订单"]);
    expect(set).not.toHaveBeenCalled();
  });
});
