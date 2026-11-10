import { describe, expect, it } from "vitest";
import actualMinaStory from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { initialRuntime, type Work } from "../schema";
import {
  discoverMinaClue,
  isMinaStoryWork,
  minaClueKeys as clues,
} from "./minaStoryInteractions";
import { notificationContent } from "../SystemNotifications";

const fixture = {
  id: "mina-test",
  updatedAt: 1,
  phone: { owner: "名井南", date: "2026-11-09", time: "21:09" },
  variables: {},
  apps: [{ id: "kakao", name: "KakaoTalk" }],
  data: {
    maps: [{ id: "maps-cafe" }],
    kakao: [{ id: "kaka-sana-1" }],
  },
} as unknown as Work;

describe("Mina cross-app discoveries", () => {

  it("recognizes actual published Mina story data, not only the tiny mock", () => {
    const actual = compileStory(actualMinaStory).work;
    expect(actual.phone.owner).toBe("名井南");
    expect(isMinaStoryWork(actual)).toBe(true);
    expect(actual.data.maps.some((item) => item.id === "maps-cafe")).toBe(true);
    expect(actual.data.kakao.some((item) => item.id === "kaka-jeongyeon-1")).toBe(true);

    const historyThenChat = discoverMinaClue(
      discoverMinaClue(initialRuntime(actual), clues.cafeVisit),
      clues.jeongyeonTalk,
    );
    const chatThenHistory = discoverMinaClue(
      discoverMinaClue(initialRuntime(actual), clues.jeongyeonTalk),
      clues.cafeVisit,
    );
    for (const state of [historyThenChat, chatThenHistory]) {
      expect(state.clues).toContain(clues.cafeResolved);
      expect(state.messages.kakao.some(
        (item) => item.id === "mina-story-cafe-sana-ping",
      )).toBe(true);
      expect(state.notifications).toContain(
        "KakaoTalk: Sana：みーたん、まだ起きてる？",
      );
    }
  });
  it("activates only for the specific Mina Phone story", () => {
    expect(isMinaStoryWork(fixture)).toBe(true);
    expect(isMinaStoryWork({
      ...fixture,
      phone: { ...fixture.phone, owner: "他の人" },
    })).toBe(false);
    expect(isMinaStoryWork({
      ...fixture,
      data: { ...fixture.data, maps: [] },
    })).toBe(false);
  });

  it("unlocks Sana's KakaoTalk notification after the cafe visits and Jeongyeon's chat in either order", () => {
    const start = initialRuntime(fixture);
    const mapFirst = discoverMinaClue(discoverMinaClue(start, clues.cafeVisit), clues.jeongyeonTalk);
    const chatFirst = discoverMinaClue(discoverMinaClue(start, clues.jeongyeonTalk), clues.cafeVisit);
    for (const result of [mapFirst, chatFirst]) {
      expect(result.clues).toContain(clues.cafeResolved);
      expect(result.notifications).toContain("KakaoTalk: Sana：みーたん、まだ起きてる？");
      expect(result.messages.kakao).toHaveLength(1);
      expect(result.messages.kakao[0]).toMatchObject({
        id: "mina-story-cafe-sana-ping",
        title: "Sana",
        body: "みーたん、まだ起きてる？",
        outgoing: false,
      });
      expect(
        notificationContent(result.notifications[0], fixture.apps).appId,
      ).toBe("kakao");
    }
    expect(discoverMinaClue(start, clues.cafeVisit).notifications).toHaveLength(0);
    expect(discoverMinaClue(start, clues.jeongyeonTalk).messages.kakao).toBeUndefined();
  });

  it("does not repeat unlocked messages or notifications on revisiting either app", () => {
    const start = initialRuntime(fixture);
    const unlocked = discoverMinaClue(discoverMinaClue(start, clues.cafeVisit), clues.jeongyeonTalk);
    expect(discoverMinaClue(unlocked, clues.cafeVisit)).toBe(unlocked);
    expect(discoverMinaClue(unlocked, clues.jeongyeonTalk)).toBe(unlocked);
    expect(unlocked.messages.kakao).toHaveLength(1);
    expect(unlocked.notifications).toHaveLength(1);
  });

  it("shows the unsent 2014-inspired note only after both ballet details and the old LINE are inspected", () => {
    const initial = initialRuntime(fixture);
    const photoOnly = discoverMinaClue(initial, clues.balletDetails);
    const lineOnly = discoverMinaClue(initial, clues.oldLine);
    expect(photoOnly.messages.notes).toBeUndefined();
    expect(lineOnly.messages.notes).toBeUndefined();

    const photoThenLine = discoverMinaClue(photoOnly, clues.oldLine);
    const lineThenPhoto = discoverMinaClue(lineOnly, clues.balletDetails);
    for (const result of [photoThenLine, lineThenPhoto]) {
      expect(result.clues).toContain(clues.memoryResolved);
      expect(result.messages.notes).toHaveLength(1);
      expect(result.messages.notes[0]).toMatchObject({
        id: "mina-story-rain-unsent-note",
        title: "書きかけ",
        sender: "名井南",
      });
      expect(result.messages.notes[0].body).toContain("雨が強い。");
      expect(result.messages.notes[0].body).not.toContain("A");
    }
    expect(discoverMinaClue(photoThenLine, clues.oldLine)).toBe(photoThenLine);
  });

  it("recovers older saves that saw both clues but missed the notification", () => {
    const partial = {
      ...initialRuntime(fixture),
      clues: [clues.cafeVisit, clues.jeongyeonTalk],
    };
    const repaired = discoverMinaClue(partial, clues.cafeVisit);
    expect(repaired.clues).toContain(clues.cafeResolved);
    expect(repaired.messages.kakao).toHaveLength(1);
    expect(repaired.notifications).toHaveLength(1);
    const dismissed = { ...repaired, notifications: [] };
    expect(discoverMinaClue(dismissed, clues.jeongyeonTalk)).toBe(dismissed);
    expect(dismissed.messages.kakao).toHaveLength(1);

    const missingMessage = { ...repaired, messages: {} };
    const healed = discoverMinaClue(missingMessage, clues.cafeVisit);
    expect(healed.messages.kakao).toHaveLength(1);
    expect(healed.notifications).toHaveLength(1);
    expect(discoverMinaClue(healed, clues.cafeVisit)).toBe(healed);
  });

  it("restores an older save's missing unlocked rain note without replacing existing clues", () => {
    const partial = {
      ...initialRuntime(fixture),
      clues: [clues.oldLine, clues.balletDetails, clues.memoryResolved],
    };
    const healed = discoverMinaClue(partial, clues.oldLine);
    expect(healed.messages.notes).toHaveLength(1);
    expect(healed.messages.notes[0].body).toBe(
      "雨が強い。\n\n……今なら、ちゃんと言えるのに。",
    );
    expect(discoverMinaClue(healed, clues.balletDetails)).toBe(healed);
  });


  it("continues all Sana free-text endings into one Jeongyeon notification and archived gift talk", () => {
    // The UI translates deny, why and memory into the same completed clue.
    const start = discoverMinaClue(
      discoverMinaClue(initialRuntime(fixture), clues.cafeVisit),
      clues.jeongyeonTalk,
    );
    const result = discoverMinaClue(start, clues.sanaFinished);
    expect(result.clues).toContain(clues.jeongyeonGiftReady);
    expect(result.notifications.filter((notice) => notice.includes("Jeongyeon："))).toHaveLength(1);
    const giftTalk = result.messages.kakao.filter((item) => item.id.startsWith("mina-story-gift-archive-"));
    expect(giftTalk).toHaveLength(5);
    expect(giftTalk.filter((item) => item.outgoing)).toHaveLength(2);
    expect(giftTalk.find((item) => item.outgoing)?.body).toContain("어려워");
    expect(result.messages.kakao.some((item) => item.id === "mina-story-jeongyeon-gift-ping")).toBe(true);
    expect(discoverMinaClue(result, clues.sanaFinished)).toBe(result);
    expect(result.messages.kakao.filter((item) => item.id === "mina-story-jeongyeon-gift-ping")).toHaveLength(1);
  });

  it("unlocks Amazon and the separate photo album only after opening the gift chat", () => {
    const afterSana = discoverMinaClue(initialRuntime(fixture), clues.sanaFinished);
    expect(afterSana.messages.amazonjp).toBeUndefined();
    expect(afterSana.messages.photos).toBeUndefined();
    const afterJeongyeon = discoverMinaClue(afterSana, clues.jeongyeonGiftRead);
    expect(afterJeongyeon.messages.amazonjp.map((item) => item.id)).toContain("mina-story-lego-amazon-unlocked");
    expect(afterJeongyeon.messages.photos.map((item) => item.id)).toContain("mina-story-lego-photos-unlocked");
    expect(discoverMinaClue(afterJeongyeon, clues.jeongyeonGiftRead)).toBe(afterJeongyeon);
  });

  it("reveals only a partial unsent note after the LEGO search, photo details and LINE promise", () => {
    let state = discoverMinaClue(initialRuntime(fixture), clues.sanaFinished);
    state = discoverMinaClue(state, clues.jeongyeonGiftRead);
    state = discoverMinaClue(state, clues.legoPhotoSeen);
    state = discoverMinaClue(state, clues.oldLine);
    expect(state.messages.notes.some((item) => item.id === "mina-story-gift-unsent-draft")).toBe(false);
    state = discoverMinaClue(state, clues.amazonPartsSeen);
    expect(state.clues).toContain(clues.giftTrailResolved);
    const draft = state.messages.notes.find((item) => item.id === "mina-story-gift-unsent-draft");
    expect(draft?.body).toContain("あの約束");
    expect(draft?.body).toContain("\n");
    expect(draft?.body).not.toContain("わざと置いて");
    expect(discoverMinaClue(state, clues.amazonPartsSeen)).toBe(state);
    expect(JSON.parse(JSON.stringify(state)).messages.notes.some(
      (item: { id: string }) => item.id === "mina-story-gift-unsent-draft",
    )).toBe(true);
  });

  it("retains all progress with a serializable runtime and ignores unrecognized clues", () => {
    let state = initialRuntime(fixture);
    state = discoverMinaClue(state, clues.cafeVisit);
    state = discoverMinaClue(state, clues.jeongyeonTalk);
    state = discoverMinaClue(state, clues.oldLine);
    state = discoverMinaClue(state, clues.balletDetails);
    expect(state.messages.kakao).toHaveLength(1);
    expect(state.messages.notes).toHaveLength(1);
    const copied = JSON.parse(JSON.stringify(state));
    expect(copied.clues).toEqual(state.clues);
    expect(copied.messages.notes[0].body).toContain("雨が強い。");
    expect(discoverMinaClue(state, "other-app:unknown")).toBe(state);
  });
});
