import { describe, it, expect } from "vitest";
import blank from "../../stories/blank/story.json";
import { compileStory } from "../story-engine/compiler";
import { registry } from "../registry";
import {
  defaultLayout,
  ensureAppStore,
  validateLayout,
  packHome,
  homeEntries,
  moveHome,
} from "./layout";
const work = () => compileStory(blank).work;
describe("device layout", () => {
  it("keeps the full app catalog and only defaults installed", () => {
    const l = defaultLayout(work());
    expect(l.apps.map((app) => app.id).sort()).toEqual(
      registry.map((app) => app.id).sort(),
    );
    expect(l.apps.filter((a) => a.installed)).toHaveLength(7);
  });
  it("packs different widget sizes and pages without overlap", () => {
    const l = defaultLayout(work());
    l.apps.forEach((a) => {
      a.installed = true;
      a.visible = true;
      a.dock = false;
      a.folder = "";
    });
    l.widgets = [
      { id: "widget-calendar", type: "calendar", size: "medium" },
      { id: "widget-notes", type: "notes", size: "large" },
    ];
    l.order = l.widgets.map((w) => w.id);
    const pages = packHome(homeEntries(l));
    expect(pages.length).toBeGreaterThan(2);
    for (const page of pages) {
      const cells = new Set();
      for (const entry of page)
        for (let y = entry.y; y < entry.y + entry.h; y++)
          for (let x = entry.x; x < entry.x + entry.w; x++) {
            expect(x).toBeLessThan(4);
            expect(y).toBeLessThan(6);
            expect(cells.has(x + "," + y)).toBe(false);
            cells.add(x + "," + y);
          }
    }
  });
  it("reorders entries and round-trips typed install and widget states", () => {
    const w = work(),
      l = defaultLayout(w);
    l.widgets = [{ id: "widget-clock", type: "clock", size: "small" }];
    const before = homeEntries(l).map((e) => e.key);
    moveHome(l, before[0], before[1]);
    expect(homeEntries(l)[0].key).toBe(before[1]);
    expect(validateLayout(JSON.parse(JSON.stringify(l)), w)).toEqual(l);
  });
  it("rejects foreign work and unknown apps and overfilled Dock", () => {
    const w = work(),
      l = defaultLayout(w);
    l.workId = "wrong";
    expect(() => validateLayout(l, w)).toThrow();
    l.workId = w.id;
    l.apps[0].id = "arbitrary";
    expect(() => validateLayout(l, w)).toThrow();
    const t = defaultLayout(w);
    t.apps.slice(0, 5).forEach((a) => {
      a.installed = true;
      a.visible = true;
      a.dock = true;
    });
    expect(() => validateLayout(t, w)).toThrow("Dock");
  });
});
it("preserves free grid gaps and rejects colliding fixed placements", () => {
  const w = work(),
    l = defaultLayout(w);
  l.positions.photos = { page: 0, x: 2, y: 4 };
  const pages = packHome(homeEntries(l), l.positions);
  expect(pages[0].find((c) => c.entry.key === "photos")).toMatchObject({
    x: 2,
    y: 4,
  });
  l.positions.notes = { page: 0, x: 2, y: 4 };
  expect(() => validateLayout(l, w)).toThrow("位置冲突");
});

it("adds store to legacy work without changing author data or other app states", () => {
  const w = work();
  w.apps = w.apps.filter((a) => a.id !== "appstore");
  const before = JSON.stringify(w);
  const effective = ensureAppStore(w);
  expect(effective.apps).toHaveLength(w.apps.length + 1);
  expect(JSON.stringify(w)).toBe(before);
  expect(effective.apps.filter((a) => a.id !== "appstore")).toEqual(w.apps);
  expect(
    validateLayout(defaultLayout(w), w).apps.some((a) => a.id === "appstore"),
  ).toBe(true);
});

it("migrates preview folders once while preserving custom folders and widgets", async () => {
  const preview = await import("../../stories/test-preview/story.json");
  const w = compileStory(preview.default).work;
  const before = JSON.stringify(w);
  const old = defaultLayout(w);
  old.previewLayoutRevision = 0;
  old.apps.find((a) => a.id === "wechat")!.folder = "聊天";
  old.apps.find((a) => a.id === "douyin")!.folder = "国内";
  old.apps.find((a) => a.id === "instagram")!.folder = "国际";
  old.apps.find((a) => a.id === "clock")!.folder = "我的工具";
  old.widgets.push({ id: "widget-keep", type: "battery", size: "small" });
  const migrated = validateLayout(old, w);
  for (const id of ["wechat", "douyin", "instagram"])
    expect(migrated.apps.find((a) => a.id === id)!.folder).toBe("");
  expect(migrated.apps.find((a) => a.id === "clock")!.folder).toBe("我的工具");
  expect(migrated.widgets).toEqual(old.widgets);
  expect(JSON.stringify(w)).toBe(before);
  migrated.apps.find((a) => a.id === "wechat")!.folder = "作者新建文件夹";
  expect(
    validateLayout(migrated, w).apps.find((a) => a.id === "wechat")!.folder,
  ).toBe("作者新建文件夹");
});

it("refreshes legacy saved names and icons without resetting desktop customization", () => {
  const w = work();
  const authoredPhoto = w.apps.find((app) => app.id === "photos")!;
  authoredPhoto.name = "写真";
  authoredPhoto.icon = "updated-photo-artwork";
  const old = defaultLayout(w);
  const photo = old.apps.find((app) => app.id === "photos")!;
  photo.name = "旧相册";
  photo.icon = "old-photo-artwork";
  photo.folder = "My photos";
  old.apps.find((app) => app.id === "bubble")!.installed = true;
  old.widgets = [{ id: "widget-keep", type: "battery", size: "small" }];
  old.order = ["folder:My photos", "widget-keep", "notes"];
  old.positions.notes = { page: 0, x: 2, y: 4 };
  old.cleared = ["photos"];
  const legacy = JSON.parse(JSON.stringify(old));
  delete legacy.authoredRevision;
  const sourceBefore = JSON.stringify(w);

  const refreshed = validateLayout(legacy, w);
  expect(refreshed.apps.find((app) => app.id === "photos")).toMatchObject({
    name: "写真", icon: "updated-photo-artwork", folder: "My photos",
  });
  expect(refreshed.apps.find((app) => app.id === "bubble")!.installed).toBe(true);
  expect(refreshed.authoredRevision).toBe(w.updatedAt);
  expect(refreshed.widgets).toEqual(old.widgets);
  expect(refreshed.order).toEqual(old.order);
  expect(refreshed.positions).toEqual(old.positions);
  expect(refreshed.cleared).toEqual(old.cleared);
  expect(JSON.stringify(w)).toBe(sourceBefore);
});

it("applies newly authored Bubble artwork on revision changes while preserving app state", () => {
  const w = work();
  const old = defaultLayout(w);
  const bubble = old.apps.find((app) => app.id === "bubble")!;
  bubble.name = "Old Bubble";
  bubble.icon = "old-bubble";
  bubble.installed = true;
  bubble.visible = false;
  bubble.dock = false;
  bubble.folder = "My folder";
  const previousAppState = { ...bubble };
  w.updatedAt += 1;
  const newBubble = w.apps.find((app) => app.id === "bubble")!;
  newBubble.name = "JYP bubble";
  newBubble.icon = "supplied-bubble-artwork";

  const refreshed = validateLayout(old, w);
  expect(refreshed.apps.find((app) => app.id === "bubble")).toEqual({
    ...previousAppState, name: "JYP bubble", icon: "supplied-bubble-artwork",
  });
  expect(refreshed.authoredRevision).toBe(w.updatedAt);
  expect(old.authoredRevision).not.toBe(w.updatedAt);
  expect(old.apps.find((app) => app.id === "bubble")!.icon).toBe("old-bubble");
});

it("keeps player name and icon edits when the authored revision has not changed", () => {
  const w = work();
  const old = defaultLayout(w);
  const photo = old.apps.find((app) => app.id === "photos")!;
  photo.name = "My own album";
  photo.icon = "player-custom-artwork";

  const restored = validateLayout(old, w);
  expect(restored.apps.find((app) => app.id === "photos")).toEqual(photo);
  expect(restored.authoredRevision).toBe(old.authoredRevision);
});

it("groups Mina shopping apps, hides Apple Music and migrates prior desktop settings", () => {
  const w = work();
  w.phone.wallpaper = "mina";
  const shops = ["amazonjp", "rakuten", "qoo10", "coupang", "musinsa", "taobao"];
  for (const a of w.apps) {
    if (a.id === "music" || shops.includes(a.id)) {
      a.installed = true;
      a.visible = true;
    }
  }
  const fresh = defaultLayout(w);
  expect(fresh.apps.find((a) => a.id === "music")).toMatchObject({
    installed: false, visible: false, dock: false,
  });
  for (const id of shops)
    expect(fresh.apps.find((a) => a.id === id)?.folder).toBe("ショッピング");
  expect(homeEntries(fresh).some((e) => e.key === "folder:ショッピング")).toBe(true);

  const older = defaultLayout({ ...w, phone: { ...w.phone, wallpaper: "sage" } });
  older.minaLayoutRevision = 0;
  older.apps.find((a) => a.id === "spotify")!.folder = "お気に入り";
  older.order = ["spotify", "amazonjp", "music", "notes"];
  older.positions.music = { page: 0, x: 0, y: 2 };
  const migrated = validateLayout(older, w);
  expect(migrated.apps.find((a) => a.id === "music")?.installed).toBe(false);
  expect(migrated.apps.find((a) => a.id === "amazonjp")?.folder).toBe("ショッピング");
  expect(migrated.apps.find((a) => a.id === "spotify")?.folder).toBe("お気に入り");
  expect(migrated.order).toContain("folder:ショッピング");
  expect(migrated.order).not.toContain("music");
  expect(migrated.positions.music).toBeUndefined();
  expect(migrated.minaLayoutRevision).toBe(1);
  expect(validateLayout(migrated, w).order).toEqual(migrated.order);
});
