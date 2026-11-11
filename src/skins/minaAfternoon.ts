import { makeItem, type Runtime } from "../schema";

export const afternoonStart = "15:47";

const arrivals = [
  { time: "15:58", sender: "Momo", body: "もう練習室出たで。外、思ったより風あるわ。", zh: "我刚出练习室，外面的风比想象中大呢。" },
  { time: "16:46", sender: "Jihyo", body: "오늘 연습 영상 올려 놨어. 내일 봐도 돼!", zh: "今天的练习视频我传好了，明天再看也行！" },
  { time: "17:05", sender: "Nayeon", body: "나 이제 집이야. 나갈 거면 겉옷 챙겨 ㅎㅎ", zh: "我到家啦。要出门的话，记得带件外套，哈哈。" },
] as const;

export function afternoonTime(state: Runtime): string {
  if (state.clues.includes("mina:final-call:offered") || state.ui?.minaFinalCall?.answer) return "17:16";
  if (state.read.includes("note-draft") || state.clues.includes("mina:notes:final-draft-read")) return "17:05";
  if (state.clues.includes("mina:unlocked:gift-trail")) return "16:54";
  if (state.clues.includes("mina:kakao:jeongyeon-gift-read")) return "16:46";
  if (state.clues.includes("mina:kakao:sana-finished")) return "16:34";
  if (state.clues.includes("mina:unlocked:cafe-crosscheck")) return "16:18";
  if (state.read.includes("note-pinned")) return "16:08";
  if (state.clues.includes("mina:map:cafe-visit") || state.visited.some(app => ["notes","kakao","line","maps"].includes(app))) return "15:58";
  return afternoonStart;
}

export function advanceMinaAfternoon(state: Runtime): Runtime {
  const previous = String(state.ui?.minaAfternoon?.time || afternoonStart);
  const reached = afternoonTime(state);
  const time = previous > reached ? previous : reached;
  const stamps = state.ui?.minaNoticeTimes ?? {};
  if (state.notifications.every(notice => typeof stamps[notice] === "string") && previous === time && state.time === time && state.ui?.minaAfternoon?.time === time) return state;
  const arrived = arrivals.filter(entry => previous < entry.time && entry.time <= time);
  const messages = arrived.map(entry => makeItem({
    id: "mina-afternoon-" + entry.sender, title: entry.sender, sender: entry.sender,
    body: entry.body, time: state.date + " " + entry.time, folder: "聊天",
    read: false, outgoing: false, meta: { zh: entry.zh },
  }));
  const noticeTimes = { ...stamps };
  for (const notice of state.notifications) noticeTimes[notice] ??= time;
  for (const entry of arrived) noticeTimes["KakaoTalk: " + entry.sender + "：" + entry.body] = entry.time;
  return { ...state, time, ui: { ...state.ui, minaAfternoon: { time }, minaNoticeTimes: noticeTimes },
    messages: messages.length ? { ...state.messages, kakao: [...(state.messages.kakao ?? []), ...messages] } : state.messages,
    notifications: [...state.notifications, ...arrived.map(entry => "KakaoTalk: " + entry.sender + "：" + entry.body)],
  };
}
