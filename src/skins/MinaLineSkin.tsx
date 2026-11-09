import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, MessageCircle, MoreHorizontal, Search, Smile, Users, X } from "lucide-react";
import type { Props } from "./shared";
import { LineSkin } from "./MessagingSkins";
import { minaLineLastMessage, minaLineMemories, minaLineThreadName } from "./minaLineMemories";
import "./mina-line-memory.css";

const fmt = (day: string) => {
  const [year, month, date] = day.split("-");
  return year + "年" + Number(month) + "月" + Number(date) + "日";
};

/** 2014–2015 archive is always shown from the owner Mina's viewpoint. */
export function MinaLineSkin(p: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"トーク" | "友だち">("トーク");
  const [translations, setTranslations] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inMemory = p.thread === minaLineThreadName;

  useEffect(() => {
    if (inMemory && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [inMemory]);

  // Existing authored LINE threads are left intact.
  if (p.thread && !inMemory) return <LineSkin {...p} />;

  const otherThreads = [...new Set(p.items.map((item) => item.title))]
    .filter((title) => title && title !== minaLineThreadName)
    .filter((title) => (title + p.items.filter((i) => i.title === title).map((i) => i.body).join(" ")).toLowerCase().includes(searchQuery.toLowerCase()));

  const showMemory = (minaLineThreadName + minaLineLastMessage.text).toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery.trim();

  return (
    <section className="catalog-skin mina-line" data-view={inMemory ? "memory" : tab} aria-label="LINE — 2014年から2015年のトーク">
      {inMemory ? (
        <>
          <header className="mina-line-thread-header">
            <button aria-label="トーク一覧へ戻る" onClick={() => { p.onThread(""); setTranslations(false); setMenuOpen(false); }}><ChevronLeft size={24} /></button>
            <strong>{minaLineThreadName}</strong>
            <button aria-label="最初のメッセージへ" title="最初から読む" onClick={() => threadRef.current?.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={20}/></button>
            <button aria-label="トークメニュー" aria-expanded={menuOpen} onClick={() => setMenuOpen((v)=>!v)}><MoreHorizontal size={22}/></button>
          </header>
          {menuOpen && <div className="mina-line-thread-menu">
            <button onClick={() => { setTranslations((v)=>!v); setMenuOpen(false); }}>{translations ? "日本語だけ表示" : "中国語訳を表示"}</button>
            <button onClick={() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }); setMenuOpen(false); }}>最後のメッセージへ</button>
          </div>}
          <div className="mina-line-messages" ref={threadRef} aria-label="2014年から2015年のトーク履歴">
            <div className="mina-line-memory-marker">2014 · あの夏から</div>
            {minaLineMemories.map((message, index) => {
              const isMina = message.from === "mina";
              const newDate = index === 0 || minaLineMemories[index - 1].day !== message.day;
              return <div key={message.id}>
                {newDate && <div className="mina-line-date" aria-label={fmt(message.day)}>{fmt(message.day)}</div>}
                <div className={`mina-line-message ${isMina ? "mine" : "theirs"}`}>
                  <div className="mina-line-message-line">
                    {isMina && <span className="mina-line-time">{message.time}</span>}
                    <div className="mina-line-balloon">
                      <span>{message.text}</span>
                      {translations && message.translation && <small className="mina-line-translation">{message.translation}</small>}
                    </div>
                    {!isMina && <span className="mina-line-time">{message.time}</span>}
                  </div>
                </div>
              </div>;
            })}
            <div className="mina-line-end-spacer" aria-hidden="true"/>
          </div>
          <div className="mina-line-reply-archive">
            <button aria-label="絵文字" disabled><Smile size={20}/></button>
            <span>2014–2015年のトーク履歴</span>
            <button aria-label="最後のメッセージへ" onClick={() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" })}><ArrowDown size={20}/></button>
          </div>
        </>
      ) : (
        <>
          <header className="mina-line-list-header">
            <button aria-label="捡手机に戻る" onClick={p.onBack}><ChevronLeft size={23}/></button>
            <strong>{tab}</strong>
            <span>LINE</span>
          </header>
          <div className="mina-line-list-scroll">
            <div className="mina-line-search"><Search size={18}/><input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="友だち、トークを検索" aria-label="LINEのトークを検索"/>{searchQuery && <button aria-label="検索を消去" onClick={()=>setSearchQuery("")}><X size={16}/></button>}</div>
            <p className="mina-line-list-label">{tab === "トーク" ? "トーク履歴" : "友だち"}</p>
            {showMemory && <button className="mina-line-chat-row" onClick={() => {p.onThread(minaLineThreadName);setMenuOpen(false);}}>
              <span className="mina-line-chat-summary"><strong>{minaLineThreadName}</strong><small>{minaLineLastMessage.text}</small></span>
              <time>{minaLineLastMessage.day.replaceAll("-", "/")}</time>
            </button>}
            {otherThreads.map((title) => {
              const entries = p.items.filter((item)=>item.title===title);
              const last = entries[entries.length-1];
              return <button className="mina-line-chat-row" key={title} onClick={()=>p.onThread(title)}>
                <span className="mina-line-avatar secondary">{title.slice(0,1)}</span>
                <span className="mina-line-chat-summary"><strong>{title}</strong><small>{last?.body}</small></span><time>{last?.time?.slice(0,10)}</time>
              </button>;
            })}
            {!showMemory && !otherThreads.length && <p className="mina-line-empty">該当するトークはありません。</p>}
          </div>
          <nav className="mina-line-tabs" aria-label="LINE ナビゲーション">
            <button aria-current={tab==="友だち"?"page":undefined} onClick={()=>setTab("友だち")}><Users size={23}/><span>友だち</span></button>
            <button aria-current={tab==="トーク"?"page":undefined} onClick={()=>setTab("トーク")}><MessageCircle size={23}/><span>トーク</span></button>
          </nav>
        </>
      )}
    </section>
  );
}
