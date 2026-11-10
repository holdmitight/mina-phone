import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Props } from "./shared";
import { makeItem } from "../schema";
import { MinaSpotifySkin, spotifyInitialSearches } from "./MinaSpotifySkin";

function props(ui: Props["ui"] = {}, summer = false): Props {
  return {
    appId: "spotify",
    owner: "名井南",
    name: "Spotify",
    items: summer ? [makeItem({ id: "mina-story-spotify-summer-unlocked", title: "2015, summer." })] : [],
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
describe("Mina's Japanese Spotify demo", () => {
  it("shows the reference-inspired home, playlists, ILLIT, and King Gnu player", () => {
    const html = renderToStaticMarkup(createElement(MinaSpotifySkin, props()));
    expect(html).toContain("data-spotify-screen=\"home\"");
    expect(html).toContain("Asian R&amp;B + Pop");
    expect(html).toContain("pages vibe");
    expect(html).toContain("K-Pop ON!");
    expect(html).toContain("最新リリース");
    expect(html).toContain("ILLIT");
    expect(html).toContain("You&#x27;re Under Arrest (Remixes)");
    expect(html).toContain("Don&#x27;t Stop the Clocks");
    expect(html).toContain("今日の人気プレイリスト");
    expect(html).toContain("すべて");
    expect(html).toContain("オーディオブック");
    expect(html).toContain("マイライブラリ");
    expect(html).not.toContain("所有");
    expect(html).not.toContain("有聲書");
  });

  it("uses a Japanese search placeholder and the three supplied history entries", () => {
    expect(spotifyInitialSearches).toEqual([
      "ハート型ウイルス (Team A)",
      "Energetic K-Pop Mix",
      "Don't Stop the Clocks",
    ]);
    const html = renderToStaticMarkup(createElement(MinaSpotifySkin, props({
      "mina-spotify-screen": "search",
    })));
    expect(html).toContain("何を聴きたいですか？");
    expect(html).toContain("ジャンルを探す");
    expect(html).toContain("ポッドキャスト");
    expect(html).toContain("ライブイベント");
    expect(html).not.toContain("搜索");
  });

  it("reveals the private 2015 summer playlist only after the hidden album clue", () => {
    const before = renderToStaticMarkup(createElement(MinaSpotifySkin, props({
      "mina-spotify-screen": "library",
    })));
    expect(before).not.toContain("2015, summer.");
    const after = renderToStaticMarkup(createElement(MinaSpotifySkin, props({
      "mina-spotify-screen": "library",
    }, true)));
    expect(after).toContain("2015, summer.");
    expect(after).toContain("非公開");
    const home = renderToStaticMarkup(createElement(MinaSpotifySkin, props({}, true)));
    expect(home).toContain("2015, summer.");
    expect(home).toContain("夕暮れの海のプレイリストアート");
  });

  it("renders saved items on the library tab and allows creation", () => {
    const library = renderToStaticMarkup(createElement(MinaSpotifySkin, props({
      "mina-spotify-screen": "library",
      "mina-spotify-liked": ["illit", "kinggnu"],
      "mina-spotify-created": ["夜のプレイリスト"],
    })));
    expect(library).toContain("夜のプレイリスト");
    expect(library).toContain("You&#x27;re Under Arrest");
    const create = renderToStaticMarkup(createElement(MinaSpotifySkin, props({
      "mina-spotify-screen": "create",
    })));
    expect(create).toContain("プレイリストを作成");
    expect(create).toContain("プレイリストの名前");
  });
});
