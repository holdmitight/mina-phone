import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Smile,
  Users,
  X,
} from "lucide-react";
import { NativeComposer } from "../DeviceSystem";
import { safeMedia, type Item } from "../schema";
import type { Props } from "./shared";
import { Media } from "./shared";
import {
  minaLineLastMessage,
  minaLineMemories,
  minaLineThreadName,
} from "./minaLineMemories";
import { minaClueKeys } from "./minaStoryInteractions";
import "./mina-line-memory.css";

const formatDay = (day: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const [year, month, date] = day.split("-");
  return `${year}年${Number(month)}月${Number(date)}日`;
};

type LineDisplayMessage = {
  id: string;
  day: string;
  clock: string;
  outgoing: boolean;
  text: string;
  translation?: string;
  original?: Item;
};

function authoredMessages(p: Props): LineDisplayMessage[] {
  return p.items
    .filter((item) => item.title === p.thread)
    .map((item) => {
      const timestamp = item.time ?? "";
      return {
        id: item.id,
        day: /^\d{4}-\d{2}-\d{2}/.test(timestamp)
          ? timestamp.slice(0, 10)
          : "",
        clock: timestamp.match(/\d{2}:\d{2}/)?.[0] ?? "",
        outgoing:
          item.outgoing ||
          [p.owner, "名井南", "Mina", "自分"].includes(item.sender),
        text: item.body,
        original: item,
      };
    });
}

function LineAvatar({
  name,
  src = "",
  noPhoto = false,
}: {
  name: string;
  src?: string;
  noPhoto?: boolean;
}) {
  const image = noPhoto ? "" : safeMedia(src ?? "");
  return (
    <span
      className={`mina-line-avatar${noPhoto ? " empty" : ""}`}
      aria-hidden="true"
    >
      {image?.startsWith("data:image/") ? (
        <img src={image} alt="" />
      ) : noPhoto ? null : (
        <span>{name.slice(0, 1)}</span>
      )}
    </span>
  );
}

/**
 * Every LINE thread shares the same layout, date markers, bubbles and composer.
 * Mina's 2015 summer memories remain a saved archive, read from her viewpoint.
 */
export function MinaLineSkin(p: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"トーク" | "友だち">("トーク");
  const [translations, setTranslations] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const isArchive = p.thread === minaLineThreadName;
  const isThread = Boolean(p.thread);
  const messages: LineDisplayMessage[] = isArchive
    ? minaLineMemories.map((message) => ({
        id: message.id,
        day: message.day,
        clock: message.time,
        outgoing: message.from === "mina",
        text: message.text,
        translation: message.translation,
      }))
    : isThread
      ? authoredMessages(p)
      : [];

  useEffect(() => {
    if (isThread && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [p.thread, isThread]);
  // Simply opening an archive is not enough to discover the LEGO promise.
  // The clue is recorded only when A actually scrolls back to that message.
  useEffect(() => {
    if (!isArchive || p.creator || !p.onClue) return;
    const root = threadRef.current;
    const message = root?.querySelector('[data-line-id="2014-08-09-03"]');
    if (!root || !message || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting))
        p.onClue?.(minaClueKeys.legoPromiseSeen);
    }, { root, threshold: 0.3 });
    observer.observe(message);
    return () => observer.disconnect();
  }, [isArchive, p.creator, p.onClue]);
  // The end of the archive is an unanswered message. Observing it only after
  // it actually becomes visible makes the separation memo discoverable.
  useEffect(() => {
    if (!isArchive || p.creator || !p.onClue) return;
    const root = threadRef.current;
    const lastMessage = root?.querySelector('[data-line-id="2015-11-06-02"]');
    if (!root || !lastMessage || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting))
        p.onClue?.(minaClueKeys.lineBreakupSeen);
    }, { root, threshold: 0.3 });
    observer.observe(lastMessage);
    return () => observer.disconnect();
  }, [isArchive, p.creator, p.onClue]);

  const otherThreads = [...new Set(p.items.map((item) => item.title))]
    .filter((title) => title && title !== minaLineThreadName)
    .map((title) => {
      const entries = p.items.filter((item) => item.title === title);
      return { title, last: entries[entries.length - 1] };
    })
    .filter(({ title, last }) =>
      (title + " " + (last?.body ?? ""))
        .toLocaleLowerCase()
        .includes(searchQuery.trim().toLocaleLowerCase()),
    );

  const showArchive =
    !searchQuery.trim() ||
    (minaLineThreadName + " " + minaLineLastMessage.text)
      .toLocaleLowerCase()
      .includes(searchQuery.trim().toLocaleLowerCase());

  const backFromThread = () => {
    p.onThread("");
    setTranslations(false);
    setMenuOpen(false);
  };

  return (
    <section
      className="catalog-skin mina-line"
      data-view={isThread ? "thread" : tab}
      data-archive={isArchive ? "true" : "false"}
      aria-label="LINE"
    >
      {isThread ? (
        <>
          <header className="mina-line-thread-header">
            <button aria-label="トーク一覧へ戻る" onClick={backFromThread}>
              <ChevronLeft size={24} />
            </button>
            <strong>{p.thread}</strong>
            <button
              aria-label="最初のメッセージへ"
              title="最初から読む"
              onClick={() =>
                threadRef.current?.scrollTo({ top: 0, behavior: "smooth" })
              }
            >
              <ArrowUp size={20} />
            </button>
            <button
              aria-label="トークメニュー"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              <MoreHorizontal size={22} />
            </button>
          </header>
          {menuOpen && (
            <div className="mina-line-thread-menu">
              {isArchive && (
                <button
                  onClick={() => {
                    p.onClue?.(minaClueKeys.legoPromiseSeen);
                    threadRef.current?.querySelector<HTMLElement>('[data-line-id="2014-08-09-03"]')
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setMenuOpen(false);
                  }}
                >
                  保存したメッセージ：指輪の約束
                </button>
              )}
              {isArchive && (
                <button
                  onClick={() => {
                    setTranslations((value) => !value);
                    setMenuOpen(false);
                  }}
                >
                  {translations ? "日本語だけ表示" : "中国語訳を表示"}
                </button>
              )}
              <button
                onClick={() => {
                  if (isArchive) p.onClue?.(minaClueKeys.lineBreakupSeen);
                  threadRef.current?.scrollTo({
                    top: threadRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                  setMenuOpen(false);
                }}
              >
                最後のメッセージへ
              </button>
            </div>
          )}
          <div
            className="mina-line-messages"
            ref={threadRef}
            aria-label="トーク履歴"
          >
            {isArchive && (
              <div className="mina-line-memory-marker">2015 · あの夏から</div>
            )}
            {messages.map((message, index) => {
              const newDate =
                Boolean(message.day) &&
                (index === 0 || messages[index - 1].day !== message.day);
              const content = (
                <>
                  {message.original &&
                  ["image", "video", "audio"].includes(
                    message.original.kind,
                  ) ? (
                    <Media item={message.original} />
                  ) : (
                    <span>{message.text}</span>
                  )}
                  {translations && message.translation && (
                    <small className="mina-line-translation">
                      {message.translation}
                    </small>
                  )}
                </>
              );
              return (
                <div key={message.id} data-line-id={isArchive ? message.id : undefined}>
                  {newDate && (
                    <div
                      className="mina-line-date"
                      aria-label={formatDay(message.day)}
                    >
                      {formatDay(message.day)}
                    </div>
                  )}
                  <div
                    className={`mina-line-message ${message.outgoing ? "mine" : "theirs"}`}
                  >
                    <div className="mina-line-message-line">
                      {message.outgoing && (
                        <span className="mina-line-time">{message.clock}</span>
                      )}
                      {message.original ? (
                        <button
                          className="mina-line-balloon"
                          onClick={() =>
                            p.creator
                              ? p.onItem(message.original!)
                              : p.onRead(message.id)
                          }
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="mina-line-balloon">{content}</div>
                      )}
                      {!message.outgoing && (
                        <span className="mina-line-time">{message.clock}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="mina-line-end-spacer" aria-hidden="true" />
          </div>
          <div className="mina-line-reply-archive">
            <button aria-label="絵文字" disabled={isArchive}>
              <Smile size={20} />
            </button>
            {isArchive ? (
              <span>2015年のトーク履歴</span>
            ) : (
              <NativeComposer creator={p.creator} onAdd={p.onAdd} />
            )}
            <button
              aria-label="最後のメッセージへ"
              onClick={() => {
                if (isArchive) p.onClue?.(minaClueKeys.lineBreakupSeen);
                threadRef.current?.scrollTo({
                  top: threadRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }}
            >
              <ArrowDown size={20} />
            </button>
          </div>
        </>
      ) : (
        <>
          <header className="mina-line-list-header">
            <button aria-label="ホームへ戻る" onClick={p.onBack}>
              <ChevronLeft size={23} />
            </button>
            <strong>{tab}</strong>
            {p.creator ? (
              <button aria-label="追加" onClick={p.onAdd}>
                <Plus size={20} />
              </button>
            ) : (
              <span>LINE</span>
            )}
          </header>
          <div className="mina-line-list-scroll">
            <div className="mina-line-search">
              <Search size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="友だち、トークを検索"
                aria-label="LINEのトークを検索"
              />
              {searchQuery && (
                <button
                  aria-label="検索を消去"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p className="mina-line-list-label">
              {tab === "トーク" ? "トーク履歴" : "友だち"}
            </p>
            {showArchive && (
              <button
                className="mina-line-chat-row"
                onClick={() => {
                  p.onThread(minaLineThreadName);
                  p.onClue?.(minaClueKeys.oldLine);
                  setMenuOpen(false);
                }}
              >
                <LineAvatar name={minaLineThreadName} noPhoto />
                <span className="mina-line-chat-summary">
                  <strong>{minaLineThreadName}</strong>
                  <small>{minaLineLastMessage.text}</small>
                </span>
                <time>{minaLineLastMessage.day.replaceAll("-", "/")}</time>
              </button>
            )}
            {otherThreads.map(({ title, last }) => (
              <button
                className="mina-line-chat-row"
                key={title}
                onClick={() => {
                  p.onThread(title);
                  p.onRead(title);
                  setMenuOpen(false);
                }}
              >
                <LineAvatar name={title} src={last?.avatar} />
                <span className="mina-line-chat-summary">
                  <strong>{title}</strong>
                  <small>{last?.body}</small>
                </span>
                <time>{last?.time?.slice(0, 10)}</time>
              </button>
            ))}
            {!showArchive && !otherThreads.length && (
              <p className="mina-line-empty">該当するトークはありません。</p>
            )}
          </div>
          <nav className="mina-line-tabs" aria-label="LINE ナビゲーション">
            <button
              aria-current={tab === "友だち" ? "page" : undefined}
              onClick={() => setTab("友だち")}
            >
              <Users size={23} />
              <span>友だち</span>
            </button>
            <button
              aria-current={tab === "トーク" ? "page" : undefined}
              onClick={() => setTab("トーク")}
            >
              <MessageCircle size={23} />
              <span>トーク</span>
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
