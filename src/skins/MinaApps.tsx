import { ja } from "../i18n";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Check,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
  ChevronLeft,
  MoreVertical,
  Search,
  Send,
  Pencil,
  Smile,
  Tag,
  UserRound,
} from "lucide-react";
import { useSkinState } from "../skinState";
import type { Item } from "../schema";
import { Header, Media, SearchBox, meta, type Props } from "./shared";
import "./mina-apps.css";
import "./mina-bubble-reference.css";

/** Bubble reference layout: chat list, conversation, member drawer and artist profile. */
const bubbleAssets = "./mina-media/bubble/";
function BubbleAvatar({ large = false }: { large?: boolean }) {
  return <span className={`mina-bubble-reference-avatar${large ? " large" : ""}`}><img src={`${bubbleAssets}profile-reference.jpg`} alt="MINAのプロフィール写真" /></span>;
}
function FanAvatar() {
  return <span className="bubble-artist-fan-avatar" aria-label="ONCE"><Heart size={23} fill="currentColor" strokeWidth={0}/></span>;
}
export function BubbleSkin(p: Props) {
  const [letters, setLetters] = useSkinState<string[]>(p, "bubble-letters", []);
  const [screen, setScreen] = useSkinState<string>(p, "bubble-screen", "chats");
  const [cleared, setCleared] = useSkinState<boolean>(p, "bubble-history-cleared", false);
  const [hiddenThrough, setHiddenThrough] = useSkinState<number>(p, "bubble-history-hidden-through", 0);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [profileReturn, setProfileReturn] = useState("thread");
  const [editingLetter, setEditingLetter] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const stream = useRef<HTMLDivElement>(null);
  const authored = p.items.filter((item) => !item.folder || item.folder === "聊天" || item.folder === "ONCE");
  const ownerName = p.owner?.includes("名井") ? "MINA" : p.owner || "MINA";
  const history = cleared ? [] : authored;
  const localLetters = cleared ? letters.slice(Math.max(0, Math.floor(hiddenThrough))) : letters;
  const visibleHistory = history.filter(item => item.body.includes(query));
  const visibleLetters = localLetters.map((text, index) => ({
    text,
    index: cleared ? index + Math.max(0, Math.floor(hiddenThrough)) : index,
  })).filter(entry => entry.text.includes(query));
  const lastText = localLetters.at(-1) || (cleared ? "メッセージはありません" : authored.at(-1)?.body || "トークを開く");
  const lastDate = authored.at(-1)?.time.slice(0, 10).replaceAll("-", "/") || "";
  useEffect(() => {
    if (stream.current && !query) stream.current.scrollTop = stream.current.scrollHeight;
  }, [authored.length, letters.length, screen, query]);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 950);
    return () => window.clearTimeout(timer);
  }, []);
  function go(next: string) {
    setScreen(next);
    setSearchOpen(false);
    setQuery("");
    setDrawerOpen(false);
    setEditingLetter(null);
    setDraft("");
    setShowIntro(false);
  }
  function openProfile(from: string) { setProfileReturn(from); go("profile"); }
  function editLetter(index: number, text: string) {
    setEditingLetter(index);
    setDraft(text);
    setSearchOpen(false);
    setQuery("");
  }
  function sendLetter() {
    const text = draft.trim().slice(0, 1000);
    if (!text) return;
    if (editingLetter !== null) {
      setLetters(previous => previous.map((item, index) => index === editingLetter ? text : item));
      setEditingLetter(null);
    } else {
      setLetters(previous => [...previous, text]);
    }
    setDraft("");
  }
  const intro = showIntro ? <button type="button" className="mina-bubble-intro" aria-label="bubbleを開く" onClick={() => setShowIntro(false)}>
    <strong>bubble</strong>
    <span className="mina-bubble-intro-cross">×</span>
    <span className="mina-bubble-intro-jyp">JYP</span>
    <small>© DearU</small>
  </button> : null;
  const footer = <nav className="bubble-reference-tabs" aria-label="bubbleのナビゲーション">{[{id:"friends",label:"プロフィール",Icon:UserRound},{id:"chats",label:"トーク",Icon:MessageCircle},{id:"more",label:"その他",Icon:MoreVertical}].map(({id,label,Icon}) => <button key={id} aria-label={label} aria-pressed={screen===id} onClick={() => go(id)}><Icon size={25} fill={screen===id&&id==="chats"?"currentColor":"none"} /></button>)}</nav>;
  const onceChatRow = <button className="bubble-reference-chat-row" aria-label="ONCEとのトークを開く" onClick={() => go("thread")}><FanAvatar /><span className="bubble-reference-row-copy"><strong>ONCE</strong><small>{lastText}</small></span><time>{lastDate}</time></button>;
  if (screen === "profile") return (
    <section className="catalog-skin mina-bubble-root bubble-reference-app mina-bubble-artist-page" data-perspective="mina" data-view="profile" aria-label="自分のプロフィール" style={{ backgroundImage: `url("${bubbleAssets}background.png")` }}>
      <button className="mina-bubble-profile-close" aria-label="プロフィールを閉じる" onClick={() => go(profileReturn)}><X size={25} /></button>
      {intro}
      <div className="mina-bubble-artist-identity"><BubbleAvatar large /><div><span className="mina-bubble-artist-badge">ARTIST</span><h1>{ownerName}</h1></div><button className="mina-bubble-return-chat" onClick={() => go("thread")}><MessageCircle size={18} />トークに戻る</button></div>
    </section>
  );
  if (screen === "thread") return (
    <section className="catalog-skin mina-bubble-root bubble-reference-app bubble-reference-conversation" data-perspective="mina" data-view="thread" aria-label="ONCEとのトーク">
      <header className="bubble-reference-thread-header">
        <div>
          <button aria-label="トーク一覧に戻る" onClick={() => go("chats")}><ChevronLeft size={25} /></button>
          <strong>ONCE</strong>
          <button aria-label="トーク内を検索" onClick={() => { setSearchOpen(!searchOpen); setQuery(""); }}><Search size={23} /></button>
          <button aria-label="トークメニューを開く" onClick={() => setDrawerOpen(true)}><MoreVertical size={23} /></button>
        </div>
        <p><i>bubble</i> <span>♥</span> {ownerName} → ONCE</p>
      </header>
      {intro}
      {searchOpen&&<div className="bubble-reference-search"><Search size={17}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="トーク内を検索" aria-label="トーク内の検索文字" /></div>}
      <div className="mina-bubble-thread bubble-reference-messages" ref={stream}>
        <p className="bubble-reference-date">{lastDate}</p>
        {visibleHistory.map(item => {
          const artist = item.outgoing || item.sender === p.owner || item.sender === ownerName;
          const translation = item.meta.translation || item.meta.translated || "";
          return (
            <div className={`bubble-reference-message ${artist ? "outgoing artist" : "fan"}`} key={item.id}>
              {!artist && <span className="bubble-reference-message-avatar"><FanAvatar /></span>}
              <div className="bubble-reference-message-content">
                {!artist && <span className="bubble-reference-sender">ONCE</span>}
                <div className="bubble-reference-message-line">
                  <button className="bubble-reference-balloon" onClick={() => p.creator ? p.onItem(item) : p.onRead(item.id)}>
                    {item.media ? <Media item={item} /> : item.body}
                    {translation && <span className="mina-bubble-translation">{translation}</span>}
                  </button>
                  <time>{item.time.slice(-5)}</time>
                </div>
              </div>
            </div>
          );
        })}
        {visibleLetters.map(({ text, index }) =>
          <div className="bubble-reference-message outgoing artist" key={`local-${index}`}>
            <div className="bubble-reference-message-content">
              <div className="bubble-reference-message-line">
                <div className="bubble-reference-balloon">{text}</div>
                <time>{p.virtualTime?.slice(-5) || "今"}</time>
              </div>
              <button className="mina-bubble-edit-letter" type="button" onClick={() => editLetter(index, text)}>
                <Pencil size={12} /> 編集
              </button>
            </div>
          </div>
        )}
        {!history.length&&!localLetters.length&&<p className="bubble-reference-empty">メッセージはまだありません</p>}
        {query&&!visibleHistory.length&&!visibleLetters.length&&<p className="bubble-reference-empty">一致するメッセージがありません</p>}
      </div>
      {editingLetter !== null && <div className="mina-bubble-editing" role="status">
        <span>MINAのメッセージを編集中</span>
        <button type="button" onClick={() => { setEditingLetter(null); setDraft(""); }}>キャンセル</button>
      </div>}
      <form className="mina-bubble-composer bubble-reference-composer" onSubmit={event => { event.preventDefault(); sendLetter(); }}>
        <div>
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            aria-label="MINAとして送るメッセージを入力"
            placeholder="メッセージを入力…"
            maxLength={1000}
          />
          <button type="button" aria-label="絵文字を追加" onClick={() => setDraft(value => value + "☺")}><Smile size={23} /></button>
        </div>
        <button type="submit" aria-label={editingLetter !== null ? "編集内容を保存" : "MINAとして送信"} disabled={!draft.trim()}><Send size={24} /></button>
      </form>
      {drawerOpen&&<div className="bubble-reference-drawer-layer"><button className="bubble-reference-drawer-shade" aria-label="トークメニューを閉じる" onClick={()=>setDrawerOpen(false)}/><aside className="bubble-reference-drawer" aria-label="トークメニュー"><button className="bubble-artist-self-profile" aria-label="自分のプロフィールを開く" onClick={()=>openProfile("thread")}><BubbleAvatar/><small>{ownerName}</small></button><span className="bubble-artist-recipient"><FanAvatar/><small>ONCE</small></span><button className="bubble-reference-ticket" aria-label="トーク情報" onClick={()=>go("more")}><Tag size={21}/></button></aside></div>}
    </section>
  );
  return (
    <section className="catalog-skin mina-bubble-root bubble-reference-app bubble-reference-list" data-perspective="mina" data-view={screen}>
      <header className="bubble-reference-list-actions"><span/>{screen==="chats"&&<><button aria-label="トークを検索" onClick={()=>{setSearchOpen(!searchOpen);setQuery("");}}><Search size={23}/></button><button aria-label="トーク履歴を整理" onClick={()=>setConfirmClear(true)}><Trash2 size={23}/></button></>}</header>
      <div className="bubble-reference-list-scroll">
        <h1>{screen==="friends"?"プロフィール":screen==="more"?"その他":screen==="notice"?"お知らせ":"CHATS"}</h1>
        {searchOpen&&<div className="bubble-reference-search"><Search size={17}/><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="トークを検索" aria-label="トークの検索文字"/></div>}
        {(screen==="chats"||!["friends","more","notice"].includes(screen))&&<><h2>Favorite Chat List</h2>{("ONCE"+lastText).toLowerCase().includes(query.toLowerCase())?onceChatRow:<p className="bubble-reference-empty">一致するトークがありません</p>}<div className="bubble-reference-list-rule"/><h2>Recent Chat Room</h2><button className="bubble-reference-chat-row bubble-reference-notice-row" onClick={()=>go("notice")}><span className="bubble-reference-notice-avatar">♥</span><span className="bubble-reference-row-copy"><strong>bubble for JYPnation</strong><small>新しいお知らせはありません</small></span></button></>}
        {screen==="friends"&&<><h2>マイプロフィール</h2><button className="bubble-reference-friend-profile" onClick={()=>openProfile("friends")}><BubbleAvatar/><span><strong>{ownerName}</strong><small>プロフィールを見る</small></span></button><h2>送信先</h2>{onceChatRow}</>}
        {screen==="more"&&<><button className="bubble-reference-friend-profile" onClick={()=>openProfile("more")}><BubbleAvatar/><span><strong>{ownerName}</strong><small>プロフィールを見る</small></span></button><div className="bubble-reference-settings"><button onClick={()=>openProfile("more")}>自分のプロフィール<ChevronRight size={18}/></button><div>言語<span>日本語</span></div><button onClick={()=>go("notice")}>お知らせ<ChevronRight size={18}/></button><button onClick={()=>setConfirmClear(true)}>トーク履歴を整理<ChevronRight size={18}/></button>{cleared&&<button onClick={()=>setCleared(false)}>保存された履歴を表示<ChevronRight size={18}/></button>}<p>この作品内のシミュレーションです。<br/>メッセージの送信や課金は行いません。</p></div></>}
        {screen==="notice"&&<><div className="bubble-reference-notice-heading"><span className="bubble-reference-notice-avatar">♥</span><strong>bubble for JYPnation</strong></div><p className="bubble-reference-empty">新しいお知らせはありません</p><button className="bubble-reference-back-list" onClick={()=>go("chats")}>トーク一覧に戻る</button></>}
      </div>
      {footer}
      {intro}
      {confirmClear&&<div className="bubble-reference-dialog-shade"><div role="dialog" aria-modal="true" aria-label="トーク履歴の整理" className="bubble-reference-dialog"><h2>トーク履歴を整理しますか？</h2><p>この作品内で表示する履歴を非表示にします。保存された履歴は「その他」から再表示できます。</p><div><button onClick={()=>setConfirmClear(false)}>キャンセル</button><button onClick={()=>{setHiddenThrough(letters.length);setCleared(true);setConfirmClear(false);}}>非表示にする</button></div></div></div>}
    </section>
  );
}

const shopThemes: Record<string, { name: string; accent: string; subtitle: string; heading: string; currency: string }> = {
  amazonjp: { name: "amazon.co.jp", accent: "#d28a22", subtitle: "いつもの暮らしに、小さなよろこび。", heading: "日常の、好きなもの。", currency: "JPY" },
  rakuten: { name: "Rakuten", accent: "#bd1539", subtitle: "楽天市場 · お気に入りの品", heading: "お気に入りを、少しずつ。", currency: "JPY" },
  qoo10: { name: "Qoo10", accent: "#d34079", subtitle: "きれいと、小さな楽しみ", heading: "今日の私に、ひとつ。", currency: "JPY" },
  coupang: { name: "coupang", accent: "#247fd4", subtitle: "いつもの暮らしのお気に入り", heading: "今日も、心地よく。", currency: "KRW" },
  musinsa: { name: "MUSINSA", accent: "#272727", subtitle: "静かなワードローブ", heading: "シンプルを、大切に。", currency: "KRW" },
};
function currencyCode(item: Item, fallback: string) {
  const value = meta(item, "currency", fallback).toUpperCase();
  return value === "KRW" || value === "₩" || value === "원" ? "KRW" : "JPY";
}
function numericPrice(item: Item) {
  return Number(meta(item, "price").replace(/[^\d.]/g, "")) || 0;
}
function priceText(item: Item, fallback: string) {
  const currency = currencyCode(item, fallback);
  const value = numericPrice(item);
  return value ? new Intl.NumberFormat("ja-JP", { style: "currency", currency, maximumFractionDigits: 0 }).format(value) : "価格を確認";
}

export function MinaShoppingSkin(p: Props) {
  const theme = shopThemes[p.appId || ""] || shopThemes.amazonjp;
  const [tab, setTab] = useSkinState<string>(p, "shop-tab", "精选");
  const [saved, setSaved] = useSkinState<string[]>(p, "shop-saved", p.items.filter((item) => item.favorite || item.folder === "收藏").map((item) => item.id));
  const [cart, setCart] = useSkinState<string[]>(p, "shop-cart", []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const products = p.items.filter((item) => item.folder !== "订单" && item.kind !== "order");
  const orders = p.items.filter((item) => item.folder === "订单" || item.kind === "order");
  const categories = ["全部", ...new Set(products.map((item) => meta(item, "category")).filter(Boolean))].slice(0, 7);
  const matchesSearch = (item: Item) => `${item.title} ${item.body} ${item.sender} ${meta(item, "brand")} ${meta(item, "category")}`.toLowerCase().includes(query.toLowerCase());
  const selected = tab === "订单" ? orders : tab === "收藏" ? products.filter((item) => saved.includes(item.id)) : tab === "购物袋" ? products.filter((item) => cart.includes(item.id)) : products;
  const visible = selected.filter(matchesSearch).filter((item) => tab !== "精选" || category === "全部" || meta(item, "category") === category);
  const cartItems = products.filter((item) => cart.includes(item.id));
  const total = cartItems.reduce((amount, item) => amount + numericPrice(item), 0);
  const totalText = new Intl.NumberFormat(theme.currency === "KRW" ? "ko-KR" : "ja-JP", { style: "currency", currency: theme.currency, maximumFractionDigits: 0 }).format(total);
  function changeTab(next: string) { setTab(next); setCategory("全部"); setQuery(""); setNotice(""); }
  function toggleSaved(item: Item) { setSaved((previous) => previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id]); p.onRead(item.id); }
  function toggleCart(item: Item) {
    const added = !cart.includes(item.id);
    setCart((previous) => previous.includes(item.id) ? previous.filter((id) => id !== item.id) : [...previous, item.id]);
    setNotice(added ? "このスマートフォンのバッグに追加しました" : "バッグから削除しました");
  }
  return (
    <div className="catalog-skin mina-shop-root" data-shop={p.appId} style={{ "--shop-accent": theme.accent } as CSSProperties}>
      <Header p={p} />
      <div className="mina-shop-brand"><div><h1>{theme.name}</h1><small>{theme.subtitle}</small></div><ShoppingBag size={23} /></div>
      <div className="mina-shop-delivery"><MapPin size={12} /><span>{theme.currency === "KRW" ? "ソウル · 日常の小さなお気に入り" : "日本 · 暮らしの小さな楽しみ"}</span><span>マイページ</span></div>
      <div className="mina-shop-search"><SearchBox value={query} set={setQuery} placeholder={tab === "订单" ? "注文を検索" : "商品・ブランド・お気に入りを検索"} /></div>
      <div className="catalog-scroll">
        {tab === "精选" && <><div className="mina-shop-hero"><small>MINAのお気に入り</small><h2>{theme.heading}</h2><p>好きなものを、少しずつ日常に。</p><Sparkles size={46} /></div><div className="mina-shop-categories">{categories.map((name) => <button key={name} className={category === name ? "selected" : ""} onClick={() => setCategory(name)}>{ja(name)}</button>)}</div></>}
        {tab === "收藏" && <p className="mina-shop-saved-strip"><Heart size={13} />お気に入りを、ここに。<span>{visible.length} 件</span></p>}
        {notice && <p className="mina-shop-message" role="status"><Check size={13} />{notice}</p>}
        {tab === "订单" ? visible.map((item) => <button className="mina-shop-order" key={item.id} onClick={() => p.onItem(item)}>
          <div className="mina-shop-order-top"><span>{meta(item, "brand", item.sender || theme.name)}</span><small>{ja(meta(item, "status", "订单记录"))}</small></div>
          <section><Media item={item} /><div><h3>{item.title}</h3><p>{item.body.split("\n")[0]}</p><strong>{priceText(item, theme.currency)}</strong></div></section>
          <footer><Package size={13} /><span>{ja(meta(item, "delivery", item.time))}</span><ChevronRight size={13} /></footer>
        </button>) : <div className="mina-shop-grid">{visible.map((item) => <article className="mina-shop-product" key={item.id}>
          <button className="mina-shop-open" onClick={() => p.onItem(item)}><Media item={item} /><small>{ja(meta(item, "brand", meta(item, "category", "MY PICK")))}</small><h3>{item.title}</h3><strong>{priceText(item, theme.currency)}</strong></button>
          <div className="mina-shop-product-tools"><button onClick={() => toggleSaved(item)} className={saved.includes(item.id) ? "selected" : ""} aria-label={saved.includes(item.id) ? `お気に入りから削除：${item.title}` : `お気に入りに追加：${item.title}`} aria-pressed={saved.includes(item.id)}><Heart size={15} fill={saved.includes(item.id) ? "currentColor" : "none"} /><span>{saved.includes(item.id) ? "保存済み" : "お気に入り"}</span></button><button onClick={() => toggleCart(item)} className={cart.includes(item.id) ? "selected" : ""} aria-label={cart.includes(item.id) ? `削除：${item.title}` : `バッグに追加：${item.title}`}>{tab === "购物袋" ? <Trash2 size={15} /> : cart.includes(item.id) ? <Check size={15} /> : <ShoppingCart size={15} />}</button></div>
        </article>)}</div>}
        {!visible.length && <div className="mina-shop-empty"><ShoppingBag size={32} /><p>{query ? "該当する内容はありません" : tab === "收藏" ? "お気に入りはまだありません。おすすめを見てみましょう。" : tab === "购物袋" ? "バッグは空です。" : tab === "订单" ? "注文履歴はまだありません。" : "新しいおすすめはまだありません。"}</p></div>}
        {tab === "购物袋" && cartItems.length > 0 && <div className="mina-shop-cart-total"><p>買い物リスト · {cartItems.length} 件<strong>{totalText}</strong></p><button onClick={() => { setNotice("このスマートフォンにリストを保存しました。実際の注文は行いません。"); p.onUi?.("shop-list-saved", true); }}><Check size={15} />リストを保存</button><small>この作品内のバッグ · 決済や注文は行いません</small></div>}
      </div>
      <nav className="mina-shop-tabs">{[{name:"精选",Icon:Home},{name:"收藏",Icon:Heart},{name:"购物袋",Icon:ShoppingBag},{name:"订单",Icon:Package}].map(({name,Icon}) => <button key={name} className={tab === name ? "selected" : ""} onClick={() => changeTab(name)}><span><Icon size={21} />{name === "购物袋" && cartItems.length > 0 && <i className="mina-shop-count">{cartItems.length}</i>}</span><small>{ja(name)}</small></button>)}</nav>
    </div>
  );
}
