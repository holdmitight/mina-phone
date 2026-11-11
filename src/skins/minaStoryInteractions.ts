import { makeItem, type Runtime, type Work } from "../schema";
import { minaUnsentLetter } from "./minaUnsentArchive";
import { isSanaBranch, parseSanaAttempts, recoverSanaAttemptHistory } from "../vendor/mymy/mina-sana-replies";
import { parseSanaAdaptiveTurns } from "../vendor/mymy/sanaAdaptive";
import { parseJeongyeonTurns } from "../vendor/mymy/mina-jeongyeon-replies";

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
  heartThreadSeen: "mina:kakao:heart-thread-read",
  finalLetterRead: "mina:notes:final-draft-read",
  finalCallOffered: "mina:final-call:offered",
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
    // The old goodnight-choice ending belonged to an earlier story draft.
    // It cannot lead into Mina's actual 2025 reunion, so disconnect it
    // completely. The real final call is gated by the letter and 💗.
    nodes: work.nodes.map((node) =>
      node.id === "read-secret-draft"
        ? { ...node, next: node.next.filter((id) => id !== "evening-decision") }
        : node.id === "evening-decision"
          ? { ...node, next: [] }
          : node.id === "choose-call"
            ? { ...node, actions: node.actions.filter((action) => action.type !== "call") }
            : node
    ),
  };
}

/** A genuine ending needs the authored 2025 unsent letter to have been
 * opened, and the pinned 💗 contact to have been visited. Old saves may
 * already list the note in `read` without the newer clue marker.
 */
export function isMinaFinalCallReady(runtime: Runtime): boolean {
  const noteExists = (runtime.messages.notes ?? []).some(
    (item) => item.id === "mina-story-unsent-2025",
  );
  const noteRead =
    runtime.clues.includes(minaClueKeys.finalLetterRead) ||
    runtime.read.includes("mina-story-unsent-2025");
  return noteExists && noteRead &&
    runtime.clues.includes(minaClueKeys.heartThreadSeen);
}

export function isMinaFinalCallComplete(runtime: Runtime): boolean {
  return Boolean(runtime.ui?.minaFinalCall?.answer) ||
    runtime.endings.some((ending) =>
      ending.startsWith("受話器の向こうで、") ||
      ending.startsWith("今すぐ答えを出さなくてもいい。") ||
      ending.startsWith("答えを待つ静かな時間。")
    );
}

/** User-initiated recovery for missed/vanished calls. Never bypass puzzles. */
export function dialMinaFinalCall(runtime: Runtime): Runtime {
  if (!isMinaFinalCallReady(runtime) || isMinaFinalCallComplete(runtime) ||
      runtime.incomingCall) return runtime;
  return {
    ...runtime,
    incomingCall: {
      caller: "Jeongyeon",
      target: "mina-story-final-call",
      status: "ringing",
    },
    clues: runtime.clues.includes(minaClueKeys.finalCallOffered)
      ? runtime.clues
      : [...runtime.clues, minaClueKeys.finalCallOffered],
    ui: {
      ...runtime.ui,
      minaFinalCall: { ...runtime.ui?.minaFinalCall, step: 0 },
    },
    notifications: runtime.notifications.filter((notice) =>
      notice !== "Phone: Jeongyeon · 不在着信（タップして折り返す）" &&
      notice !== "Phone: 不明な番号 · 不在着信（タップして折り返す）"
    ),
  };
}

/** Arrival text follows the conversation already stored on this phone. */
function minaChatArrivals(runtime: Runtime) {
  const chatUi = runtime.ui?.kakao;
  const sanaTurns = parseSanaAdaptiveTurns(Array.isArray(chatUi?.minaSanaChatTurns) ? chatUi.minaSanaChatTurns : []);
  const jeongyeonTurns = parseJeongyeonTurns(Array.isArray(chatUi?.minaJeongyeonChatTurns) ? chatUi.minaJeongyeonChatTurns : []);
  const sanaArrival = sanaTurns.length
    ? sanaTurns.some((turn) => /^(phone-|identity-evasive)/u.test(turn.topic))
      ? "さっきの話、ちゃんと読んだよ。今このスマホを持っている人と話してるんだね。返す方法、一緒に考えよう。"
      : "さっきの話の続き、聞いてもいい？無理に話さなくても大丈夫だよ。"
    : "みーたん、まだ起きてる？";
  const giftArrival = jeongyeonTurns.length
    ? { body: "아, 그리고 미나가 전에 직접 만들던 작은 게 있었어요. 그 일도 확인하고 싶으니, 연락이 닿으면 저한테 연락해 달라고 전해 주세요.", zh: "对了，米娜之前一直在亲手做一件小东西。那件事我也想确认一下；如果联系上她，请转告她联系我。" }
    : { body: "야, 그거 이번엔 성공했어?ㅋㅋ", zh: "喂，这次那个终于做成功了吗？哈哈" };
  return { sanaArrival, giftArrival, earlySana: sanaTurns.some(turn => turn.beforePrompt), earlyJeongyeon: jeongyeonTurns.some(turn => !turn.afterGift) };
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
  let normalized = changed ? { ...runtime, date, messages } : runtime;
  // Old saved games sometimes retain the abandoned first-draft ending and
  // its modal overlay, preventing the 2025 finale from ever appearing.
  const discardedTargets = ["choose-call", "choose-together"];
  const discardedEndings = ["同じ夜に帰る｜", "おやすみに、返事がある｜"];
  if (normalized.choices.some((choice) => discardedTargets.includes(choice.target)) ||
      normalized.endings.some((ending) => discardedEndings.some((prefix) => ending.startsWith(prefix)))) {
    normalized = {
      ...normalized,
      choices: normalized.choices.filter((choice) => !discardedTargets.includes(choice.target)),
      endings: normalized.endings.filter((ending) => !discardedEndings.some((prefix) => ending.startsWith(prefix))),
    };
    changed = true;
  }
  // Rebuild the clue marker for players who actually opened the final note
  // on earlier builds before the call trigger was fixed.
  const noteWasRead = normalized.read.includes("mina-story-unsent-2025");
  const letterWasUnlocked = (normalized.messages.notes ?? []).some((item) =>
    item.id === "mina-story-unsent-2025");
  const recoveredClues = [
    ...(letterWasUnlocked && !normalized.clues.includes(minaClueKeys.unsentReunionReady)
      ? [minaClueKeys.unsentReunionReady] : []),
    ...(noteWasRead && !normalized.clues.includes(minaClueKeys.finalLetterRead)
      ? [minaClueKeys.finalLetterRead] : []),
  ];
  if (recoveredClues.length) {
    normalized = { ...normalized, clues: [...normalized.clues, ...recoveredClues] };
    changed = true;
  }
  const genuineFinaleUnlocked = isMinaFinalCallReady(normalized);
  const obsoleteCall =
    normalized.incomingCall?.target === "call-evening" ||
    (normalized.incomingCall?.target === "mina-story-final-call" &&
      !genuineFinaleUnlocked);
  const earlyFinalMarker =
    !genuineFinaleUnlocked &&
    normalized.clues.includes(minaClueKeys.finalCallOffered);
  if (obsoleteCall || earlyFinalMarker) {
    normalized = {
      ...normalized,
      incomingCall: obsoleteCall ? null : normalized.incomingCall,
      clues: normalized.clues.filter((clue) => clue !== minaClueKeys.finalCallOffered),
      ui: obsoleteCall
        ? { ...normalized.ui, minaFinalCall: { step: 0 } }
        : normalized.ui,
      notifications: normalized.notifications.filter((notice) =>
        notice !== "Phone: Jeongyeon · 不在着信（タップして折り返す）" &&
        notice !== "Phone: 不明な番号 · 不在着信（タップして折り返す）"
      ),
    };
    changed = true;
  }
  if (normalized.incomingCall?.target === "mina-story-final-call" &&
      !normalized.clues.includes(minaClueKeys.finalCallOffered)) {
    normalized = {
      ...normalized,
      clues: [...normalized.clues, minaClueKeys.finalCallOffered],
    };
    changed = true;
  }
  // The old script also added "君 ♡ 来电". The normalized event
  // adds "Jeongyeon 来电". Both are redundant because the incoming-call
  // screen is already visible. Remove them only for this finale.
  if (normalized.incomingCall?.target === "mina-story-final-call" &&
      normalized.notifications.includes("Jeongyeon 来电")) {
    normalized = {
      ...normalized,
      notifications: normalized.notifications.filter((notice) => notice !== "Jeongyeon 来电"),
    };
    changed = true;
  }
  // Do not leave an unrelated ghost notification after the caller is migrated.
  if (normalized.notifications.some((notice) =>
    /^(?:君|💗|♡)(?:\s*♡)?\s*来电$/u.test(notice.trim()) ||
    notice === "君 ♡ 来电"
  )) {
    normalized = {
      ...normalized,
      notifications: normalized.notifications.filter((notice) =>
        !/^(?:君|💗|♡)(?:\s*♡)?\s*来电$/u.test(notice.trim()) &&
        notice !== "君 ♡ 来电"
      ),
    };
    changed = true;
  }
  // Normalize the earlier anonymous-number variant: the call really comes
  // from Jeongyeon's borrowed phone, with Mina speaking after answer.
  if (normalized.incomingCall?.target === "mina-story-final-call" &&
      normalized.incomingCall.caller === "不明な番号") {
    normalized = {
      ...normalized,
      incomingCall: { ...normalized.incomingCall, caller: "Jeongyeon" },
    };
    changed = true;
  }
  const oldMissed = "Phone: 不明な番号 · 不在着信（タップして折り返す）";
  if (normalized.notifications.includes(oldMissed)) {
    normalized = {
      ...normalized,
      notifications: normalized.notifications.map((notice) =>
        notice === oldMissed
          ? "Phone: Jeongyeon · 不在着信（タップして折り返す）"
          : notice,
      ),
    };
    changed = true;
  }

  // Repair the stale late-arriving question in existing saves too, keeping
  // IDs/read receipts and every player message rather than sending it again.
  const arrivals = minaChatArrivals(normalized);
  const repairedKakao = (normalized.messages.kakao ?? []).map(item => {
    if (arrivals.earlyJeongyeon && item.id === "mina-story-jeongyeon-gift-ping" && item.body === "야, 그거 이번엔 성공했어?ㅋㅋ")
      return { ...item, body: arrivals.giftArrival.body, meta: { ...item.meta, zh: arrivals.giftArrival.zh } };
    if (arrivals.earlySana && item.id === "mina-story-cafe-sana-ping" && item.body === "みーたん、まだ起きてる？")
      return { ...item, body: arrivals.sanaArrival };
    return item;
  });
  if (repairedKakao.some((item, i) => item !== normalized.messages.kakao[i]))
    normalized = { ...normalized, messages: { ...normalized.messages, kakao: repairedKakao }, notifications: normalized.notifications.map(notice =>
      arrivals.earlyJeongyeon && notice === "KakaoTalk: Jeongyeon：야, 그거 이번엔 성공했어?ㅋㅋ" ? "KakaoTalk: Jeongyeon：" + arrivals.giftArrival.body :
      arrivals.earlySana && notice === "KakaoTalk: Sana：みーたん、まだ起きてる？" ? "KakaoTalk: Sana：" + arrivals.sanaArrival : notice) };

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
  const { sanaArrival, giftArrival } = minaChatArrivals(runtime);

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
        "KakaoTalk: Sana：" + sanaArrival,
      ];
    }
    if (!(messages.kakao ?? []).some((m) => m.id === "mina-story-cafe-sana-ping")) {
      const currentDate = (runtime.date || "2025-11-09").replace(/^2026-11-/u, "2025-11-");
      const currentTime = runtime.time || "21:09";
      const ping = makeItem({
        id: "mina-story-cafe-sana-ping",
        title: "Sana",
        sender: "Sana",
        body: sanaArrival,
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
      notifications = [...notifications, "KakaoTalk: Jeongyeon：" + giftArrival.body];
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
        body: giftArrival.body,
        time: `${(runtime.date || "2025-11-09").replace(/^2026-11-/u, "2025-11-")} ${runtime.time || "21:09"}`,
        outgoing: false,
        read: false,
        folder: "聊天",
        meta: { story: "gift-ping", zh: giftArrival.zh },
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
        clues.includes(minaClueKeys.safariResearchSeen) ||
        clues.includes(minaClueKeys.legoPhotoSeen)) &&
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

  // Reaching the last LINE message and resolving the LEGO clue is enough to
  // find the 2025 unsent draft. Summer photos/Spotify remain optional discoveries,
  // rather than hidden mandatory taps that strand players before the ending.
  if (clues.includes(minaClueKeys.giftTrailResolved) &&
      clues.includes(minaClueKeys.lineBreakupSeen))
    addLetter("reunion", minaClueKeys.unsentReunionReady);

  // The final call is never presented just because a note was unlocked.
  // A must actually read Mina's last unsent draft AND discover the pinned 💗
  // contact. Either exploration order works and existing saves remain valid.
  // Jeongyeon lends Mina a different handset to call her own lost phone.
  const finalCallReady =
    clues.includes(minaClueKeys.unsentReunionReady) &&
    clues.includes(minaClueKeys.heartThreadSeen) &&
    clues.includes(minaClueKeys.finalLetterRead) &&
    (messages.notes ?? []).some((item) => item.id === "mina-story-unsent-2025");
  let incomingCall = runtime.incomingCall;
  if (finalCallReady && !clues.includes(minaClueKeys.finalCallOffered) &&
      !isMinaFinalCallComplete(runtime) && !incomingCall) {
    clues.push(minaClueKeys.finalCallOffered);
    incomingCall = {
      caller: "Jeongyeon",
      target: "mina-story-final-call",
      status: "ringing",
    };
    changed = true;
  }

  return changed ? { ...runtime, clues, messages, notifications, incomingCall } : runtime;
}
