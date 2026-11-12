import { ja } from "../i18n";
import { useState } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Share,
  Heart,
  Phone,
  MessageCircle,
  Video,
  Folder,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { RichText } from "../RichText";
import { safeMedia, type Item } from "../schema";
import { isCuratedSafariBookmark, SafariBookmarkPage } from "./SafariBookmarks";
import "./safari-bookmarks.css";
export const nativeDetailApps = new Set([
  "notes",
  "photos",
  "contacts",
  "phone",
  "calendar",
  "files",
  "safari",
]);
export function NativeDetail({
  app,
  item,
  back,
}: {
  app: string;
  item: Item;
  back: () => void;
}) {
  const [favorite, setFavorite] = useState(item.favorite),
    [copied, setCopied] = useState(false),
    [call, setCall] = useState(false);
  const media = safeMedia(item.media),
    name =
      app === "notes"
        ? "备忘录"
        : app === "contacts"
          ? "通讯录"
          : app === "photos"
            ? "所有照片"
            : app === "phone"
              ? "最近通话"
              : app === "calendar"
                ? "日历"
                : app === "files"
                  ? "浏览"
                  : "书签";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={"native-detail native-detail-" + app}>
      <header className="app-nav">
        <button aria-label="戻る" onClick={back}>
          <ChevronLeft size={24} />
          {ja(name)}
        </button>
        <strong>{app === "photos" ? item.time.slice(0, 10) : ""}</strong>
        <button aria-label="その他の操作" onClick={() => setCopied(!copied)}>
          <MoreHorizontal size={23} />
        </button>
      </header>
      {copied && (
        <div className="native-action-sheet">
          <button onClick={copy}>
            <Copy size={18} />

            テキストをコピー
          </button>
          <button onClick={() => setCopied(false)}>キャンセル</button>
        </div>
      )}
      {app === "photos" ? (
        <>
          <div className="native-photo-stage">
            {media ? (
              <img src={media} alt={item.title} />
            ) : (
              <div className="native-photo-caption">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </div>
            )}
          </div>
          <footer className="native-detail-toolbar">
            <button aria-label="写真の説明を共有" onClick={copy}>
              <Share />
            </button>
            <button
              aria-label="写真をお気に入りに追加"
              onClick={() => setFavorite(!favorite)}
            >
              <Heart fill={favorite ? "#007aff" : "none"} />
            </button>
            <span>{copied ? "コピーしました" : item.title}</span>
          </footer>
        </>
      ) : app === "contacts" || app === "phone" ? (
        <div className="native-detail-scroll">
          <div className="native-contact-hero">
            <span>{Array.from(item.title)[0]}</span>
            <h1>{item.title}</h1>
          </div>
          <div className="native-contact-actions">
            {[
              [MessageCircle, "信息"],
              [Phone, "呼叫"],
              [Video, "视频"],
            ].map(([Icon, label]) => {
              const Glyph = Icon as typeof Phone;
              return (
                <button key={ja(String(label))} onClick={() => setCall(true)}>
                  <Glyph size={23} />
                  {ja(String(label))}
                </button>
              );
            })}
          </div>
          <div className="native-detail-group">
            <small>携帯電話</small>
            <p className="native-blue">{item.meta.phone || "電話番号なし"}</p>
          </div>
          <div className="native-detail-group">
            <small>メモ</small>
            <p>{item.body}</p>
          </div>
          {call && (
            <div className="native-detail-group">
              <p>作品内シミュレーション · {item.title}</p>
              <button onClick={() => setCall(false)}>終了</button>
            </div>
          )}
        </div>
      ) : app === "notes" ? (
        <>
          <div className="native-detail-scroll native-note-paper">
            <time>{item.time}</time>
            <h1>{item.title}</h1>
            <RichText value={item.richText} fallback={item.body} />
          </div>
          <footer className="native-detail-toolbar">
            <button aria-label="フォルダに戻る" onClick={back}>
              <Folder />
            </button>
            <span />
            <button aria-label="メモをコピー" onClick={copy}>
              {copied ? <Check /> : <Share />}
            </button>
          </footer>
        </>
      ) : app === "calendar" ? (
        <div className="native-detail-scroll native-event-paper">
          <h1>{item.title}</h1>
          <p>{item.time}</p>
          <div className="native-detail-group">
            <small>予定</small>
            <p>{item.body}</p>
          </div>
          {Object.entries(item.meta).map(([k, v]) => (
            <div className="native-detail-group" key={k}>
              <small>{k}</small>
              <p>{v}</p>
            </div>
          ))}
        </div>
      ) : app === "safari" ? (
        <>
          <div className={isCuratedSafariBookmark(item.title) ? "native-detail-scroll native-reader safari-curated-reader" : "native-detail-scroll native-reader"}>
            {isCuratedSafariBookmark(item.title) ? (
              <SafariBookmarkPage title={item.title} />
            ) : (
              <>
                <h1>{item.title}</h1>
                <RichText value={item.richText} fallback={item.body} />
              </>
            )}
          </div>
          <footer className="native-reader-address">
            <Search size={16} />
            <span>{item.meta.url || item.title}</span>
            <Share size={18} />
          </footer>
        </>
      ) : (
        <div className="native-detail-scroll native-file-preview">
          <Folder size={64} color="#007aff" />
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          <small>{item.time}</small>
          <button onClick={copy}>内容をコピー</button>
        </div>
      )}
    </div>
  );
}
