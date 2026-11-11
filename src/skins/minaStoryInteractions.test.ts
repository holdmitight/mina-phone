import { describe, expect, it } from "vitest";
import actualMinaStory from "../../stories/template/story.json";
import { compileStory } from "../story-engine/compiler";
import { choose } from "../engine";
import { initialRuntime, makeItem, type Work } from "../schema";
import {
  discoverMinaClue,
  isMinaStoryWork,
  normalizeMinaStoryWork,
  normalizeMinaStoryRuntime,
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
    expect(afterSana.messages.safari).toBeUndefined();
    const afterJeongyeon = discoverMinaClue(afterSana, clues.jeongyeonGiftRead);
    expect(afterJeongyeon.messages.amazonjp.map((item) => item.id)).toContain("mina-story-lego-amazon-unlocked");
    expect(afterJeongyeon.messages.photos.map((item) => item.id)).toContain("mina-story-lego-photos-unlocked");
    expect(afterJeongyeon.messages.safari.map((item) => item.id)).toContain("mina-story-lego-safari-unlocked");
    expect(discoverMinaClue(afterJeongyeon, clues.jeongyeonGiftRead)).toBe(afterJeongyeon);
  });

  it("reveals only a partial unsent note after the LEGO search, photo details and LINE promise", () => {
    let state = discoverMinaClue(initialRuntime(fixture), clues.sanaFinished);
    state = discoverMinaClue(state, clues.jeongyeonGiftRead);
    state = discoverMinaClue(state, clues.legoPhotoSeen);
    state = discoverMinaClue(state, clues.oldLine);
    state = discoverMinaClue(state, clues.amazonPartsSeen);
    // Opening LINE alone is not reading the exact LEGO promise.
    expect((state.messages.notes ?? []).some((item) => item.id === "mina-story-gift-unsent-draft")).toBe(false);
    state = discoverMinaClue(state, clues.legoPromiseSeen);
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

  it("lets Safari research replace Amazon as the technical clue without weakening the old route", () => {
    let state = discoverMinaClue(initialRuntime(fixture), clues.jeongyeonGiftRead);
    state = discoverMinaClue(state, clues.oldLine);
    state = discoverMinaClue(state, clues.legoPhotoSeen);
    state = discoverMinaClue(state, clues.safariResearchSeen);
    expect((state.messages.notes ?? []).find((i) => i.id === "mina-story-gift-unsent-draft")).toBeUndefined();
    state = discoverMinaClue(state, clues.legoPromiseSeen);
    const draft = state.messages.notes.find((i) => i.id === "mina-story-gift-unsent-draft");
    expect(state.clues).toContain(clues.giftTrailResolved);
    expect(draft?.body).toContain("あの時は、冗談だと思ってた。");
    expect(draft?.body).toContain("私はずっと覚えてる");
    expect(draft?.body).toContain("あの約束");
    expect(draft?.body).toContain("困らせるだけかな");
    expect(draft?.body).not.toContain("スマホをわざと");
    expect(discoverMinaClue(state, clues.safariResearchSeen)).toBe(state);
  });

  it("keeps the final draft reachable without an invisible Spotify or photo-info tap", () => {
    let state = initialRuntime(fixture);
    state = discoverMinaClue(state, clues.lineBreakupSeen);
    state = discoverMinaClue(state, clues.legoPromiseSeen);
    expect((state.messages.notes ?? []).some((item) => item.id === "mina-story-unsent-2025")).toBe(false);
    state = discoverMinaClue(state, clues.amazonPartsSeen);
    expect(state.clues).toContain(clues.giftTrailResolved);
    expect(state.clues).toContain(clues.unsentReunionReady);
    const letter = state.messages.notes.find((item) => item.id === "mina-story-unsent-2025");
    expect(letter?.title).toBe("カフェの帰り道");
    expect(state.incomingCall).toBeNull();
    state = discoverMinaClue(state, clues.heartThreadSeen);
    expect(state.incomingCall).toBeNull();
    state = discoverMinaClue(state, clues.finalLetterRead);
    expect(state.incomingCall?.target).toBe("mina-story-final-call");
  });

  it("upgrades previously unlocked short drafts without creating duplicate notes", () => {
    let state = initialRuntime(fixture);
    for (const key of [clues.oldLine, clues.legoPromiseSeen, clues.legoPhotoSeen, clues.amazonPartsSeen]) {
      state = discoverMinaClue(state, key);
    }
    const oldText = ["何回やり直しても、うまくいかない。", "", "でも、自分で作りたい。", "……あの約束だから。"].join("\n");
    const oldState = {
      ...state,
      // Existing saves may already have the note without the new precise
      // 2014 message-visibility clue. Keep and upgrade their progress.
      clues: state.clues.filter((key) => key !== clues.legoPromiseSeen),
      messages: {
        ...state.messages,
        notes: (state.messages.notes ?? []).map((item) =>
          item.id === "mina-story-gift-unsent-draft" ? { ...item, body: oldText } : item,
        ),
      },
    };
    const upgraded = discoverMinaClue(oldState, clues.oldLine);
    expect(upgraded.messages.notes.filter((i) => i.id === "mina-story-gift-unsent-draft")).toHaveLength(1);
    expect(upgraded.messages.notes.find((i) => i.id === "mina-story-gift-unsent-draft")?.body).toContain("冗談");
    expect(discoverMinaClue(upgraded, clues.oldLine)).toBe(upgraded);
  });

  it("migrates Mina's 2026 save and authored item times to the 2025 reunion without resetting progress", () => {
    const actual = compileStory(actualMinaStory).work;
    const canon = normalizeMinaStoryWork(actual);
    expect(canon.phone.date).toBe("2025-11-09");
    expect(canon.updatedAt).toBe(actual.updatedAt);
    expect(canon.id).toBe(actual.id);
    const legacy = {
      ...initialRuntime(actual),
      date: "2026-11-09",
      time: "21:09",
      clues: [clues.oldLine],
      messages: {
        kakao: [makeItem({
          id: "mina-story-cafe-sana-ping", title: "Sana",
          time: "2026-11-09 21:09", sender: "Sana",
        })],
      },
    };
    const migrated = normalizeMinaStoryRuntime(legacy);
    expect(migrated.date).toBe("2025-11-09");
    expect(migrated.messages.kakao[0].time).toBe("2025-11-09 21:09");
    expect(migrated.clues).toEqual([clues.oldLine]);
    expect(normalizeMinaStoryRuntime(migrated)).toBe(migrated);
  });

  it("unlocks the three unsent years in stages, without exposing the final surprise", () => {
    let state = initialRuntime(fixture);
    state = discoverMinaClue(state, clues.oldLine);
    state = discoverMinaClue(state, clues.lineBreakupSeen);
    expect((state.messages.notes ?? []).some((item) => item.id === "mina-story-unsent-2015")).toBe(false);
    state = discoverMinaClue(state, clues.balletDetails);
    expect(state.messages.photos.map((item) => item.id)).toContain("mina-story-summer-album-unlocked");
    expect(state.messages.notes.find((item) => item.id === "mina-story-unsent-2015")?.body).toContain("行かないで");
    expect(state.messages.notes.some((item) => item.id === "mina-story-unsent-2018")).toBe(false);
    state = discoverMinaClue(state, clues.summerAlbumRead);
    expect(state.messages.spotify.map((item) => item.id)).toContain("mina-story-spotify-summer-unlocked");
    state = discoverMinaClue(state, clues.summerPlaylistSeen);
    expect(state.messages.notes.find((item) => item.id === "mina-story-unsent-2018")?.body).toContain("雨が大きい");
    expect(state.messages.notes.some((item) => item.id === "mina-story-unsent-2025")).toBe(false);
    state = discoverMinaClue(state, clues.legoPromiseSeen);
    state = discoverMinaClue(state, clues.legoPhotoSeen);
    state = discoverMinaClue(state, clues.amazonPartsSeen);
    expect(state.clues).toContain(clues.giftTrailResolved);
    const newest = state.messages.notes.find((item) => item.id === "mina-story-unsent-2025");
    expect(newest?.body).toContain("ちゃんと話さなきゃ");
    expect(newest?.body).not.toContain("わざと");
    expect(newest?.body).not.toContain("指輪");
    const saved = JSON.parse(JSON.stringify(state));
    expect(saved.messages.notes.filter((item: {id: string}) =>
      item.id.startsWith("mina-story-unsent-"))).toHaveLength(3);
    expect(discoverMinaClue(state, clues.summerPlaylistSeen)).toBe(state);
  });

  it("repairs a saved finished Sana branch that never received Jeongyeon's notification", () => {
    const base = discoverMinaClue(
      discoverMinaClue(initialRuntime(fixture), clues.cafeVisit),
      clues.jeongyeonTalk,
    );
    const oldSave = {
      ...base,
      ui: {
        ...base.ui,
        kakao: {
          minaSanaReplyStage: "memory",
          minaSanaAwakeText: "まだ起きてるよ",
          minaSanaReplyText: "ちょっと昔のことを思い出してた",
        },
      },
    };
    const repaired = normalizeMinaStoryRuntime(oldSave);
    expect(repaired.clues).toContain(clues.sanaFinished);
    expect(repaired.clues).toContain(clues.jeongyeonGiftReady);
    expect(repaired.messages.kakao.filter((item) =>
      item.id === "mina-story-jeongyeon-gift-ping",
    )).toHaveLength(1);
    expect(repaired.notifications.filter((n) => n.includes("Jeongyeon："))).toHaveLength(1);
    expect(normalizeMinaStoryRuntime(repaired)).toBe(repaired);
  });

  it("recovers old free-text attempts into the Jeongyeon follow-up without replaying the chat", () => {
    const base = discoverMinaClue(
      discoverMinaClue(initialRuntime(fixture), clues.cafeVisit),
      clues.jeongyeonTalk,
    );
    const oldSave = {
      ...base,
      ui: {
        ...base.ui,
        kakao: {
          minaSanaReplyStage: "",
          minaSanaAwakeText: "",
          minaSanaReplyText: "",
          minaSanaAttempts: [
            JSON.stringify(["", "まだです"]),
            JSON.stringify(["", "？"]),
          ],
        },
      },
    };
    const repaired = normalizeMinaStoryRuntime(oldSave);
    expect(repaired.clues).toContain(clues.sanaFinished);
    expect(repaired.messages.kakao.some((i) => i.id === "mina-story-jeongyeon-gift-ping")).toBe(true);
    expect(normalizeMinaStoryRuntime(repaired)).toBe(repaired);
    const onlyAwake = {
      ...oldSave,
      ui: {
        ...oldSave.ui,
        kakao: {
          ...oldSave.ui.kakao,
          minaSanaAttempts: [JSON.stringify(["", "まだです"])],
        },
      },
    };
    const notYet = normalizeMinaStoryRuntime(onlyAwake);
    expect(notYet.clues).not.toContain(clues.sanaFinished);
  });

  it("removes the old mid-story phone option while keeping the finale separate", () => {
    const work = normalizeMinaStoryWork(compileStory(actualMinaStory).work);
    const decision = work.nodes.find((node) => node.id === "evening-decision");
    expect(decision?.next).not.toContain("choose-call");
    expect(decision?.next).toContain("choose-together");
    expect(work.nodes.find((node) => node.id === "choose-call")
      ?.actions.some((action) => action.type === "call")).toBe(false);
    const initial = {
      ...initialRuntime(work),
      choices: [
        { label: "会いに行く。映画は一緒に。", target: "choose-together" },
        { label: "今夜は、声を聞いておやすみ。", target: "choose-call" },
      ],
    };
    const normalized = normalizeMinaStoryRuntime(initial);
    expect(normalized.choices.map((choice) => choice.target)).toEqual(["choose-together"]);
    expect(normalized.incomingCall).toBeNull();
    const obsoleteChoice = choose(work, initial, "choose-call");
    expect(obsoleteChoice.incomingCall).toBeNull();
  });

  it("drops the obsolete call and ghost notifications from old saved games", () => {
    const saved = {
      ...initialRuntime(fixture),
      incomingCall: {
        caller: "君 ♡",
        target: "call-evening",
        status: "ringing" as const,
      },
      clues: [clues.finalCallOffered],
      notifications: [
        "君 来电", "君 ♡ 来电", "Phone: Jeongyeon · 不在着信（タップして折り返す）",
        "KakaoTalk: Jeongyeon：야, 잘 지내?",
      ],
      ui: { minaFinalCall: { step: 4 } },
    };
    const repaired = normalizeMinaStoryRuntime(saved);
    expect(repaired.incomingCall).toBeNull();
    expect(repaired.clues).not.toContain(clues.finalCallOffered);
    expect(repaired.notifications).toEqual(["KakaoTalk: Jeongyeon：야, 잘 지내?"]);
    expect(repaired.ui?.minaFinalCall?.step).toBe(0);
    expect(normalizeMinaStoryRuntime(repaired)).toBe(repaired);
  });

  it("does not preserve an early finale call from the former routing bug", () => {
    const saved = {
      ...initialRuntime(fixture),
      incomingCall: { caller: "Jeongyeon", target: "mina-story-final-call", status: "answered" as const },
      ui: { minaFinalCall: { step: 3 } },
      clues: [clues.finalCallOffered],
    };
    const repaired = normalizeMinaStoryRuntime(saved);
    expect(repaired.incomingCall).toBeNull();
    expect(repaired.clues).not.toContain(clues.finalCallOffered);
    expect(repaired.ui?.minaFinalCall?.step).toBe(0);
  });

  it("repairs anonymous caller IDs from previous builds without resetting the final dialogue", () => {
    const saved = {
      ...initialRuntime(fixture),
      incomingCall: { caller: "不明な番号", target: "mina-story-final-call", status: "answered" as const },
      clues: [clues.unsentReunionReady, clues.heartThreadSeen, clues.finalLetterRead],
      notifications: ["Phone: 不明な番号 · 不在着信（タップして折り返す）"],
      ui: { minaFinalCall: { step: 4 } },
    };
    const fixed = normalizeMinaStoryRuntime(saved);
    expect(fixed.incomingCall?.caller).toBe("Jeongyeon");
    expect(fixed.incomingCall?.status).toBe("answered");
    expect(fixed.ui?.minaFinalCall?.step).toBe(4);
    expect(fixed.notifications[0]).toContain("Jeongyeon");
    expect(normalizeMinaStoryRuntime(fixed)).toBe(fixed);
  });

  it("makes Mina call only after the real 2025 draft and 💗 chat were both read", () => {
    let state = initialRuntime(fixture);
    state = discoverMinaClue(state, clues.giftTrailResolved);
    state = discoverMinaClue(state, clues.summerPlaylistSeen);
    state = discoverMinaClue(state, clues.lineBreakupSeen);
    expect(state.clues).toContain(clues.unsentReunionReady);
    expect(state.incomingCall).toBeNull();
    state = discoverMinaClue(state, clues.heartThreadSeen);
    expect(state.incomingCall).toBeNull();
    state = discoverMinaClue(state, clues.finalLetterRead);
    expect(state.incomingCall).toEqual({
      caller: "Jeongyeon",
      target: "mina-story-final-call",
      status: "ringing",
    });
    expect(state.clues).toContain(clues.finalCallOffered);
    expect(discoverMinaClue(state, clues.finalLetterRead)).toBe(state);
    expect(JSON.parse(JSON.stringify(state)).incomingCall?.caller).toBe("Jeongyeon");
  });

  it("offers the ending call regardless of whether the player reads 💗 or the final draft first", () => {
    let state = initialRuntime(fixture);
    state = discoverMinaClue(state, clues.heartThreadSeen);
    state = discoverMinaClue(state, clues.finalLetterRead);
    expect(state.incomingCall).toBeNull();
    state = discoverMinaClue(state, clues.giftTrailResolved);
    state = discoverMinaClue(state, clues.summerPlaylistSeen);
    expect(state.incomingCall).toBeNull();
    state = discoverMinaClue(state, clues.lineBreakupSeen);
    expect(state.incomingCall?.target).toBe("mina-story-final-call");
    const dismissed = { ...state, incomingCall: null };
    expect(discoverMinaClue(dismissed, clues.heartThreadSeen)).toBe(dismissed);
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
