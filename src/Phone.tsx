import { ja } from "./i18n";
import { StatusGlyph } from "./ios/StatusGlyph";
import { SocialDetail, socialDetailApps } from "./skins/SocialDetails";
import { NativeCalculator } from "./ios/Calculator";
import { HomeLauncher } from "./launcher/HomeLauncher";
import { useDeviceLayout } from "./launcher/layout";
import "./launcher/launcher.css";
import { NativeDetail, nativeDetailApps } from "./ios/Details";
import "./ios/details.css";
import {
  SystemNotifications,
  notificationContent,
} from "./SystemNotifications";
import {
  readLauncherOrigin,
  AppWindow,
  screenOrigin,
} from "./vendor/ios-web/Launcher";
import {
  DeviceLock,
  ControlCenter,
  DeviceKeyboard,
  KeyboardContext,
  NativeSettings,
} from "./DeviceSystem";
import { AppArtwork, hasNativeArtwork } from "./AppArtwork";
import { getFields } from "./fields";
import { catalogSkins } from "./skins/catalog";
import { dialMinaFinalCall, discoverMinaClue, isMinaFinalCallComplete, isMinaFinalCallReady, isMinaStoryWork, normalizeMinaStoryWork, normalizeMinaStoryRuntime, minaClueKeys } from "./skins/minaStoryInteractions";
import { MinaFinalCallScript, minaFinalCallLines, minaFinalCallOutcomes, minaFinalMissedCallNotice, playMinaFinalLine, stopMinaFinalSpeech, type MinaFinalCallChoice } from "./skins/MinaFinalCall";
import "./skins/minaFinalCall.css";
import "./skins/skins.css";
import "./ios18.css";
import "./device-system.css";
import "./ios/tokens.css";
import "./ios/reference.css";
import "./ios/status-bar.css";
import { WeChatSkin, WhatsAppSkin } from "./AppSkins";
import { RichText } from "./RichText";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  Suspense,
  type CSSProperties,
} from "react";
import { AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Plus,
  Search,
  LockKeyhole,
  Heart,
  MessageCircle,
  MoreHorizontal,
  ArrowUp,
  Folder,
  Phone as PhoneIcon,
} from "lucide-react";
import { getApp, type AppPlugin } from "./registry";
import {
  initialRuntime,
  safeMedia,
  type Work,
  type Item,
  type Runtime,
  type UiValue,
} from "./schema";
import { dispatch, choose, visible, advance } from "./engine";
import { db } from "./persistence";
export function AppIcon({
  id,
  name,
  small = false,
  custom = "",
  date,
  time,
}: {
  id: string;
  name?: string;
  small?: boolean;
  custom?: string;
  date?: string;
  time?: string;
}) {
  const a = getApp(id);
  const Icon = a.icon;
  return (
    <span className={`app-icon-wrap ${small ? "small" : ""}`} data-app-icon={id}>
      <span className="app-icon" style={{ background: a.color }}>
        {custom ? (
          safeMedia(custom) ? (
            <img src={safeMedia(custom)} alt="カスタムアイコン" />
          ) : (
            <span>{custom.slice(0, 2)}</span>
          )
        ) : hasNativeArtwork(id) ? (
          <AppArtwork id={id} date={date} time={time} />
        ) : (
          <Icon size={small ? 21 : 28} strokeWidth={1.65} />
        )}
      </span>
      {name && <span className="app-name">{ja(name)}</span>}
    </span>
  );
}
type PhoneProps = Omit<Parameters<typeof PhoneRuntime>[0], "deviceLayout">;
export function Phone(props: PhoneProps) {
  // Keep Mina's authored fiction intact. Standalone playthroughs intentionally
  // restart whenever the player reloads; authoring data is not affected.
  const narrativeWork = useMemo(
    () => props.creator ? props.work : normalizeMinaStoryWork(props.work),
    [props.work, props.creator],
  );
  const deviceLayout = useDeviceLayout(narrativeWork, props.creator);
  return (
    <PhoneRuntime
      {...props}
      work={deviceLayout.work}
      deviceLayout={deviceLayout}
    />
  );
}
function PhoneRuntime({
  deviceLayout,
  work,
  creator = false,
  onEdit,
  onAdd,
  onSettings,
  onOpen,
  runtime: external,
  onRuntime,
}: {
  deviceLayout: ReturnType<typeof useDeviceLayout>;
  work: Work;
  creator?: boolean;
  onEdit?: (app: string, item: Item) => void;
  onAdd?: (app: string) => void;
  onSettings?: () => void;
  onOpen?: (app: string) => void;
  runtime?: Runtime;
  onRuntime?: (s: Runtime) => void;
}) {
  const [app, setApp] = useState("");
  const [homeRequest, setHomeRequest] = useState(0);
  const [locked, setLocked] = useState(!creator);
  const [pinOpen, setPinOpen] = useState(false);
  const [quickCamera, setQuickCamera] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const appSnapshots = useRef(new Map<string, HTMLElement>());
  const [banner, setBanner] = useState("");
  const [noticeThread, setNoticeThread] = useState<{
    appId: string;
    thread: string;
    seq: number;
  } | null>(null);
  const noticesSeen = useRef(0);
  const [contextApp, setContextApp] = useState("");
  const [deviceScale, setDeviceScale] = useState(0.84);
  const shell = useRef<HTMLDivElement>(null);
  const gesture = useRef({ x: 0, y: 0, time: 0, zone: "" });
  const [launchOrigin, setLaunchOrigin] = useState(screenOrigin);

  const beginUnlock = () => {
    setPinError("");
    setQuickCamera(false);
    if (work.phone.passcode) setPinOpen(true);
    else unlock();
  };
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const gestureConsumed = useRef(false);
  const [pinError, setPinError] = useState("");
  const [folder, setFolder] = useState("");
  const [panel, setPanel] = useState("");
  const normalizeStorySave = (value: Runtime) =>
    !creator && isMinaStoryWork(work) ? normalizeMinaStoryRuntime(value) : value;
  // Standalone players are ephemeral: start from the opening event on every
  // page load. No stored chat messages, clues, call states or endings survive.
  // The Studio's externally controlled runtime and creator preview are intact.
  const [own, setOwn] = useState(() => {
    const started = normalizeStorySave(creator || external
      ? initialRuntime(work)
      : dispatch(work, initialRuntime(work), "start"));
    // Dedicated, unlisted creator QA route. The normal phone game still
    // requires players to discover the LEGO promise and final letter.
    // Never save this state: reloads normally begin from the opening scene.
    if (creator || external || !isMinaStoryWork(work) ||
        typeof window === "undefined" ||
        new URLSearchParams(window.location.search).get("finale") !== "preview") {
      return started;
    }
    let preview = started;
    for (const clue of [
      minaClueKeys.legoPromiseSeen,
      minaClueKeys.lineBreakupSeen,
      minaClueKeys.amazonPartsSeen,
      minaClueKeys.heartThreadSeen,
      minaClueKeys.finalLetterRead,
    ]) preview = discoverMinaClue(preview, clue);
    return normalizeStorySave(preview);
  });
  const ready = true;
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const fit = () => {
      setDeviceScale(
        Math.max(
          0.4,
          Math.min(
            1,
            (el.parentElement!.clientWidth - 24) / 407,
            (window.innerHeight - (creator ? 170 : external ? 150 : 40)) / 866,
          ),
        ),
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement!);
    window.addEventListener("resize", fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [creator, ready]);
  const s = external ?? own;
  const runtimeRef = useRef(s);
  runtimeRef.current = s;
  const update = (next: Runtime) => {
    const normalized = normalizeStorySave(next);
    runtimeRef.current = normalized;
    setOwn(normalized);
    onRuntime?.(normalized);
  };
  useEffect(() => {
    // Remove old per-story saves previously written by this game. We do not
    // read or write saves for player sessions anymore.
    if (creator || external) return;
    void db.saves.delete(work.id).catch(() => {
      // Private browsing may disable IndexedDB. This must never block play.
    });
  }, [work.id, creator, external]);
  useEffect(() => {
    if (creator || !ready) return;
    const interval = setInterval(() => {
      const previous = runtimeRef.current;
      const next = advance(work, previous, 1000);
      runtimeRef.current = next;
      const changed =
        next.time !== previous.time ||
        next.trace.join() !== previous.trace.join() ||
        (next.scheduled?.length ?? 0) !== (previous.scheduled?.length ?? 0) ||
        (next.scheduled?.length ?? 0) > 0 ||
        Math.floor((next.elapsedMs ?? 0) / 5000) !==
          Math.floor((previous.elapsedMs ?? 0) / 5000);
      if (changed) update(next);
    }, 1000);
    return () => clearInterval(interval);
  }, [creator, ready, work.id, work.updatedAt]);
  const event = (event: string, target: string) => {
    if (!creator) update(dispatch(work, runtimeRef.current, event, target));
  };
  const recordMinaClue = (clue: string) => {
    if (creator || !isMinaStoryWork(work)) return;
    const previous = runtimeRef.current;
    const next = discoverMinaClue(previous, clue);
    if (next !== previous) update(next);
  };
  const captureApp = () => {
    if (!app) return;
    const current = shell.current?.querySelector<HTMLElement>(".app-screen");
    if (!current) return;
    const snapshot = current.cloneNode(true) as HTMLElement;
    snapshot.style.transform = "none";
    snapshot.style.opacity = "1";
    snapshot.style.filter = "none";
    snapshot.style.borderRadius = "0";
    snapshot.querySelectorAll("audio").forEach((el) => el.remove());
    snapshot.querySelectorAll("video").forEach((el) => {
      el.removeAttribute("autoplay");
      el.removeAttribute("src");
    });
    snapshot.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    appSnapshots.current.set(app, snapshot);
    for (const id of appSnapshots.current.keys())
      if (!recent.includes(id) && id !== app) appSnapshots.current.delete(id);
  };
  const open = (id: string) => {
    if (!work.apps.some((a) => a.id === id && a.installed)) return;
    setApp(id);
    setKeyboard(false);
    setRecent((v) => [id, ...v.filter((a) => a !== id)].slice(0, 8));
    setFolder("");
    setPanel("");
    onOpen?.(id);
    event("openApp", id);
  };
  const openFromNotification = (notice: string) => {
    if (locked) {
      beginUnlock();
      return;
    }
    if (notice === minaFinalMissedCallNotice && isMinaStoryWork(work) && isMinaFinalCallReady(runtimeRef.current)) {
      const current = runtimeRef.current;
      update({
        ...current,
        incomingCall: {
          caller: "Jeongyeon",
          target: "mina-story-final-call",
          status: "ringing",
        },
        notifications: current.notifications.filter((entry) => entry !== notice),
      });
      setApp("");
      setPanel("");
      return;
    }
    const target = notificationContent(notice, work.apps).appId;
    if (work.apps.some((a) => a.id === target && a.installed)) {
      if (target === "kakao") {
        const thread = notice.includes("Sana：")
          ? "Sana"
          : notice.includes("Jeongyeon：")
            ? "Jeongyeon"
            : null;
        if (thread) setNoticeThread((previous) => ({
          appId: target,
          thread,
          seq: (previous?.seq ?? 0) + 1,
        }));
      }
      open(target);
    } else if (work.apps.some((a) => a.id === "messages" && a.installed)) {
      open("messages");
    } else {
      setPanel("notification");
    }
  };
  const installedApps = work.apps.filter((a) => a.installed);
  const apps = installedApps.filter((a) => a.visible);
  const unlock = (pin = "") => {
    if (!work.phone.passcode || pin === work.phone.passcode) {
      setLocked(false);
      setPinOpen(false);
      event("password", pin);
    } else {
      setPinError("パスコードが違います");
      setPinOpen(true);
    }
  };
  useEffect(() => {
    if (app && !work.apps.some((a) => a.id === app && a.installed)) setApp("");
  }, [app, work.apps]);
  const displayTime = creator ? work.phone.time : s.time || work.phone.time;
  const plugin = getApp(app);
  useEffect(() => {
    const count = s.notifications.length;
    if (!locked && work.phone.notifications && count > noticesSeen.current) {
      setBanner(s.notifications.at(-1) || "");
      const timer = setTimeout(() => setBanner(""), 4500);
      noticesSeen.current = count;
      return () => clearTimeout(timer);
    }
    noticesSeen.current = count;
  }, [s.notifications.length, locked, work.phone.notifications]);
  const dismissNotice = (index: number) =>
    update({
      ...runtimeRef.current,
      notifications: runtimeRef.current.notifications.filter(
        (_, i) => i !== index,
      ),
    });
  return (
    <div
      ref={shell}
      style={{ "--phone-scale": deviceScale } as CSSProperties}
      className={`phone-shell ios18 ${work.phone.theme === "dark" ? "dark-phone" : ""}`}
    >
      <KeyboardContext.Provider value={setKeyboard}>
        <div
          className={`phone-screen wallpaper-${work.phone.wallpaper} ${locked ? "is-locked" : ""} ${app ? "in-app" : ""} ${keyboard ? "keyboard-open" : ""}`}
          data-app={app}
          onDragStart={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            gestureConsumed.current = false;
            const button = (e.target as HTMLElement).closest<HTMLElement>(
              "[data-app-id]",
            );
            if (button) {
              pressTimer.current = setTimeout(() => {
                gestureConsumed.current = true;
                setContextApp(button.dataset.appId || "");
              }, 550);
            }
            const box = e.currentTarget.getBoundingClientRect(),
              x = (e.clientX - box.left) / deviceScale,
              y = (e.clientY - box.top) / deviceScale;
            gesture.current = {
              x,
              y,
              time: Date.now(),
              zone: y < 58 ? "top" : y > 818 ? "bottom" : locked ? "lock" : "",
            };
          }}
          onPointerMove={(e) => {
            if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5)
              clearTimeout(pressTimer.current);
          }}
          onPointerCancel={() => clearTimeout(pressTimer.current)}
          onPointerUp={(e) => {
            clearTimeout(pressTimer.current);
            const box = e.currentTarget.getBoundingClientRect(),
              y = (e.clientY - box.top) / deviceScale,
              g = gesture.current;
            const dy = y - g.y;
            if (g.zone === "top" && dy > 65)
              setPanel(g.x > 230 ? "control" : "notification");
            else if ((g.zone === "bottom" || g.zone === "lock") && dy < -55) {
              gestureConsumed.current = true;
              if (!locked) captureApp();
              setKeyboard(false);
              if (panel) {
                setPanel("");
              } else if (locked) {
                beginUnlock();
              } else if (g.zone === "bottom" && Date.now() - g.time > 450) {
                captureApp();
                setPanel("switcher");
              } else {
                setApp("");
                setPanel("");
                setFolder("");
              }
            }
          }}
          onClickCapture={(e) => {
            const target = (e.target as HTMLElement).closest(
              ".home-app-grid button,.dock button",
            );
            if (target) {
              setLaunchOrigin(
                readLauncherOrigin(target as HTMLElement, e.currentTarget),
              );
            }
          }}
        >
          <div className="wallpaper-orb orb-one" />
          <div className="wallpaper-orb orb-two" />
          <div className="status-bar">
            <button
              onClick={() =>
                setPanel(panel === "notification" ? "" : "notification")
              }
              className="status-time"
              aria-label="通知センター"
            >
              {displayTime}
              <StatusGlyph kind="silent" />
            </button>
            <div className="dynamic-island" />
            <button
              className="signals"
              onClick={() => setPanel(panel === "control" ? "" : "control")}
              aria-label="コントロールセンター"
            >
              <StatusGlyph kind="cellular" />
              <StatusGlyph kind="wifi" />
              <span
                className={`ios-battery${work.phone.battery <= 20 ? " low-battery" : ""}`}
              >
                <span style={{ width: `${work.phone.battery}%` }} />
                <b>{work.phone.battery}</b>
              </span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {locked && !(quickCamera && app === "camera") ? (
              <DeviceLock
                work={
                  s.date
                    ? { ...work, phone: { ...work.phone, date: s.date } }
                    : work
                }
                time={displayTime}
                notices={s.notifications}
                onDismiss={dismissNotice}
                pinOpen={pinOpen}
                setPinOpen={setPinOpen}
                error={pinError}
                onUnlock={unlock}
                onLight={() => setPanel("light")}
                onCamera={() => {
                  setQuickCamera(true);
                  open("camera");
                }}
              />
            ) : app && app !== "appstore" ? (
              <AppWindow
                key={app}
                className={`app-screen engine-${plugin.engine} skin-${app}`}
                creator={creator}
                origin={launchOrigin}
              >
                <AppContent
                  app={plugin}
                  name={
                    work.apps.find((a) => a.id === app)?.name ?? plugin.name
                  }
                  items={[
                    ...(work.data[app] ?? []),
                    ...(s.messages[app] ?? []),
                  ]}
                  creator={creator}
                  state={s}
                  onRead={(id) => event("read", id)}
                  onClue={recordMinaClue}
                  noticeThread={noticeThread}
                  onNoticeThreadHandled={() => setNoticeThread(null)}
                  onEdit={(item) => onEdit?.(app, item)}
                  onAdd={() => onAdd?.(app)}
                  onBack={() => setApp("")}
                  onSettings={onSettings}
                  onUi={(key, value) => {
                    const current = runtimeRef.current;
                    update(
                      dispatch(
                        work,
                        {
                          ...current,
                          ui: {
                            ...current.ui,
                            [app]: { ...current.ui?.[app], [key]: value },
                          },
                        },
                        "variable",
                        `ui:${app}:${key}`,
                      ),
                    );
                  }}
                  work={work}
                />
              </AppWindow>
            ) : (
              <HomeLauncher
                key={
                  "home-" + homeRequest + (app === "appstore" ? "store" : "")
                }
                storeOpen={app === "appstore"}
                closeStore={() => setApp("")}
                work={work}
                layout={deviceLayout.layout}
                change={deviceLayout.change}
                importLayout={deviceLayout.importLayout}
                error={deviceLayout.error}
                open={open}
                onFolder={setFolder}
                search={() => setPanel("search")}
                time={displayTime}
                icon={(a, small) => (
                  <AppIcon
                    key={a.id}
                    id={a.id}
                    name={small ? undefined : a.name}
                    small={small}
                    custom={a.icon}
                    date={s.date || work.phone.date}
                    time={s.time}
                  />
                )}
                clearApp={(id) =>
                  update({
                    ...runtimeRef.current,
                    messages: Object.fromEntries(
                      Object.entries(runtimeRef.current.messages).filter(
                        ([app]) => app !== id,
                      ),
                    ),
                  })
                }
              />
            )}
          </AnimatePresence>
          {folder && (
            <div className="folder-overlay" onClick={() => setFolder("")}>
              <h2>{folder}</h2>
              <div className="folder-apps" onClick={(e) => e.stopPropagation()}>
                {apps
                  .filter((a) => a.folder === folder)
                  .map((a) => (
                    <button key={a.id} onClick={() => open(a.id)}>
                      <AppIcon id={a.id} name={a.name} custom={a.icon} />
                    </button>
                  ))}
              </div>
              <button className="glass-btn" onClick={() => setFolder("")}>
                フォルダを閉じる
              </button>
            </div>
          )}
          {panel === "control" && (
            <ControlCenter
              battery={work.phone.battery}
              network={work.phone.network}
              close={() => setPanel("")}
            />
          )}
          {panel && panel !== "control" && panel !== "switcher" && (
            <div
              className={`system-panel ${panel === "light" ? "flash-on" : ""}`}
            >
              <button className="panel-close" onClick={() => setPanel("")}>
                閉じる <ChevronLeft size={14} />
              </button>
              {panel === "notification" ? (
                <>
                  <h2>通知センター</h2>
                  {work.phone.notifications && s.notifications.length ? (
                    <SystemNotifications
                      notices={s.notifications}
                      apps={work.apps}
                      onOpen={(index) => {
                        setPanel("");
                        openFromNotification(s.notifications[index] || "");
                      }}
                      onDismiss={dismissNotice}
                    />
                  ) : (
                    <p>新しい通知はありません</p>
                  )}
                </>
              ) : panel === "search" ? (
                <>
                  <h2>アプリを検索</h2>
                  <AppSearch apps={installedApps} open={open} />
                </>
              ) : (
                <h2>フラッシュライトはオンです</h2>
              )}
            </div>
          )}
          {!creator && !locked && isMinaStoryWork(work) &&
            isMinaFinalCallReady(s) && !isMinaFinalCallComplete(s) &&
            !s.incomingCall && (
              <div className="mina-final-call-dial" role="region" aria-label="最終電話をかける">
                <span className="mina-final-call-dial-label">Jeongyeon · 最後の着信</span>
                <button type="button" onClick={() => {
                  const next = dialMinaFinalCall(runtimeRef.current);
                  if (next !== runtimeRef.current) {
                    stopMinaFinalSpeech();
                    update(next);
                    setApp("");
                    setPanel("");
                  }
                }}>
                  <PhoneIcon size={19} />
                  <span>電話に出る・折り返す <small>接听／回拨最后的电话</small></span>
                </button>
              </div>
            )}
          {!creator && s.choices.length > 0 && !locked && (
            <div className="story-overlay">
              <span className="eyebrow">この先は、あなた次第</span>
              <h3>どうしますか？</h3>
              {s.choices.map((c) => (
                <button
                  key={c.target}
                  onClick={() => update(choose(work, s, c.target))}
                >
                  {c.label}
                  <ArrowUp size={15} />
                </button>
              ))}
            </div>
          )}
          {!creator && s.endings.length > 0 && !locked && (
            <div className="story-overlay ending">
              <span className="eyebrow">エンディング · {s.endings.length}</span>
              <h2>今夜の物語は、ここまで。</h2>
              <p>{s.endings[s.endings.length - 1]}</p>
              <button
                onClick={() => {
                  update(dispatch(work, initialRuntime(work), "start"));
                  setApp("");
                  setLocked(true);
                }}
              >
                最初からやり直す
              </button>
            </div>
          )}
          {!creator && s.incomingCall && (
            <div className="incoming-call-screen">
              <small>
                {s.incomingCall.status === "ringing" ? "着信" : "通話中"} ·
                作品内のシミュレーション
              </small>
              <div className="incoming-avatar">
                {s.incomingCall.caller.slice(0, 1)}
              </div>
              <h2>{s.incomingCall.caller}</h2>
              {s.incomingCall.status === "answered" &&
                (() => {
                  const record = work.data.phone?.find(
                    (i) => i.id === s.incomingCall?.target,
                  );
                  if (s.incomingCall?.target === "mina-story-final-call" &&
                      isMinaStoryWork(work)) {
                    const currentStep = Number(s.ui?.minaFinalCall?.step ?? 0);
                    return (
                      <MinaFinalCallScript
                        step={currentStep}
                        onAdvance={() => {
                          const runtime = runtimeRef.current;
                          playMinaFinalLine(Math.min(currentStep + 1, minaFinalCallLines.length - 1), minaFinalCallLines[Math.min(currentStep + 1, minaFinalCallLines.length - 1)].ja);
                          update({
                            ...runtime,
                            ui: {
                              ...runtime.ui,
                              minaFinalCall: {
                                ...runtime.ui?.minaFinalCall,
                                step: Math.min(currentStep + 1, minaFinalCallLines.length - 1),
                              },
                            },
                          });
                        }}
                        onChoose={(choice: MinaFinalCallChoice) => {
                          const runtime = runtimeRef.current;
                          const outcome = minaFinalCallOutcomes[choice];
                          playMinaFinalLine(choice, outcome.ja);
                          update({
                            ...runtime,
                            incomingCall: null,
                            ui: {
                              ...runtime.ui,
                              minaFinalCall: {
                                ...runtime.ui?.minaFinalCall,
                                step: minaFinalCallLines.length,
                                answer: choice,
                                response: outcome.ja,
                              },
                            },
                            endings: [...runtime.endings, outcome.epilogue],
                            notifications: runtime.notifications.filter(
                              (entry) => entry !== minaFinalMissedCallNotice,
                            ),
                          });
                        }}
                      />
                    );
                  }
                  return record?.kind === "audio" && safeMedia(record.media) ? (
                    <audio controls src={safeMedia(record.media)} />
                  ) : (
                    <p>これは物語の中の着信です。</p>
                  );
                })()}
              <div className="incoming-actions">
                <button
                  className="decline-call"
                  onClick={() => {
                    const call = runtimeRef.current.incomingCall;
                    if (call) {
                      stopMinaFinalSpeech();
                      const ended = dispatch(
                        work,
                        { ...runtimeRef.current, incomingCall: null },
                        call.status === "ringing" ? "callDeclined" : "callEnded",
                        call.target || call.caller,
                      );
                      const missed = call.target === "mina-story-final-call" &&
                        isMinaStoryWork(work) && !ended.notifications.includes(minaFinalMissedCallNotice);
                      update(missed ? {
                        ...ended,
                        notifications: [...ended.notifications, minaFinalMissedCallNotice],
                      } : ended);
                    }
                  }}
                >
                  <PhoneIcon size={25} />
                  <span>
                    {s.incomingCall.status === "ringing" ? "拒否" : "通話を終了"}
                  </span>
                </button>
                {s.incomingCall.status === "ringing" && (
                  <button
                    className="accept-call"
                    onClick={() => {
                      const call = runtimeRef.current.incomingCall;
                      if (call) {
                        // Start speech directly within the player's tap,
                        // satisfying iOS Safari's user-activation requirement.
                        if (call.target === "mina-story-final-call" && isMinaStoryWork(work)) {
                          const step = Math.min(
                            Math.max(Number(runtimeRef.current.ui?.minaFinalCall?.step ?? 0), 0),
                            minaFinalCallLines.length - 1,
                          );
                          playMinaFinalLine(step, minaFinalCallLines[step].ja);
                        }
                        update(
                          dispatch(
                            work,
                            {
                              ...runtimeRef.current,
                              incomingCall: { ...call, status: "answered" },
                            },
                            "callAnswered",
                            call.target || call.caller,
                          ),
                        );
                      }
                    }}
                  >
                    <PhoneIcon size={25} />
                    <span>応答</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {banner && !locked && (
            <button
              className="device-banner"
              onClick={() => {
                openFromNotification(banner);
                setBanner("");
              }}
            >
              <AppIcon
                id={notificationContent(banner, work.apps).appId}
                small
              />
              <span>
                <strong>{notificationContent(banner, work.apps).title}</strong>
                <span>{notificationContent(banner, work.apps).body}</span>
              </span>
            </button>
          )}
          {panel === "switcher" && (
            <div className="device-switcher">
              <div className="switcher-cards">
                {recent
                  .filter(
                    (id) =>
                      installedApps.some((a) => a.id === id) &&
                      appSnapshots.current.has(id),
                  )
                  .map((id) => (
                    <button
                      className="recent-app-card"
                      key={id}
                      onClick={() => open(id)}
                    >
                      <span className="recent-app-label">
                        <AppIcon id={id} small />
                        <strong>
                          {work.apps.find((a) => a.id === id)?.name}
                        </strong>
                      </span>
                      <span className="recent-app-window">
                        <span
                          className="recent-app-snapshot"
                          aria-hidden="true"
                          inert
                          ref={(el) => {
                            const snapshot = appSnapshots.current.get(id);
                            if (el && snapshot)
                              el.replaceChildren(snapshot.cloneNode(true));
                          }}
                        />
                      </span>
                    </button>
                  ))}
              </div>
              <button className="switcher-done" onClick={() => setPanel("")}>
                完了
              </button>
            </div>
          )}
          {contextApp && (
            <div
              className="home-context-shade"
              onClick={() => setContextApp("")}
            >
              <div className="home-context-menu">
                <AppIcon id={contextApp} />
                <strong>
                  {ja(work.apps.find((a) => a.id === contextApp)?.name || "")}
                </strong>
                <button
                  onClick={() => {
                    open(contextApp);
                    setContextApp("");
                  }}
                >
                  アプリを開く
                </button>
                <button
                  onClick={() => {
                    setContextApp("");
                    setPanel("search");
                  }}
                >
                  Appライブラリで表示
                </button>
                <button onClick={() => setContextApp("")}>キャンセル</button>
              </div>
            </div>
          )}
          {keyboard && <DeviceKeyboard close={() => setKeyboard(false)} />}
          <button
            className="home-indicator"
            aria-label="ホーム画面に戻る"
            onClick={() => {
              if (gestureConsumed.current) return;
              if (locked) {
                beginUnlock();
                return;
              }
              captureApp();
              setHomeRequest((n) => n + 1);
              setKeyboard(false);
              setApp("");
              setFolder("");
              setPanel("");
            }}
          />
          <div className="screen-dimmer" />
          <div className="hardware-reflection" />
        </div>
      </KeyboardContext.Provider>
    </div>
  );
}
function AppSearch({
  apps,
  open,
}: {
  apps: Work["apps"];
  open: (id: string) => void;
}) {
  const [q, set] = useState("");
  return (
    <>
      <input
        autoFocus
        value={q}
        placeholder="アプリ名"
        onChange={(e) => set(e.target.value)}
      />
      {apps
        .filter((a) => (a.name + ja(a.name)).toLowerCase().includes(q.toLowerCase()))
        .map((a) => (
          <button
            className="search-result"
            key={a.id}
            onClick={() => open(a.id)}
          >
            <AppIcon id={a.id} small />
            {ja(a.name)}
          </button>
        ))}
    </>
  );
}
function Media({ item }: { item: Item }) {
  const src = safeMedia(item.media);
  return src ? (
    item.kind === "audio" ? (
      <audio controls src={src} />
    ) : item.kind === "video" ? (
      <video controls playsInline src={src} />
    ) : (
      <img loading="lazy" src={src} alt={item.title} />
    )
  ) : (
    <div
      className={`original-art art-${item.id.includes("ticket") ? "ticket" : "rain"}`}
    >
      <span>
        {item.id.includes("ticket") ? "南へ / SOUTHBOUND" : "after the rain"}
      </span>
      <strong>{item.id.includes("ticket") ? "09 · 01" : "雨のあと"}</strong>
      <small>
        {item.id.includes("ticket")
          ? "16:30 · まだ途中の約束"
          : "a little moment of quiet"}
      </small>
    </div>
  );
}
function AppContent({
  app,
  name,
  items,
  creator,
  state,
  onRead,
  onClue,
  noticeThread,
  onNoticeThreadHandled,
  onEdit,
  onAdd,
  onBack,
  onSettings,
  onUi,
  work,
}: {
  app: AppPlugin;
  name: string;
  items: Item[];
  creator: boolean;
  state: Runtime;
  onRead: (id: string) => void;
  onClue?: (key: string) => void;
  noticeThread?: { appId: string; thread: string; seq: number } | null;
  onNoticeThreadHandled?: () => void;
  onEdit: (item: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  onSettings?: () => void;
  onUi?: (key: string, value: UiValue) => void;
  work: Work;
}) {
  const [detail, setDetail] = useState<Item | null>(null);
  const [thread, setThread] = useState("");
  const [tab, setTab] = useState(app.tabs[0]);
  const [q, setQ] = useState("");
  const [pw, setPw] = useState("");
  const [unlocks, setUnlocks] = useState<string[]>([]);
  const [pwError, setPwError] = useState("");
  const [pwFailures, setPwFailures] = useState<Record<string, number>>({});
  const [likes, setLikes] = useState<string[]>([]);
  useEffect(() => {
    if (noticeThread && noticeThread.appId === app.id) {
      setThread(noticeThread.thread);
      onNoticeThreadHandled?.();
    }
  }, [noticeThread, app.id, onNoticeThreadHandled]);
  const shown = items
    .filter((i) => creator || visible(i, state))
    .filter((i) =>
      (i.title + i.body + i.sender).toLowerCase().includes(q.toLowerCase()),
    );
  const filtered =
    tab === "收藏"
      ? shown.filter((i) => i.favorite)
      : tab === app.tabs[0]
        ? shown
        : shown.filter((i) => i.folder === tab);
  const read = (i: Item) => {
    if (creator) {
      onEdit(i);
      return;
    }
    setDetail(i);
    setPw("");
    setPwError("");
    if (!i.password || unlocks.includes(i.id)) {
      if (app.id === "notes" && i.id === "mina-story-unsent-2025")
        onClue?.(minaClueKeys.finalLetterRead);
      onRead(i.id);
    }
  };
  const chats = [...new Set(shown.map((i) => i.title))];
  const back = () => {
    if (detail) setDetail(null);
    else if (thread) setThread("");
    else onBack();
  };
  const Skin =
    app.id === "wechat"
      ? WeChatSkin
      : app.id === "whatsapp"
        ? WhatsAppSkin
        : (catalogSkins[app.id as keyof typeof catalogSkins] ?? null);
  const detailView = detail ? (
    <div className="phone-content detail-content">
      {detail.password && !creator && !unlocks.includes(detail.id) ? (
        <form className="locked-note" onSubmit={(e) => {
          e.preventDefault();
          if (!pw.trim()) return;
          const key = "password-failures:" + detail.id;
          if (pw.trim() === detail.password) {
            setUnlocks([...unlocks, detail.id]);
            onRead(detail.id);
            setPwError("");
            setPw("");
            setPwFailures((old) => ({ ...old, [detail.id]: 0 }));
            onUi?.(key, 0);
          } else {
            const stored = state.ui?.[app.id]?.[key];
            const count = Math.max(pwFailures[detail.id] || 0, typeof stored === "number" ? stored : 0) + 1;
            setPwFailures((old) => ({ ...old, [detail.id]: count }));
            onUi?.(key, count);
            setPwError("パスコードが違います");
          }
        }}>
          <LockKeyhole size={36} />
          <h3>この内容はロックされています</h3>
          <input
            type="password"
            aria-label="メモのパスコード"
            placeholder="パスコード"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button type="submit" disabled={!pw.trim()}>
            内容のロックを解除
          </button>
          <small>{pwError}</small>
          {detail.meta.passwordHint && Math.max(pwFailures[detail.id] || 0,
            Number(state.ui?.[app.id]?.["password-failures:" + detail.id]) || 0) >= 3 && (
            <p className="note-password-hint" role="status">{detail.meta.passwordHint}</p>
          )}
        </form>
      ) : (
        <>
          <small className="detail-meta">
            {detail.time} · {detail.sender}
          </small>
          <h2>{detail.title}</h2>
          {(detail.media || ["media", "social"].includes(app.engine)) && (
            <Media item={detail} />
          )}
          <RichText value={detail.richText} fallback={detail.body} />
          <dl className="item-metadata">
            {getFields(app.id)
              .filter((f) => detail.meta?.[f.key])
              .map((f) => (
                <div key={f.key}>
                  <dt>{ja(f.label)}</dt>
                  <dd>{detail.meta[f.key]}</dd>
                </div>
              ))}
          </dl>
          {detail.folder && (
            <span className="folder-label">
              <Folder size={12} />
              {ja(detail.folder)}
            </span>
          )}
          {detail.comments.map((c, i) => (
            <p key={i} className="comment">
              {c}
            </p>
          ))}
        </>
      )}
    </div>
  ) : null;
  if (Skin)
    return (
      <>
        <div className="catalog-slot" hidden={!!detail}>
          <Suspense fallback={<div className="catalog-loading">開いています…</div>}>
            <Skin
              appId={app.id}
              owner={work.phone.owner}
              virtualTime={state.time}
              ui={state.ui?.[app.id]}
              onUi={creator ? undefined : onUi}
              name={ja(name)}
              profileName={app.id === "instagram" ? String(work.variables.instagramProfileName || work.phone.owner) : undefined}
              items={shown}
              creator={creator}
              onRead={onRead}
              onClue={onClue}
              onItem={read}
              onAdd={onAdd}
              onBack={onBack}
              thread={thread}
              onThread={setThread}
            />
          </Suspense>
        </div>
        {detail &&
          (socialDetailApps.has(app.id) &&
          (!detail.password || unlocks.includes(detail.id)) ? (
            <SocialDetail
              app={app.id}
              item={detail}
              back={back}
              owner={work.phone.owner}
              ui={state.ui?.[app.id]}
              onUi={onUi}
            />
          ) : nativeDetailApps.has(app.id) &&
            (!detail.password || unlocks.includes(detail.id)) ? (
            <NativeDetail app={app.id} item={detail} back={back} />
          ) : (
            <>
              <div className="app-nav">
                <button aria-label="戻る" onClick={back}>
                  <ChevronLeft size={23} />
                </button>
                <strong>{detail.title}</strong>
                <span />
              </div>
              {detailView}
            </>
          ))}
      </>
    );
  return (
    <>
      <div className="app-nav">
        <button onClick={back} aria-label="戻る">
          <ChevronLeft size={23} />
          {detail || thread ? "戻る" : ""}
        </button>
        <strong>{thread || ja(name)}</strong>
        <button
          onClick={
            creator
              ? onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(
                      ".app-screen .phone-search input",
                    )
                    ?.focus()
          }
          aria-label={creator ? "内容を追加" : "内容を検索"}
        >
          {creator ? <Plus size={22} /> : <Search size={20} />}
        </button>
      </div>
      {app.id === "settings" && !detail ? (
        <NativeSettings
          work={work}
          items={items}
          creator={creator}
          onItem={read}
          onSettings={onSettings}
        />
      ) : app.id === "calculator" && !detail ? (
        <NativeCalculator
          items={shown}
          onRead={read}
          ui={state.ui?.[app.id]}
          onUi={onUi}
        />
      ) : detail ? (
        detailView
      ) : app.engine === "messaging" && thread ? (
        <div className="chat-content">
          <div className="chat-time">{new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(work.phone.date + "T12:00:00Z"))}</div>
          {shown
            .filter((i) => i.title === thread)
            .map((i) => (
              <button
                key={i.id}
                className={`message-row ${i.outgoing ? "outgoing" : ""}`}
                onClick={() => (creator ? onEdit(i) : onRead(i.id))}
              >
                <span className="avatar">{i.sender.slice(0, 1)}</span>
                <span className="bubble">
                  {i.kind === "image" ||
                  i.kind === "audio" ||
                  i.kind === "video" ? (
                    <Media item={i} />
                  ) : i.kind === "transfer" ? (
                    <span className="transfer">
                      ¥ {i.body}
                      <small>作品内の送金記録</small>
                    </span>
                  ) : (
                    i.body
                  )}
                  <small>
                    {i.time.slice(-5)} {i.read ? "✓✓" : ""}
                  </small>
                  {creator && (i.hidden || i.unlock) && (
                    <LockKeyhole size={12} />
                  )}
                </span>
              </button>
            ))}
          {creator ? (
            <button className="chat-compose" onClick={onAdd}>
              ＋ メッセージを追加
            </button>
          ) : (
            <div className="chat-compose muted">
              物語が進むと、ここに返信が届きます。
            </div>
          )}
        </div>
      ) : (
        <div
          className={`phone-content ${app.engine === "social" ? "feed-content" : ""}`}
        >
          {app.engine !== "media" && (
            <div className="phone-search">
              <Search size={15} />
              <input
                placeholder={`${ja(name)}を検索`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          {app.engine === "messaging" ? (
            chats.map((t) => {
              const list = shown.filter((i) => i.title === t),
                last = list[list.length - 1];
              return (
                <button
                  className="contact-row"
                  key={t}
                  onClick={() => {
                    setThread(t);
                    onRead(t);
                  }}
                >
                  <span className="avatar" style={{ background: app.color }}>
                    {t.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{t}</strong>
                    <p>{last.body}</p>
                  </span>
                  <small>{last.time.slice(-5)}</small>
                </button>
              );
            })
          ) : app.engine === "media" ? (
            <>
              <div className="media-heading">
                <h1>{ja(tab)}</h1>
                <p>{filtered.length}件の記録</p>
              </div>
              <div className="media-grid">
                {filtered.map((i) => (
                  <button key={i.id} onClick={() => read(i)}>
                    <Media item={i} />
                    <span>
                      {i.title} {creator && i.hidden ? "· 非表示" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : app.engine === "social" ? (
            filtered.map((i) => (
              <article className="social-post" key={i.id}>
                <div className="post-author">
                  <span className="avatar" style={{ background: app.color }}>
                    {i.sender.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{i.sender}</strong>
                    <small>{i.time}</small>
                  </div>
                  <button aria-label="投稿の詳細を表示" onClick={() => read(i)}>
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <button className="post-image" onClick={() => read(i)}>
                  <Media item={i} />
                </button>
                <div className="post-actions">
                  <button
                    aria-label="いいね"
                    onClick={() =>
                      setLikes(
                        likes.includes(i.id)
                          ? likes.filter((id) => id !== i.id)
                          : [...likes, i.id],
                      )
                    }
                  >
                    <Heart
                      size={22}
                      fill={likes.includes(i.id) ? "#d67670" : "none"}
                    />
                  </button>
                  <button aria-label="コメントを表示" onClick={() => read(i)}>
                    <MessageCircle size={22} />
                  </button>
                  <small>
                    {i.likes + (likes.includes(i.id) ? 1 : 0)}件のいいね
                  </small>
                </div>
                <button className="post-text" onClick={() => read(i)}>
                  <strong>{i.title}</strong>
                  <p>{i.body}</p>
                </button>
              </article>
            ))
          ) : (
            filtered.map((i) => (
              <button
                key={i.id}
                className={`record-row ${app.engine === "document" ? "document-row" : ""}`}
                onClick={() => read(i)}
              >
                <div className="record-symbol">
                  {app.engine === "records" ? (
                    <app.icon size={20} />
                  ) : (
                    <span>{i.title.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <strong>{i.title}</strong>
                  <p>{i.body.split("\n")[0]}</p>
                  <small>
                    {i.time} {i.folder && `· ${i.folder}`}
                  </small>
                </div>
                {i.password || i.hidden ? (
                  <LockKeyhole size={14} />
                ) : (
                  <ChevronLeft className="chevron-right" size={16} />
                )}
              </button>
            ))
          )}
          {!filtered.length && app.engine !== "messaging" && (
            <div className="empty-app">
              <app.icon size={36} />
              <h3>まだ何もありません</h3>
              <p>
                {creator
                  ? "このアプリの内容を追加できます。"
                  : "表示できる内容はありません。"}
              </p>
            </div>
          )}
          {creator && (
            <button className="phone-add" onClick={onAdd}>
              <Plus size={15} />
              追加：
              {app.engine === "messaging"
                ? "チャット"
                : app.engine === "social"
                  ? "投稿"
                  : app.engine === "media"
                    ? "素材"
                    : "内容"}
            </button>
          )}
        </div>
      )}
      {!detail &&
        !thread &&
        app.id !== "calculator" &&
        app.id !== "settings" && (
          <div className="app-tabs">
            {app.tabs.map((t, i) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {i === 0 ? (
                  <MessageCircle size={17} />
                ) : i === 1 ? (
                  <Search size={17} />
                ) : (
                  <UsersIcon />
                )}
                <span>{ja(t)}</span>
              </button>
            ))}
          </div>
        )}
    </>
  );
}
function UsersIcon() {
  return <PhoneIcon size={17} />;
}
