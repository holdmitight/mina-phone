import { makeItem, type Runtime, type Work } from "../schema";

export const minaClueKeys = {
  cafeVisit: "mina:map:cafe-visit",
  jeongyeonTalk: "mina:kakao:jeongyeon",
  sanaTalk: "mina:kakao:sana",
  oldLine: "mina:line:2014",
  balletDetails: "mina:photos:ballet-info",
  cafeResolved: "mina:unlocked:cafe-crosscheck",
  memoryResolved: "mina:unlocked:rain-draft",
} as const;

export function isMinaStoryWork(work: Work): boolean {
  return (
    work.phone.owner === "名井南" &&
    (work.data.maps ?? []).some((item) => item.id === "maps-cafe") &&
    (work.data.kakao ?? []).some((item) => item.id === "kaka-sana-1")
  );
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
  if (runtime.clues.includes(clue)) return runtime;

  const clues = [...runtime.clues, clue];
  let next: Runtime = { ...runtime, clues };

  const cafeLinked =
    clues.includes(minaClueKeys.cafeVisit) &&
    clues.includes(minaClueKeys.jeongyeonTalk);
  if (cafeLinked && !clues.includes(minaClueKeys.cafeResolved)) {
    clues.push(minaClueKeys.cafeResolved);
    const currentDate = runtime.date || "2026-11-09";
    const currentTime = runtime.time || "21:09";
    const newMessage = makeItem({
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
    next = {
      ...next,
      clues,
      messages: {
        ...next.messages,
        kakao: [...(next.messages.kakao ?? []), newMessage],
      },
      notifications: [
        ...next.notifications,
        "KakaoTalk: Sana：みーたん、まだ起きてる？",
      ],
    };
  }

  const memoryLinked =
    clues.includes(minaClueKeys.oldLine) &&
    clues.includes(minaClueKeys.balletDetails);
  if (memoryLinked && !clues.includes(minaClueKeys.memoryResolved)) {
    clues.push(minaClueKeys.memoryResolved);
    const newNote = makeItem({
      id: "mina-story-rain-unsent-note",
      title: "書きかけ",
      body: "雨が強い。\n\n……今なら、ちゃんと言えるのに。",
      time: "2026-11-09 20:41",
      sender: "名井南",
      kind: "note",
      folder: "备忘录",
      meta: { story: "unsent-rain" },
    });
    next = {
      ...next,
      clues,
      messages: {
        ...next.messages,
        notes: [...(next.messages.notes ?? []), newNote],
      },
    };
  }
  return next;
}
