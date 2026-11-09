import { useState, type FormEvent } from "react";
import {
  ArrowLeft, AudioLines, Check, ChevronRight, CirclePlus, Clock3, Headphones,
  Home, LibraryBig, ListMusic, Mic2, MoreHorizontal, Pause, Play, Plus,
  Search, Speaker, X,
} from "lucide-react";
import { useSkinState } from "../skinState";
import type { Props } from "./shared";
import { spotifyReferenceArt } from "./spotifyReferenceArt";
import "./mina-spotify.css";

type SpotifyScreen = "home" | "search" | "library" | "create";
type Entry = { id: string; title: string; artwork: keyof typeof spotifyReferenceArt; subtitle?: string };
const quickPlaylists: Entry[] = [
  { id: "rnb", title: "Asian R&B + Pop", artwork: "rnb" },
  { id: "pages", title: "pages vibe", artwork: "pages" },
  { id: "kpop", title: "K-Pop ON! (온)", artwork: "kpop" },
  { id: "korean", title: "Korean Pop Mix", artwork: "korean" },
  { id: "pophits", title: "Top Pop Hits 2015–2026", artwork: "pophits" },
  { id: "asian", title: "Asian artists (English songs)", artwork: "asian" },
  { id: "ost", title: "Best of Korean OSTs", artwork: "ost" },
];
const featuredPlaylists: Entry[] = [
  { id: "kimbops", title: "KimBops!", subtitle: "BTS、KATSEYE、ILLIT、LE SSERAFIM、HUNTR/X", artwork: "kimbops" },
  { id: "tokyo", title: "TOKYO SUPER HITS", subtitle: "Mrs. GREEN APPLE、Vaundy、M!LK、藤井 風", artwork: "tokyo" },
];
const recommended: Entry[] = [
  { id: "illit", title: "You're Under Arrest (Remixes)", subtitle: "ILLIT", artwork: "illit" },
  { id: "kinggnu", title: "Don't Stop the Clocks", subtitle: "King Gnu", artwork: "kinggnu" },
  { id: "akb", title: "ハート型ウイルス (Team A)", subtitle: "AKB48", artwork: "akb" },
  { id: "energetic", title: "Energetic K-Pop Mix", subtitle: "Spotify", artwork: "energetic" },
];
export const spotifyInitialSearches = [
  "ハート型ウイルス (Team A)",
  "Energetic K-Pop Mix",
  "Don't Stop the Clocks",
] as const;
const allEntries: Entry[] = [...quickPlaylists, ...featuredPlaylists, ...recommended];
const resolveEntry = (id: string) => allEntries.find((entry) => entry.id === id);
function Artwork({ item, className = "" }: { item: Entry; className?: string }) {
  return <img className={className} src={spotifyReferenceArt[item.artwork]} alt={item.title + " のアートワーク"} />;
}

export function MinaSpotifySkin(p: Props) {
  const [screen, setScreen] = useSkinState<string>(p, "mina-spotify-screen", "home");
  const [history, setHistory] = useSkinState<string[]>(p, "mina-spotify-history", [...spotifyInitialSearches]);
  const [saved, setSaved] = useSkinState<string[]>(p, "mina-spotify-liked", ["kinggnu"]);
  const [created, setCreated] = useSkinState<string[]>(p, "mina-spotify-created", []);
  const [currentId, setCurrentId] = useSkinState<string>(p, "mina-spotify-current", "kinggnu");
  const [playing, setPlaying] = useState(true);
  const [homeFilter, setHomeFilter] = useState("すべて");
  const [query, setQuery] = useState("");
  const [searchEdit, setSearchEdit] = useState(false);
  const [selected, setSelected] = useState("");
  const [draftName, setDraftName] = useState("");
  const [notice, setNotice] = useState("");
  const current = resolveEntry(currentId) ?? recommended[1];
  const selectedEntry = resolveEntry(selected);
  const searched = query.trim().toLocaleLowerCase();
  const results = allEntries.filter((entry) =>
    (entry.title + " " + (entry.subtitle ?? "")).toLocaleLowerCase().includes(searched)
  );
  const historyEntries = history.filter((value) => !searched || value.toLocaleLowerCase().includes(searched));
  const typedSearch = Boolean(searchEdit || query.trim());

  function openScreen(next: SpotifyScreen) {
    setScreen(next);
    setSelected("");
    setSearchEdit(false);
    setQuery("");
    setNotice("");
  }
  function searchFor(value: string) {
    const text = value.trim().slice(0, 120);
    if (!text) return;
    setHistory((before) => [text, ...before.filter((item) => item.toLocaleLowerCase() !== text.toLocaleLowerCase())].slice(0, 12));
    setQuery(text);
    setSearchEdit(true);
  }
  function viewEntry(entry: Entry) {
    setSelected(entry.id);
    setNotice("");
  }
  function setSong(entry: Entry) {
    setCurrentId(entry.id);
    setPlaying(true);
    setNotice("デモ表示です。音楽のストリーミング再生はできません。");
  }
  function toggleSave(id: string) {
    setSaved((before) => before.includes(id) ? before.filter((value) => value !== id) : [...before, id]);
  }
  function togglePlaying() {
    setPlaying((before) => !before);
    setNotice("デモ表示です。音声は再生されません。");
  }
  function addPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim().slice(0, 60);
    if (!name) return;
    setCreated((before) => before.includes(name) ? before : [...before, name]);
    setDraftName("");
    setNotice("プレイリスト「" + name + "」を作成しました。");
    setScreen("library");
  }
  return <section className="catalog-skin mina-spotify" aria-label="Spotify デモ" data-spotify-screen={screen}>
    {selectedEntry ? (
      <div className="mina-spotify-detail-top">
        <button onClick={() => setSelected("")} aria-label="前の画面に戻る"><ArrowLeft size={23}/></button>
        <span>プレイリスト</span>
        <button aria-label="その他" onClick={() => setNotice("この画面はデモです。")}><MoreHorizontal size={23}/></button>
      </div>
    ) : screen === "home" ? (
      <header className="mina-spotify-home-header">
        <button className="mina-spotify-profile" aria-label="プロフィール" onClick={() => openScreen("library")}>み</button>
        <nav aria-label="ホームのカテゴリ">
          {["すべて", "音楽", "Podcast", "オーディオブック"].map((filter) =>
            <button key={filter} className={homeFilter === filter ? "active" : ""} aria-pressed={homeFilter === filter} onClick={() => setHomeFilter(filter)}>{filter}</button>)}
        </nav>
      </header>
    ) : null}

    <div className="mina-spotify-scroll">
      {selectedEntry ? (
        <div className="mina-spotify-detail">
          <Artwork item={selectedEntry} className="mina-spotify-detail-art"/>
          <h1>{selectedEntry.title}</h1>
          <p>{selectedEntry.subtitle ?? "あなたの音楽ライブラリ"}</p>
          <div className="mina-spotify-detail-actions">
            <button className={saved.includes(selectedEntry.id) ? "liked" : ""} onClick={() => toggleSave(selectedEntry.id)} aria-label={saved.includes(selectedEntry.id)?"ライブラリから削除":"ライブラリに保存"}>
              {saved.includes(selectedEntry.id) ? <Check size={23}/> : <CirclePlus size={23}/>}
            </button>
            <button className="mina-spotify-large-play" aria-label="デモの再生状態を切り替える" onClick={() => setSong(selectedEntry)}><Play size={25} fill="currentColor"/></button>
          </div>
          <p className="mina-spotify-detail-caption">おすすめの曲</p>
          {(p.items.length ? p.items.slice(0,6).map((item) => ({
            id: "story-"+item.id,title:item.title,subtitle:item.sender,artwork:selectedEntry.artwork,
          })) : [recommended[1],recommended[0],recommended[2]]).map((item) =>
            <button className="mina-spotify-detail-song" key={item.id} onClick={() => setSong(item as Entry)}>
              <Artwork item={item as Entry}/><span><strong>{item.title}</strong><small>{item.subtitle || "Spotify"}</small></span><Play size={17}/>
            </button>)}
        </div>
      ) : screen === "home" ? (
        <>
          {["すべて","音楽"].includes(homeFilter) ? <>
            <div className="mina-spotify-quick-grid">{quickPlaylists.map((item) =>
              <button key={item.id} onClick={() => viewEntry(item)}><Artwork item={item}/><strong>{item.title}</strong></button>
            )}</div>
            <button className="mina-spotify-ai" onClick={() => setNotice("このデモではAIプレイリストの作成には対応していません。")}>
              <AudioLines size={19}/><span>次に聴きたい曲をSpotifyに伝えよう</span><small>ベータ版</small><Mic2 size={17}/>
            </button>
            <div className="mina-spotify-release-label"><Artwork item={featuredPlaylists[0]}/><span>最新リリース：<strong>ILLIT</strong></span></div>
            <div className="mina-spotify-release-card">
              <Artwork item={recommended[0]}/>
              <div><small>シングル</small><h3>You're Under Arrest (Remixes)</h3><p>ILLIT</p>
                <div className="mina-spotify-release-actions">
                  <button aria-label="ライブラリに追加" onClick={() => toggleSave("illit")}>{saved.includes("illit")?<Check size={19}/>:<CirclePlus size={19}/>}</button>
                  <button aria-label="ILLITの曲を選択" onClick={() => setSong(recommended[0])}><Play size={24} fill="currentColor"/></button>
                </div>
              </div>
            </div>
            <h2 className="mina-spotify-section-title">今日の人気プレイリスト</h2>
            <div className="mina-spotify-featured-grid">{featuredPlaylists.map((entry) =>
              <button key={entry.id} onClick={() => viewEntry(entry)}><Artwork item={entry}/><span>{entry.subtitle}</span></button>
            )}</div>
          </> : <div className="mina-spotify-filter-empty">
            {homeFilter === "Podcast" ? <Mic2 size={32}/> : <Headphones size={32}/>}
            <h2>{homeFilter}</h2><p>このカテゴリのコンテンツはまだありません。</p>
            <button onClick={() => setHomeFilter("すべて")}>すべてを見る</button>
          </div>}
        </>
      ) : screen === "search" ? (
        <>
          <div className="mina-spotify-search-top">
            {typedSearch ? <button aria-label="検索を閉じる" onClick={() => {setSearchEdit(false);setQuery("");}}><ArrowLeft size={24}/></button> :
              <><span className="mina-spotify-profile">み</span><strong>検索</strong><button className="mina-spotify-search-camera" aria-label="カメラは利用できません" onClick={() => setNotice("このデモではカメラ検索は利用できません。")}><Headphones size={20}/></button></>}
          </div>
          <form className="mina-spotify-search-form" onSubmit={(e) => {e.preventDefault();searchFor(query);}}>
            <Search size={22}/><input value={query} onChange={(e)=>{setQuery(e.target.value);setSearchEdit(true);}} onFocus={()=>setSearchEdit(true)} aria-label="音楽を検索" placeholder="何を聴きたいですか？"/>
            {query && <button type="button" aria-label="入力を消す" onClick={()=>setQuery("")}><X size={18}/></button>}
          </form>
          {typedSearch ? (
            <div className="mina-spotify-recent">
              <h2>{searched ? "検索結果" : "最近の検索"}</h2>
              {!searched ? historyEntries.map((term) => {
                const found = allEntries.find((entry)=>entry.title===term);
                return <div className="mina-spotify-history-row" key={term}>
                  {found ? <button className="mina-spotify-history-main" onClick={()=>{searchFor(term);viewEntry(found);}}><Artwork item={found}/><span><strong>{term}</strong><small>{found.subtitle||"プレイリスト"}</small></span></button> :
                    <button className="mina-spotify-history-main" onClick={()=>searchFor(term)}><Clock3 size={22}/><span><strong>{term}</strong><small>最近検索した項目</small></span></button>}
                  <button className="mina-spotify-history-remove" aria-label={term+"を履歴から削除"} onClick={()=>setHistory((values)=>values.filter((entry)=>entry!==term))}><X size={20}/></button>
                </div>;
              }) : results.map((entry) => <button className="mina-spotify-search-result" key={entry.id} onClick={()=>{searchFor(entry.title);viewEntry(entry);}}><Artwork item={entry}/><span><strong>{entry.title}</strong><small>{entry.subtitle || "プレイリスト"}</small></span><ChevronRight size={16}/></button>)}
              {searched && !results.length && <p className="mina-spotify-no-results">一致するコンテンツはありません。</p>}
              {!searched && history.length > 0 && <button className="mina-spotify-clear-history" onClick={()=>setHistory([])}>検索履歴を削除</button>}
            </div>
          ) : (
            <>
              <h2 className="mina-spotify-search-title">ジャンルを探す</h2>
              <div className="mina-spotify-category-grid">
                {[
                  {name:"音楽",className:"music",art:recommended[0]},
                  {name:"ポッドキャスト",className:"podcast",art:featuredPlaylists[0]},
                  {name:"オーディオブック",className:"books",art:featuredPlaylists[1]},
                  {name:"ライブイベント",className:"live",art:quickPlaylists[2]},
                ].map((category)=><button key={category.name} className={category.className} onClick={()=>{setQuery(category.name);setSearchEdit(true);}}><strong>{category.name}</strong><Artwork item={category.art}/></button>)}
              </div>
              <h2 className="mina-spotify-search-title">おすすめのプレイリスト</h2>
              <div className="mina-spotify-browse-grid">{[quickPlaylists[2],quickPlaylists[3],featuredPlaylists[0]].map((entry)=><button key={entry.id} onClick={()=>viewEntry(entry)}><Artwork item={entry}/><strong>{entry.title}</strong></button>)}</div>
            </>
          )}
        </>
      ) : screen === "library" ? (
        <div className="mina-spotify-library">
          <h1>マイライブラリ</h1>
          <div className="mina-spotify-library-actions"><button onClick={()=>openScreen("create")}><Plus size={16}/>プレイリストを作成</button></div>
          {saved.map((id)=>{const entry=resolveEntry(id);return entry && <button className="mina-spotify-library-row" key={id} onClick={()=>viewEntry(entry)}><Artwork item={entry}/><span><strong>{entry.title}</strong><small>保存済み</small></span><ChevronRight size={18}/></button>})}
          {created.map((name)=><div className="mina-spotify-library-row" key={name}><span className="mina-spotify-custom-art"><ListMusic size={26}/></span><span><strong>{name}</strong><small>マイプレイリスト</small></span></div>)}
          {!saved.length && !created.length && <p className="mina-spotify-no-results">保存されたプレイリストはありません。</p>}
        </div>
      ) : (
        <div className="mina-spotify-create">
          <h1>プレイリストを作成</h1>
          <p>自分だけのプレイリストを作ろう。</p>
          <form onSubmit={addPlaylist}><input value={draftName} onChange={(e)=>setDraftName(e.target.value)} maxLength={60} placeholder="プレイリストの名前" aria-label="プレイリストの名前"/><button disabled={!draftName.trim()} type="submit">作成する</button></form>
        </div>
      )}
    </div>
    {notice && <p className="mina-spotify-notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="通知を閉じる"><X size={14}/></button></p>}
    <div className="mina-spotify-bottom">
      <div className="mina-spotify-mini-player">
        <button onClick={()=>viewEntry(current)} aria-label={current.title+"の詳細を見る"} className="mina-spotify-mini-cover"><Artwork item={current}/></button>
        <button className="mina-spotify-mini-text" onClick={()=>viewEntry(current)}><strong>{current.title}</strong><small>{current.subtitle||"Spotify"}</small></button>
        <button className="mina-spotify-device" aria-label="再生デバイス情報" onClick={()=>setNotice("このデモはデバイスに接続していません。")}><Speaker size={20}/></button>
        <button className="mina-spotify-like" aria-label="保存を切り替える" onClick={()=>toggleSave(current.id)}>{saved.includes(current.id)?<Check size={18}/>:<CirclePlus size={19}/>}</button>
        <button className="mina-spotify-pause" aria-label={playing?"一時停止（デモ）":"再生（デモ）"} onClick={togglePlaying}>{playing?<Pause size={24} fill="currentColor"/>:<Play size={24} fill="currentColor"/>}</button>
        <div className="mina-spotify-progress"/>
      </div>
      <nav className="mina-spotify-bottom-nav" aria-label="Spotifyのナビゲーション">
        {[
          {id:"home",label:"ホーム",icon:Home},
          {id:"search",label:"検索",icon:Search},
          {id:"library",label:"マイライブラリ",icon:LibraryBig},
          {id:"create",label:"作成する",icon:Plus},
        ].map((tab)=>{const Icon=tab.icon;return <button key={tab.id} aria-current={screen===tab.id?"page":undefined} onClick={()=>openScreen(tab.id as SpotifyScreen)}><Icon size={25} fill={screen===tab.id&&tab.id==="home"?"currentColor":"none"}/><small>{tab.label}</small></button>})}
      </nav>
    </div>
  </section>;
}
