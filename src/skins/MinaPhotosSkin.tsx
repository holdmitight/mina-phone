import { useState } from "react";
import { ArrowLeft, Heart, Images } from "lucide-react";
import { useSkinState } from "../skinState";
import { Header, type Props } from "./shared";
import "./mina-photos.css";

const photos = [
  { id: "mina-pink-hairdryer", src: "data:image/webp;base64,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", title: "ピンクの午後", date: "2026.11.09" },
  { id: "mina-pink-bunny", src: "./mina-media/gallery/mina-pink-bunny.svg", title: "うさぎといっしょ", date: "2026.11.09" },
] as const;

/** Mina's fan-fiction photo album: only the two expressly selected images. */
export function MinaPhotosSkin(p: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useSkinState<string>(p, "mina-photo-tab", "最近の項目");
  const [favorites, setFavorites] = useSkinState<string[]>(p, "mina-photo-favorites", []);
  const current = photos.find((photo) => photo.id === selected);
  const visible = tab === "お気に入り" ? photos.filter((photo) => favorites.includes(photo.id)) : photos;
  const toggle = (id: string) => setFavorites((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]);

  return (
    <div className="catalog-skin mina-photo-gallery">
      {current ? (
        <>
          <header className="mina-photo-view-header">
            <button onClick={() => setSelected(null)} aria-label="写真一覧に戻る"><ArrowLeft size={21} /> 戻る</button>
            <span>{current.date}</span>
            <button onClick={() => toggle(current.id)} aria-label={favorites.includes(current.id) ? "お気に入りを解除" : "お気に入りに追加"} aria-pressed={favorites.includes(current.id)}>
              <Heart size={22} fill={favorites.includes(current.id) ? "#f083a9" : "none"} color={favorites.includes(current.id) ? "#f083a9" : "#383838"} />
            </button>
          </header>
          <div className="mina-photo-view"><img src={current.src} alt={current.title} /></div>
          <footer className="mina-photo-view-footer">{current.title}<small>MINA · AFTER HOURS</small></footer>
        </>
      ) : (
        <>
          <Header p={p} />
          <div className="catalog-scroll mina-photo-list">
            <div className="mina-photo-heading"><small>MINA · AFTER HOURS</small><h1>写真</h1></div>
            <nav className="mina-photo-tabs" aria-label="アルバムの表示">
              {["最近の項目", "お気に入り"].map((name) =>
                <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>
              )}
            </nav>
            <div className="mina-photo-album-label"><span><Images size={16}/> {tab}</span><small>{visible.length}枚</small></div>
            <div className="mina-photo-tiles">
              {visible.map((photo) => (
                <button key={photo.id} onClick={() => setSelected(photo.id)} aria-label={photo.title + "を見る"}>
                  <img src={photo.src} alt={photo.title} />
                  {favorites.includes(photo.id) && <Heart size={15} fill="#fff" />}
                </button>
              ))}
            </div>
            {!visible.length && <p className="mina-photo-empty">まだお気に入りの写真がありません。</p>}
          </div>
          <footer className="mina-photo-bottom">{visible.length}枚の写真</footer>
        </>
      )}
    </div>
  );
}
