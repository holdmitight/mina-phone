import { makeItem, type Runtime, type Work } from "../schema";
import { minaUnsentLetter } from "./minaUnsentArchive";
import { isSanaBranch, parseSanaAttempts, recoverSanaAttemptHistory } from "../vendor/mymy/mina-sana-replies";

export const minaClueKeys = {
  cafeVisit: "mina:map:cafe-visit",
  jeongyeonTalk: "mina:kakao:jeongyeon",
  sanaTalk: "mina:kakao:sana",
  oldLine: "mina:line:2014",
  legoPromiseSeen: "mina:line:lego-promise-read",
  balletDetails: "mina:photos:ballet-info",
  cafeResolved: "mina:unlocked:cafe-crosscheck",
  memoryResolved: "mina:unlocked:rain-draft",
  sanaFinished: "mina:kakao:sana-finished",
  jeongyeonGiftReady: "mina:unlocked:jeongyeon-gift",
  jeongyeonGiftRead: "mina:kakao:jeongyeon-gift-read",
  amazonPartsSeen: "mina:amazon:small-parts",
  safariResearchSeen: "mina:safari:miniature-research",
  legoPhotoSeen: "mina:photos:lego-work",
  giftTrailResolved: "mina:unlocked:gift-trail",
  lineBreakupSeen: "mina:line:last-message-read",
  summerAlbumRead: "mina:photos:summer-detail",
  summerPlaylistSeen: "mina:spotify:summer-playlist",
  unsentBreakupReady: "mina:unlocked:2015-unsent",
  unsentLaterReady: "mina:unlocked:2018-unsent",
  unsentReunionReady: "mina:unlocked:2025-unsent",
} as const;

export function isMinaStoryWork(work: Work): boolean {
  return (
    work.phone.owner === "名井南" &&
    (work.data.maps ?? []).some((item) => item.id === "maps-cafe") &&
    (work.data.kakao ?? []).some((item) => item.id === "kaka-sana-1")
  );
}

/** Render the author's 2025 reunion consistently without mutating the
 * original editable source work. All existing story item IDs remain stable.
 */
export function normalizeMinaStoryWork(work: Work): Work {
  if (!isMinaStoryWork(work)) return work;
  const data = Object.fromEntries(
    Object.entries(work.data).map(([app, items]) => [
      app,
      items.map((item) => ({
        ...item,
        time: item.time.replace(/^2026-11-/u, "2025-11-"),
      })),
    ]),
  );
  return {
    ...work,
    phone: {
      ...work.phone,
      date: work.phone.date?.replace(/^2026-11-/u, "2025-11-") ?? "2025-11-09",
    },
    data,
  };
}

/** Migrate already-started saves in place. Do not reset choices, chats,
 * notifications, or the author's stored progress when updating the date.
 */
export function normalizeMinaStoryRuntime(runtime: Runtime): Runtime {
  const date = runtime.date?.replace(/^2026-11-/u, "2025-11-");
  let changed = date !== runtime.date;
  const messages = Object.fromEntries(
    Object.entries(runtime.messages).map(([app, items]) => [
      app,
      items.map((item) => {
        const time = item.time.replace(/^2026-11-/u, "2025-11-");
        if (time !== item.time) changed = true;
        return time === item.time ? item : { ...item, time };
      }),
    ]),
  );
  const normalized = changed ? { ...runtime, date, messages } : runtime;

  // Repair older saves whose Sana branch finished before the Jeongyeon
  // notification was recorded. Reopening KakaoTalk is not required.
  const chatUi = normalized.ui?.kakao;
  const stage = chatUi?.minaSanaReplyStage;
  const attempts = Array.isArray(chatUi?.minaSanaAttempts)
    ? parseSanaAttempts(chatUi.minaSanaAttempts)
    : [];
  const recovered = recoverSanaAttemptHistory(
    typeof stage === "string" ? stage : "",
    typeof chatUi?.minaSanaAwakeText === "string" ? chatUi.minaSanaAwakeText : "",
    typeof chatUi?.minaSanaReplyText === "string" ? chatUi.minaSanaReplyText : "",
    attempts,
  );
  const hasSanaPing = (normalized.messages.kakao ?? []).some(
    (item) => item.id === "mina-story-cafe-sana-ping",
  );
  const needsJeongyeon =
    hasSanaPing &&
    isSanaBranch(recovered.stage) &&
    (!(normalized.messages.kakao ?? []).some(
      (item) => item.id === "mina-story-jeongyeon-gift-ping",
    ) || !normalized.clues.includes(minaClueKeys.sanaFinished));
  if (!needsJeongyeon) return normalized;
  return discoverMinaClue(normalized, minaClueKeys.sanaFinished);
}

/**
 * Merge one new discovery into the real, saveable phone runtime.
 * Reading in any order works. Unlocks are idempotent and do not show a
 * checklist or reveal whose workplace the cafe is.
 */
export function discoverMinaClue(runtime: Runtime, clue: string): Runtime {
  if (!Object.values(minaClueKeys).includes(clue as (typeof minaClueKeys)[keyof typeof minaClueKeys])) {
    return runtime;
  }

  const clues = [...runtime.clues];
  let changed = false;
  if (!clues.includes(clue)) {
    clues.push(clue);
    changed = true;
  }
  let messages = runtime.messages;
  let notifications = runtime.notifications;

  // Reconcile saved games from older builds: both clues may already be
  // recorded even if their unlocked content was never inserted.
  const cafeLinked =
    clues.includes(minaClueKeys.cafeVisit) &&
    clues.includes(minaClueKeys.jeongyeonTalk);
  if (cafeLinked) {
    const wasUnlocked = clues.includes(minaClueKeys.cafeResolved);
    if (!wasUnlocked) {
      clues.push(minaClueKeys.cafeResolved);
      changed = true;
      notifications = [
        ...notifications,
        "KakaoTalk: Sana：みーたん、まだ起きてる？",
      ];
    }
    if (!(messages.kakao ?? []).some((m) => m.id === "mina-story-cafe-sana-ping")) {
      const currentDate = (runtime.date || "2025-11-09").replace(/^2026-11-/u, "2025-11-");
      const currentTime = runtime.time || "21:09";
      const ping = makeItem({
        id: "mina-story-cafe-sana-ping",
        title: "Sana",
        sender: "Sana",
        body: "みーたん、まだ起きてる？",
        time: `${currentDate} ${currentTime}`,
        outgoing: false,
        read: false,
        folder: "聊天",
        meta: { story: "cafe-crosscheck" },
      });
      messages = {
        ...messages,
        kakao: [...(messages.kakao ?? []), ping],
      };
      changed = true;
    }
  }

  const memoryLinked =
    clues.includes(minaClueKeys.oldLine) &&
    clues.includes(minaClueKeys.balletDetails);
  if (memoryLinked) {
    if (!clues.includes(minaClueKeys.memoryResolved)) {
      clues.push(minaClueKeys.memoryResolved);
      changed = true;
    }
    if (!(messages.notes ?? []).some((m) => m.id === "mina-story-rain-unsent-note")) {
      const newNote = makeItem({
        id: "mina-story-rain-unsent-note",
        title: "書きかけ",
        body: "雨が強い。\n\n……今なら、ちゃんと言えるのに。",
        time: "2025-11-04 20:41",
        sender: "名井南",
        kind: "note",
        folder: "备忘录",
        meta: { story: "unsent-rain" },
      });
      messages = {
        ...messages,
        notes: [...(messages.notes ?? []), newNote],
      };
      changed = true;
    }
    if (!(messages.photos ?? []).some((item) => item.id === "mina-story-summer-album-unlocked")) {
      messages = {
        ...messages,
        photos: [...(messages.photos ?? []), makeItem({
          id: "mina-story-summer-album-unlocked",
          title: "2015, summer.",
          body: "昔の写真",
          sender: "名井南",
          time: "2015-08-09 16:29",
          meta: { story: "summer-archive" },
        })],
      };
      changed = true;
    }
  }


  // Hidden drafts become visible through actual exploration, not a chapter
  // button or automatic exposition. Both discovery orders are supported.
  const breakupLinked =
    clues.includes(minaClueKeys.lineBreakupSeen) &&
    clues.includes(minaClueKeys.balletDetails);
  const addLetter = (key: "breakup" | "later" | "reunion", clueKey: string) => {
    const id = {
      breakup: "mina-story-unsent-2015",
      later: "mina-story-unsent-2018",
      reunion: "mina-story-unsent-2025",
    }[key];
    if (!clues.includes(clueKey)) {
      clues.push(clueKey);
      changed = true;
    }
    if (!(messages.notes ?? []).some((item) => item.id === id)) {
      messages = { ...messages, notes: [...(messages.notes ?? []), minaUnsentLetter(key)] };
      changed = true;
    }
  };
  if (breakupLinked) addLetter("breakup", minaClueKeys.unsentBreakupReady);

  if (clues.includes(minaClueKeys.summerAlbumRead)) {
    if (!(messages.spotify ?? []).some((item) => item.id === "mina-story-spotify-summer-unlocked")) {
      messages = {
        ...messages,
        spotify: [...(messages.spotify ?? []), makeItem({
          id: "mina-story-spotify-summer-unlocked",
          title: "2015, summer.",
          body: "個人のプレイリスト",
          time: "2015-08-09 16:29",
          sender: "名井南",
          meta: { story: "summer-playlist" },
        })],
      };
      changed = true;
    }
  }
  if (breakupLinked && clues.includes(minaClueKeys.summerPlaylistSeen))
    addLetter("later", minaClueKeys.unsentLaterReady);

  // All three free-text Sana responses converge here. The archived Jeongyeon
  // exchange is from before the phone was lost: Mina never sends a new message
  // while A is holding her phone. Only Jeongyeon's follow-up is new.
  if (clues.includes(minaClueKeys.sanaFinished)) {
    if (!clues.includes(minaClueKeys.jeongyeonGiftReady)) {
      clues.push(minaClueKeys.jeongyeonGiftReady);
      changed = true;
      notifications = [...notifications, "KakaoTalk: Jeongyeon：야, 그거 이번엔 성공했어?ㅋㅋ"];
    }
    const oldGiftTalk = [
      ["01", "Jeongyeon", "야, 아직도 그거 만들고 있어?ㅋㅋ", "2025-11-07 22:11"],
      ["02", "名井南", "응…… 생각보다 어려워.", "2025-11-07 22:12"],
      ["03", "Jeongyeon", "그냥 다른 거 사서 주면 안 돼?", "2025-11-07 22:13"],
      ["04", "名井南", "안 돼. 내가 직접 만들어 주고 싶어.", "2025-11-07 22:15"],
      ["05", "Jeongyeon", "ㅋㅋ 알았어. 이번엔 꼭 전해 줘.", "2025-11-07 22:16"],
    ] as const;
    const current = messages.kakao ?? [];
    const additions = oldGiftTalk.filter(([id]) => !current.some((item) => item.id === "mina-story-gift-archive-" + id))
      .map(([id, sender, body, time]) => makeItem({
        id: "mina-story-gift-archive-" + id,
        title: "Jeongyeon",
        sender,
        body,
        time,
        outgoing: sender === "名井南",
        read: true,
        folder: "聊天",
        meta: { story: "gift-archive" },
      }));
    if (!current.some((item) => item.id === "mina-story-jeongyeon-gift-ping")) {
      additions.push(makeItem({
        id: "mina-story-jeongyeon-gift-ping",
        title: "Jeongyeon",
        sender: "Jeongyeon",
        body: "야, 그거 이번엔 성공했어?ㅋㅋ",
        time: `${(runtime.date || "2025-11-09").replace(/^2026-11-/u, "2025-11-")} ${runtime.time || "21:09"}`,
        outgoing: false,
        read: false,
        folder: "聊天",
        meta: { story: "gift-ping" },
      }));
    }
    if (additions.length) {
      messages = { ...messages, kakao: [...current, ...additions] };
      changed = true;
    }
  }

  // Inspecting Jeongyeon's thread makes the next clues available in ordinary
  // Amazon search history and the photo gallery, not in an explicit quest UI.
  if (clues.includes(minaClueKeys.jeongyeonGiftRead)) {
    for (const [appId, id] of [
      ["amazonjp", "mina-story-lego-amazon-unlocked"],
      ["photos", "mina-story-lego-photos-unlocked"],
      ["safari", "mina-story-lego-safari-unlocked"],
    ] as const) {
      if (!(messages[appId] ?? []).some((item) => item.id === id)) {
        messages = {
          ...messages,
          [appId]: [...(messages[appId] ?? []), makeItem({
            id,
            title: "作業中",
            body: "小さなパーツ",
            time: "2025-11-08 20:41",
            sender: "名井南",
            meta: { story: "gift-evidence" },
          })],
        };
        changed = true;
      }
    }
  }

  const oldGiftDraft = "何回やり直しても、うまくいかない。\n\nでも、自分で作りたい。\n……あの約束だから。";
  const refinedGiftDraft = [
    "何回やり直しても、うまくいかない。",
    "",
    "あの時は、冗談だと思ってた。",
    "でも、私はずっと覚えてる。",
    "",
    "自分で作りたい。",
    "……あの約束だから。",
    "",
    "今さら渡しても、困らせるだけかな。",
  ].join("\n");

  // The three discoveries can be made in any order. This note is only a
  // partial hint: the finished ring and intentional phone drop stay hidden.
  const giftLinked =
    clues.includes(minaClueKeys.giftTrailResolved) || (
      (clues.includes(minaClueKeys.amazonPartsSeen) ||
        clues.includes(minaClueKeys.safariResearchSeen)) &&
      clues.includes(minaClueKeys.legoPhotoSeen) &&
      clues.includes(minaClueKeys.legoPromiseSeen)
    );
  if (giftLinked) {
    if (!clues.includes(minaClueKeys.giftTrailResolved)) {
      clues.push(minaClueKeys.giftTrailResolved);
      changed = true;
    }
    if (!(messages.notes ?? []).some((item) => item.id === "mina-story-gift-unsent-draft")) {
      messages = {
        ...messages,
        notes: [...(messages.notes ?? []), makeItem({
          id: "mina-story-gift-unsent-draft",
          title: "作り直し",
          body: refinedGiftDraft,
          time: "2025-11-08 23:18",
          sender: "名井南",
          kind: "note",
          folder: "备忘录",
          meta: { story: "gift-trail" },
        })],
      };
      changed = true;
    }
    // Upgrade the generated note in older saves, but never overwrite text
    // that differs from the original authored draft.
    const savedGiftDraft = (messages.notes ?? []).find((item) => item.id === "mina-story-gift-unsent-draft");
    if (savedGiftDraft?.body === oldGiftDraft) {
      messages = {
        ...messages,
        notes: (messages.notes ?? []).map((item) =>
          item.id === savedGiftDraft.id ? { ...item, body: refinedGiftDraft } : item,
        ),
      };
      changed = true;
    }
  }

  if (clues.includes(minaClueKeys.giftTrailResolved) &&
      clues.includes(minaClueKeys.summerPlaylistSeen) &&
      clues.includes(minaClueKeys.lineBreakupSeen))
    addLetter("reunion", minaClueKeys.unsentReunionReady);

  return changed ? { ...runtime, clues, messages, notifications } : runtime;
}
