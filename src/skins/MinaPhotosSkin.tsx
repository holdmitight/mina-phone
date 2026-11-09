import { useState } from "react";
import { ArrowLeft, Heart, Images } from "lucide-react";
import { useSkinState } from "../skinState";
import { Header, type Props } from "./shared";
import "./mina-photos.css";

const photos = [
  { id: "mina-pink-hairdryer", src: "./mina-media/gallery/mina-pink-hairdryer.svg", title: "ピンクの午後", date: "2026.11.09" },
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
