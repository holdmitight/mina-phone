import { useRef, useState, type ChangeEvent } from "react";
import { Camera, ChevronLeft, ChevronRight, Clock3, Home, Menu, Minus, Search, ShoppingCart, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { useSkinState } from "../skinState";
import type { Props } from "./shared";
import { amazonReferenceImages } from "./amazonReferenceImages";
import "./mina-amazon.css";

/** An offline, fictional Amazon Japan experience populated from the owner's reference screenshots. */
export const amazonCartCatalog = [
  {
    id: "jmbricklayer-retro",
    title: "JMBricklayer レトロゲーム・パソコン・ラジオのブロック 3合1 大人向け組み立て",
    price: 6799,
    points: 0,
    availability: "在庫あり",
    subtext: "",
    image: amazonReferenceImages.retro,
  },
  {
    id: "lego-wallace",
    title: "レゴ(LEGO) アイデア Wallace & Gromit 21371 おもちゃ",
    price: 16980,
    points: 170,
    availability: "通常2〜5週間以内に発送します。",
    subtext: "",
    image: amazonReferenceImages.wallace,
  },
  {
    id: "lego-ferrari",
    title: "レゴ(LEGO) スピードチャンピオン Ferrari SF-24 F1 レースカー",
    price: 3222,
    points: 32,
    availability: "在庫あり",
    subtext: "過去1か月で100点以上購入されました",
    image: amazonReferenceImages.ferrari,
  },
  {
    id: "lego-elsa",
    title: "レゴ(LEGO) ディズニープリンセス エルサのアイスパレス 43244",
    price: 8880,
    points: 0,
    availability: "",
    subtext: "過去1か月で800点以上購入されました",
    image: amazonReferenceImages.elsa,
  },
] as const;

export const amazonInitialHistory = ["switch2", "lego dragon", "lego 32110", "lego"] as const;
type AmazonProduct = (typeof amazonCartCatalog)[number];
type AmazonScreen = "home" | "search" | "cart" | "results" | "account" | "menu";
const yen = (amount: number) => "¥" + new Intl.NumberFormat("ja-JP").format(amount);

export function MinaAmazonSkin(p: Props) {
  const [screen, setScreen] = useSkinState<string>(p, "amazon-screen", "home");
  const [savedCart, setSavedCart] = useSkinState<string[]>(p, "amazon-cart-lines", amazonCartCatalog.map((item) => item.id + ":1"));
  const [later, setLater] = useSkinState<string[]>(p, "amazon-saved-later", []);
  const [history, setHistory] = useSkinState<string[]>(p, "amazon-search-history", [...amazonInitialHistory]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const cartMap = new Map(
    savedCart.flatMap((entry): [string, number][] => {
      const [id, qty] = entry.split(":");
      const count = Number(qty);
      return amazonCartCatalog.some((p) => p.id === id) && Number.isInteger(count) && count > 0 && count <= 99 ? [[id, count]] : [];
    }),
  );
  const cartEntries = amazonCartCatalog
    .map((product) => ({ product, quantity: cartMap.get(product.id) || 0 }))
    .filter(({ quantity }) => quantity > 0);
  const laterEntries = amazonCartCatalog.filter((item) => later.includes(item.id));
  const quantity = cartEntries.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartEntries.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const points = cartEntries.reduce((sum, item) => sum + item.product.points * item.quantity, 0);
  const results = amazonCartCatalog.filter((product) => {
    const query = activeQuery.toLowerCase().trim();
    return !query || product.title.toLowerCase().includes(query) || (query.includes("lego") && product.id.startsWith("lego"));
  });
  function navigate(destination: AmazonScreen) {
    setScreen(destination);
    setNotice("");
  }
  function adjust(id: string, delta: number) {
    setSavedCart((current) => {
      const counts = new Map(current.map((line) => {
        const [key, value] = line.split(":");
        return [key, Number(value)] as const;
      }));
      const next = Math.min(99, Math.max(0, (counts.get(id) || 0) + delta));
      if (!next) counts.delete(id);
      else counts.set(id, next);
      return amazonCartCatalog.filter((item) => counts.has(item.id))
        .map((item) => item.id + ":" + counts.get(item.id));
    });
  }
  function remove(id: string) {
    setSavedCart((current) => current.filter((item) => !item.startsWith(id + ":")));
  }
  function saveForLater(id: string) {
    remove(id);
    setLater((prev) => prev.includes(id) ? prev : [...prev, id]);
    setNotice("「あとで買う」に移動しました");
  }
  function restore(id: string) {
    setLater((prev) => prev.filter((item) => item !== id));
    adjust(id, 1);
  }
  function submitSearch(text: string) {
    const value = text.trim().slice(0, 100);
    if (!value) return;
    setSearchTerm(value);
    setActiveQuery(value);
    setHistory((prev) => [value, ...prev.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 12));
    navigate("results");
  }
  async function shareProduct(product: AmazonProduct) {
    const message = product.title + " — " + yen(product.price) + "\n(Mina Phone 内のデモ)";
    if (typeof navigator.share === "function") {
      try { await navigator.share({ text: message }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(message); setNotice("商品情報をコピーしました"); return; } catch { /* fallback */ }
    }
    setNotice("共有機能を利用できませんでした");
  }
  function onImageSelected(e: ChangeEvent<HTMLInputElement>) {
    if (e.currentTarget.files?.length) setNotice("画像を選択しました。この作品では画像検索を行いません。");
    e.currentTarget.value = "";
  }
  function cartCard(product: AmazonProduct, count: number) {
    return <article className="amazon-cart-card" key={product.id}>
      <div className="amazon-cart-card-main">
        <img src={product.image} alt={product.title} />
        <div className="amazon-cart-details">
          <h3>{product.title}</h3>
          {product.subtext && <p>{product.subtext}</p>}
          <strong>{yen(product.price)}</strong>
          {product.points > 0 && <p className="amazon-points-small">ポイント： <span>{product.points}pt (1%)</span></p>}
          {product.availability && <p className={product.availability === "在庫あり" ? "amazon-in-stock" : "amazon-delivery-delay"}>{product.availability}</p>}
        </div>
      </div>
      <div className="amazon-cart-actions">
        <div className="amazon-quantity" aria-label={product.title + "の数量"}>
          <button aria-label={product.title + (count === 1 ? "を削除" : "の数量を減らす")} onClick={() => adjust(product.id, -1)}>{count === 1 ? <Trash2 size={18}/> : <Minus size={18}/>}</button>
          <span>{count}</span>
          <button aria-label={product.title + "の数量を増やす"} onClick={() => adjust(product.id, 1)}><span>＋</span></button>
        </div>
        <button className="amazon-outline" onClick={() => remove(product.id)}>削除</button>
        <button className="amazon-outline" onClick={() => saveForLater(product.id)}>あとで買う</button>
        <button className="amazon-outline amazon-share" onClick={() => void shareProduct(product)}>シェアする</button>
      </div>
    </article>;
  }

  const cartTop = <div className="amazon-cart-summary">
    {screen === "cart" && <><p className="amazon-subtotal">小計 <strong>{yen(total)}</strong></p><p className="amazon-earned">獲得ポイント: <span>{points}ポイント</span></p></>}
    <button className="amazon-checkout" onClick={() => setNotice("これはMina Phoneの架空のカートです。実際の注文・決済は行われません。")}>
      レジに進む（{quantity}個の商品）（税込）
    </button>
  </div>;

  return <section className="catalog-skin mina-amazon-app" data-amazon-screen={screen} aria-label="Amazon Japan (fictional)">
    <header className="amazon-top">
      <div className="amazon-search-row">
        {screen === "search" || screen === "results" ?
          <button className="amazon-back" aria-label="戻る" onClick={() => navigate("home")}><ChevronLeft size={23}/></button> :
          <button className="amazon-back amazon-back-home" aria-label="捡手机に戻る" onClick={p.onBack}><ChevronLeft size={19}/></button>
        }
        <form className="amazon-search-pill" onSubmit={(event) => { event.preventDefault(); submitSearch(searchTerm); }}>
          <button type="button" className="amazon-search-icon" aria-label="検索を開く" onClick={() => { navigate("search"); searchRef.current?.focus(); }}><Search size={23}/></button>
          <input
            ref={searchRef}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => { if (screen !== "search") navigate("search"); }}
            placeholder="検索または質問する"
            aria-label="Amazon商品を検索"
          />
          {searchTerm && screen === "search" ?
            <button type="button" className="amazon-clear" aria-label="検索文字を消す" onClick={() => { setSearchTerm(""); searchRef.current?.focus(); }}><X size={17}/></button> :
            <button type="button" className="amazon-image-search" aria-label="画像検索用の写真を選ぶ" onClick={() => imageRef.current?.click()}><Camera size={22}/><Sparkles size={11}/></button>}
        </form>
      </div>
    </header>
    <input ref={imageRef} type="file" accept="image/*" capture="environment" onChange={onImageSelected} hidden aria-label="画像を選択"/>
    {notice && <p className="amazon-notice" role="status">{notice}<button aria-label="閉じる" onClick={() => setNotice("")}><X size={13}/></button></p>}
    {screen === "search" && <div className="amazon-search-content">
      {(searchTerm.trim() ? history.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase())) : history).map((item) =>
        <div className="amazon-search-history-row" key={item}>
          <button onClick={() => submitSearch(item)}><Clock3 size={19}/><span>{item}</span></button>
          <button aria-label={item + "を履歴から削除"} onClick={() => setHistory((prev) => prev.filter((entry) => entry !== item))}><X size={21}/></button>
        </div>
      )}
      {searchTerm.trim() && <button className="amazon-typed-search" onClick={() => submitSearch(searchTerm)}><Search size={18}/><span>「{searchTerm}」を検索</span></button>}
      {!history.length && !searchTerm.trim() && <p className="amazon-empty-note">最近の検索はありません</p>}
    </div>}
    {screen !== "search" && <div className="amazon-scroll">
      {screen === "home" && <>
        <button className="amazon-location" onClick={() => setNotice("この作品は実際の配送先と連携していません。")}><span>⌖</span> オーストラリアにお届け <ChevronRight size={14}/></button>
        <div className="amazon-home-hero">
          <div className="amazon-sale-title"><small>欲しい秋モノ＆冬支度</small><strong>スマイルSale</strong><span>11/12(木) 23:59まで</span></div>
          <div className="amazon-sale-illustration"><span>📦</span><span>🛒</span><span>🎧</span><span>🧩</span></div>
        </div>
        <div className="amazon-login-prompt"><p>おすすめを見るにはログインしてください</p><button onClick={() => navigate("account")}>ログイン</button></div>
        <section className="amazon-home-section">
          <h2>気になるカテゴリー <ChevronRight size={17}/></h2>
          <div className="amazon-category-grid">
            {[
              {name:"ポケモン",symbol:"⚡",color:"#f0f0f0"},
              {name:"すみっコぐらし",symbol:"🐻",color:"#e8f6f5"},
              {name:"ちいかわ",symbol:"🐰",color:"#f7ebed"},
              {name:"ドラゴンボール",symbol:"🚗",color:"#f4edb9"},
              {name:"家電",symbol:"🔌",color:"#ffdfcf"},
              {name:"食品・美容・ペット",symbol:"🧴",color:"#f6d1c3"},
              {name:"レジャー・ホビー",symbol:"🎮",color:"#ebd7c7"},
              {name:"ファッション",symbol:"🎒",color:"#eed9d0"},
            ].map((category) => <button key={category.name} onClick={() => submitSearch(category.name)}>
              <span className="amazon-category-picture" style={{backgroundColor:category.color}}>{category.symbol}</span><small>{category.name}</small>
            </button>)}
          </div>
        </section>
        <section className="amazon-home-section">
          <h2>すぐにお届けのおすすめ商品 <ChevronRight size={17}/></h2>
          <div className="amazon-recommended">
            {amazonCartCatalog.map((product) => <button key={product.id} onClick={() => navigate("cart")}><img src={product.image} alt=""/><strong>{yen(product.price)}</strong></button>)}
          </div>
        </section>
        <button className="amazon-see-cart" onClick={() => navigate("cart")}><ShoppingCart size={18}/> カートの中身を見る（{quantity}点）</button>
      </>}
      {screen === "cart" && <>
        {cartTop}
        {cartEntries.length ? <div className="amazon-cart-products">{cartEntries.map(({product,quantity})=>cartCard(product,quantity))}</div> : <p className="amazon-cart-empty"><ShoppingCart size={28}/> カートに商品はありません。</p>}
        {laterEntries.length > 0 && <section className="amazon-later-list"><h2>あとで買う（{laterEntries.length}）</h2>{laterEntries.map((item) =>
          <div key={item.id}><img src={item.image} alt=""/><span>{item.title}<strong>{yen(item.price)}</strong></span><button onClick={() => restore(item.id)}>カートに戻す</button></div>
        )}</section>}
        <p className="amazon-disclaimer">Mina Phone内のサンプル画面です。実際の注文・決済は行われません。Amazonとの同期もありません。</p>
      </>}
      {screen === "results" && <section className="amazon-results">
        <h2>「{activeQuery}」の検索結果</h2>
        <p>{results.length}件の商品</p>
        {results.map((product) => <article key={product.id}>
          <img src={product.image} alt=""/>
          <div><h3>{product.title}</h3><strong>{yen(product.price)}</strong>
            <button onClick={() => {adjust(product.id,1); navigate("cart"); setNotice("カートに追加しました");}}>カートに追加</button>
          </div>
        </article>)}
        {!results.length && <p className="amazon-empty-note">該当する商品はありません。</p>}
      </section>}
      {screen === "account" && <div className="amazon-account"><UserRound size={42}/><h2>MINAのアカウント</h2><p>これは捡手机内の架空のAmazon画面です。実際のアカウントへのログインはありません。</p><button onClick={() => navigate("cart")}>カートを見る</button></div>}
      {screen === "menu" && <div className="amazon-menu"><h2>メニュー</h2><button onClick={() => navigate("cart")}>カート <ChevronRight size={18}/></button><button onClick={() => navigate("search")}>検索履歴 <ChevronRight size={18}/></button><button onClick={() => navigate("account")}>アカウント <ChevronRight size={18}/></button></div>}
    </div>}
    {screen !== "search" && <nav className="amazon-bottom-nav" aria-label="Amazonナビゲーション">
      <button aria-label="ホーム" aria-pressed={screen==="home"} onClick={() => navigate("home")}><Home size={26}/></button>
      <button aria-label="アカウント" aria-pressed={screen==="account"} onClick={() => navigate("account")}><UserRound size={26}/></button>
      <button aria-label="カート" aria-pressed={screen==="cart"} onClick={() => navigate("cart")} className="amazon-cart-nav"><ShoppingCart size={27}/>{quantity>0&&<span>{quantity}</span>}</button>
      <button aria-label="メニュー" aria-pressed={screen==="menu"} onClick={() => navigate("menu")}><Menu size={26}/></button>
      <button aria-label="Amazonアシスタント" onClick={() => setNotice("この作品はAmazonのAIアシスタントには接続されていません。")}><span className="amazon-assistant-symbol"><i/><i/><i/></span></button>
    </nav>}
  </section>;
}
