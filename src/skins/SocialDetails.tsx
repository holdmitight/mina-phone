import { ja } from "../i18n";
import { useState } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  Headphones,
  Star,
  Camera,
  Crown,
  Copy,
  Send,
  Home,
  Search,
  Bell,
  Circle,
} from "lucide-react";
import { useSkinState } from "../skinState";
import { RichText } from "../RichText";
import { Avatar, Media, meta } from "./shared";
import type { Item, UiValue } from "../schema";
import "./social-details.css";
export const socialDetailApps = new Set(["twitter", "weibo"]);
const count = (n: number) =>
  n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "w" : String(n);
export function SocialDetail(p: {
  app: string;
  item: Item;
  back: () => void;
  owner: string;
  ui?: Record<string, UiValue>;
  onUi?: (key: string, value: UiValue) => void;
}) {
  const { item } = p,
    weibo = p.app === "weibo";
  const [liked, setLiked] = useSkinState<boolean>(p, "liked-" + item.id, false),
    [saved, setSaved] = useSkinState<boolean>(p, "saved-" + item.id, false),
    [followed, setFollowed] = useSkinState<boolean>(
      p,
      "followed-" + item.sender,
      false,
    ),
    [extra, setExtra] = useSkinState<string[]>(p, "replies-" + item.id, []);
  const [tab, setTab] = useState("评论"),
    [draft, setDraft] = useState(""),
    [target, setTarget] = useState(""),
    [menu, setMenu] = useState(false),
    [sort, setSort] = useState(false),
    [copied, setCopied] = useState(false);
  const comments = [...item.comments, ...extra],
    replies = sort ? [...comments].reverse() : comments;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const submit = () => {
    if (!draft.trim()) return;
    setExtra([...extra, (p.owner || "持ち主") + "：" + draft.trim()]);
    setDraft("");
    setTarget("");
    setTab("评论");
  };
  const actions = (
    <div className="post-detail-actions">
      <button aria-label="コメントを見る" onClick={() => setTab("评论")}>
        <MessageCircle />
        {count(comments.length)}
      </button>
      <button aria-label="リポストを見る" onClick={() => setTab("转发")}>
        <Repeat2 />
        {meta(item, "reposts", "0")}
      </button>
      <button
        aria-label="投稿にいいね"
        aria-pressed={liked}
        onClick={() => setLiked(!liked)}
      >
        <Heart
          fill={liked ? "#f91880" : "none"}
          color={liked ? "#f91880" : undefined}
        />
        {count(item.likes + (liked ? 1 : 0))}
      </button>
      <button
        aria-label="投稿を保存"
        aria-pressed={saved}
        onClick={() => setSaved(!saved)}
      >
        <Bookmark fill={saved ? "currentColor" : "none"} />
        {saved ? "1" : "0"}
      </button>
      <button aria-label="投稿をシェア" onClick={() => setMenu(!menu)}>
        <Share />
      </button>
    </div>
  );
  return (
    <div
      className={
        "app-post-detail " +
        (weibo
          ? "weibo-post-detail"
          : "x-post-detail" +
            (p.ui?.["x-dark"] !== false ? " x-reference-dark" : ""))
      }
    >
      <header className="post-detail-nav">
        <button aria-label="投稿一覧に戻る" onClick={p.back}>
          <ChevronLeft size={27} />
        </button>
        <strong>{weibo ? "投稿" : "投稿"}</strong>
        <div>
          {weibo && <Headphones size={23} />}
          <button aria-label="投稿のその他のオプション" onClick={() => setMenu(!menu)}>
            <MoreHorizontal size={26} />
          </button>
        </div>
      </header>
      <div className="post-detail-scroll">
        <div className="post-detail-author">
          <Avatar name={item.sender} src={item.avatar} />
          <div>
            <strong>{item.sender || "ユーザー"}</strong>
            <small>
              {weibo
                ? item.time + " " + meta(item, "location")
                : meta(item, "handle", item.sender ? "@" + item.sender : "")}
            </small>
          </div>
          {weibo ? (
            <button
              aria-label="投稿者をフォロー"
              onClick={() => setFollowed(!followed)}
            >
              <Star fill={followed ? "#ff9500" : "none"} />
            </button>
          ) : (
            <button
              className="post-follow"
              onClick={() => setFollowed(!followed)}
            >
              {followed ? "フォロー中" : "フォロー"}
            </button>
          )}
        </div>
        <div className="post-detail-body">
          <RichText value={item.richText} fallback={item.body} />
          {item.media && <Media item={item} />}
        </div>
        {weibo ? (
          <div className="weibo-share-options">
            {[Crown, MessageCircle, Camera, Share, Copy].map((Icon, n) => (
              <button
                key={n}
                aria-label={["メンバー", "WeChatでシェア", "カメラ", "シェア", "コピー"][n]}
                onClick={() => (n === 4 ? void copy() : setMenu(true))}
              >
                <Icon size={25} />
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="x-post-metadata">
              {item.time} · <b>{meta(item, "views", "0")}</b> 件の表示
            </div>
            {actions}
          </>
        )}
        {weibo ? (
          <div className="weibo-detail-tabs">
            {["转发", "评论", "赞"].map((name) => (
              <button
                key={name}
                aria-pressed={tab === name}
                onClick={() => setTab(name)}
              >
                {ja(name)}{" "}
                {name === "评论"
                  ? count(comments.length)
                  : name === "赞"
                    ? count(item.likes + (liked ? 1 : 0))
                    : meta(item, "reposts", "0")}
              </button>
            ))}
          </div>
        ) : (
          <div className="x-related-row">
            <button onClick={() => setSort(!sort)}>
              {sort ? "新着" : "関連"}⌄
            </button>
            <button onClick={() => setTab(tab === "转发" ? "评论" : "转发")}>
              引用を見る ›
            </button>
          </div>
        )}
        {weibo && (
          <button className="weibo-sort" onClick={() => setSort(!sort)}>
            {sort ? "新しい順" : "人気順"}⌄
          </button>
        )}
        {tab === "评论" ? (
          <div className="post-detail-comments">
            {replies.map((c, index) => {
              const split = c.search(/[：:]/),
                hasName = split > 0 && split < 24,
                name = hasName ? c.slice(0, split) : "ユーザー",
                body = hasName ? c.slice(split + 1) : c;
              return (
                <article key={index} className="post-detail-comment">
                  <Avatar name={name} />
                  <div>
                    <strong>{name}</strong>
                    <p>{body}</p>
                    <div className="post-comment-actions">
                      <button
                        aria-label={"返信" + name}
                        onClick={() => setTarget(name)}
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        aria-label={"返信にいいね" + index}
                        onClick={(e) => {
                          e.currentTarget.classList.toggle("liked");
                        }}
                      >
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>
                  <MoreHorizontal size={17} />
                </article>
              );
            })}
            {!replies.length && <p className="post-comments-empty">コメントはまだありません</p>}
          </div>
        ) : (
          <p className="post-comments-empty">
            {tab === "转发" ? "表示できるリポストはありません" : "ほかの記録はありません"}
          </p>
        )}
      </div>
      <form
        className="post-detail-reply"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Avatar name={p.owner || "持ち主"} />
        <input
          aria-label="投稿に返信"
          placeholder={
            target ? "返信先 @" + target : weibo ? "コメントを入力" : "返信を入力"
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button aria-label="返信を送信" disabled={!draft.trim()}>
          <Send size={20} />
        </button>
      </form>
      {!weibo && (
        <nav className="x-detail-bottom">
          {[Home, Search, Circle, Bell, MessageCircle].map((Icon, n) => (
            <button
              key={n}
              aria-label={
                ["Xのタイムラインに戻る", "Xを検索", "Xアシスタント", "X通知", "Xメッセージ"][n]
              }
              onClick={p.back}
            >
              <Icon />
            </button>
          ))}
        </nav>
      )}
      {menu && (
        <div className="post-options-menu">
          <button onClick={copy}>
            <Copy size={18} />
            {copied ? "コピーしました" : "テキストをコピー"}
          </button>
          <button
            onClick={() => {
              setSaved(!saved);
              setMenu(false);
            }}
          >
            <Bookmark size={18} />
            {saved ? "保存を解除" : "保存"}
          </button>
          <button onClick={() => setMenu(false)}>キャンセル</button>
        </div>
      )}
    </div>
  );
}
