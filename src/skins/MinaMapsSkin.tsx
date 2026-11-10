import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock3,
  Coffee,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import type { Item } from "../schema";
import { Header, meta, type Props } from "./shared";
import {
  minaCafeId,
  minaCafeVisitHistory,
  minaStoryMapCopy,
} from "./minaMapStory";
import { MapsSkin } from "./SystemSkins";
import { minaClueKeys } from "./minaStoryInteractions";
import "./mina-maps.css";

type Place = {
  item: Item;
  name: string;
  category: string;
  snippet: string;
  x: number;
  y: number;
};

const bounded = (value: string, fallback: number, low: number, high: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(low, Math.min(high, n)) : fallback;
};

function placesFrom(items: Item[]): Place[] {
  return items.map((item, index) => {
    const copy = minaStoryMapCopy[item.id];
    return {
      item,
      name: copy?.name ?? item.title,
      category: copy?.category ?? "保存済みの場所",
      snippet: copy?.snippet ?? "",
      x: bounded(meta(item, "x", String(24 + index * 19)), 42, 10, 88),
      y: bounded(meta(item, "y", String(30 + index * 15)), 47, 12, 83),
    };
  });
}

export function MinaMapsSkin(p: Props) {
  const isMinaStory =
    p.owner === "名井南" && p.items.some((item) => item.id === minaCafeId);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showVisits, setShowVisits] = useState(false);
  const [activeVisit, setActiveVisit] = useState<string | null>(null);

  // Keep the existing map and all authored locations for other stories.
  if (!isMinaStory) return <MapsSkin {...p} />;

  const allPlaces = placesFrom(p.items);
  const sortedPlaces = [...allPlaces].sort((a, b) =>
    a.item.id === minaCafeId ? -1 : b.item.id === minaCafeId ? 1 : 0,
  );
  const filtered = sortedPlaces.filter((place) =>
    (place.name + " " + place.category)
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const selected = allPlaces.find((place) => place.item.id === selectedId);
  const selectedVisit = minaCafeVisitHistory.find((visit) => visit.id === activeVisit);
  const isCafe = selected?.item.id === minaCafeId;

  const selectPlace = (id: string) => {
    setSelectedId(id);
    setShowVisits(false);
    setActiveVisit(null);
  };

  const backToList = () => {
    setSelectedId(null);
    setShowVisits(false);
    setActiveVisit(null);
  };

  return (
    <div className="catalog-skin mina-maps" aria-label="マップ">
      <Header p={p} />
      <div className="mina-map-stage">
        <svg
          viewBox="0 0 360 440"
          preserveAspectRatio="xMidYMid slice"
          className="mina-map-drawing"
          role="img"
          aria-label="物語の中の架空の街の地図"
        >
          <rect x="0" y="0" width="360" height="440" fill="#edece8" />
          <path d="M0 15L136 0L207 90L360 55L360 190L230 217L154 163L0 191Z" fill="#f5f3ec" />
          <path d="M0 270L142 247L179 337L93 440H0Z" fill="#e7eddf" />
          <path d="M252 0H360V127L283 142L240 77Z" fill="#e1e9db" />
          <path d="M0 330L360 246" fill="none" stroke="#c6dfdf" strokeWidth="35" />
          <path d="M0 330L360 246" fill="none" stroke="#dcebea" strokeWidth="24" />
          <g fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="square">
            <path d="M-35 112L397 11" />
            <path d="M-30 218L390 138" />
            <path d="M-25 402L390 315" />
            <path d="M41 -20L150 464" />
            <path d="M176 -30L274 466" />
            <path d="M307 -20L369 460" />
            <path d="M-30 23L391 428" />
          </g>
          <g fill="none" stroke="#d9d8d4" strokeWidth="1.3">
            <path d="M-35 112L397 11M-30 218L390 138M-25 402L390 315" />
            <path d="M41 -20L150 464M176 -30L274 466M307 -20L369 460" />
          </g>
          <g fill="#dce5d4">
            <rect x="201" y="181" width="43" height="36" rx="7" transform="rotate(-15 201 181)" />
            <rect x="31" y="244" width="57" height="32" rx="6" transform="rotate(-12 31 244)" />
            <rect x="293" y="359" width="42" height="46" rx="6" transform="rotate(-12 293 359)" />
          </g>
          <g fill="#adabb1" fontSize="10" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" opacity=".85">
            <text x="20" y="58" transform="rotate(-12 20 58)">서울</text>
            <text x="226" y="105" transform="rotate(-11 226 105)">STREET</text>
            <text x="20" y="358" transform="rotate(-11 20 358)">PARK</text>
            <text x="278" y="422">SEOUL</text>
          </g>
          <circle cx="178" cy="240" r="8" fill="#438ce9" stroke="#fff" strokeWidth="3" />
          <circle cx="178" cy="240" r="19" fill="#438ce9" opacity=".13" />
        </svg>
        <div className="mina-map-region-tag">ソウル · マップ</div>
        {filtered.map((place) => {
          const active = place.item.id === selectedId;
          const cafe = place.item.id === minaCafeId;
          return (
            <button
              key={place.item.id}
              type="button"
              className={`mina-map-marker ${cafe ? "cafe" : ""} ${active ? "active" : ""}`}
              style={{ left: `${place.x}%`, top: `${place.y}%` }}
              aria-label={`地図から${place.name}を開く`}
              aria-pressed={active}
              onClick={() => selectPlace(place.item.id)}
            >
              <span>{cafe ? <Coffee size={18} /> : <MapPin size={18} />}</span>
              {(cafe || active) && <small>{place.name}</small>}
            </button>
          );
        })}
        <span className="mina-map-fiction-label">※ 物語内の架空の地図</span>
      </div>
      <section className="mina-map-sheet" aria-label={selected ? "場所の詳細" : "保存済みの場所"}>
        <div className="mina-map-handle" aria-hidden="true" />
        {selected ? (
          <>
            <div className="mina-map-detail-head">
              <button type="button" aria-label="場所一覧に戻る" onClick={backToList}>
                <ArrowLeft size={18} /> 一覧
              </button>
              <span>場所の詳細</span>
              <Bookmark size={18} fill="#537fdb" color="#537fdb" aria-label="保存済み"/>
            </div>
            <div className="mina-map-detail-scroll">
              <div className="mina-map-detail-title">
                <div className={`mina-map-detail-icon ${isCafe ? "cafe" : ""}`}>
                  {isCafe ? <Coffee size={22} /> : <MapPin size={22} />}
                </div>
                <div>
                  <h2>{selected.name}</h2>
                  <small>{selected.category}</small>
                </div>
              </div>
              <p className="mina-map-location">ソウル · 付近</p>
              <p className="mina-map-description">{selected.snippet}</p>
              {isCafe && (
                <div className="mina-map-history">
                  <button
                    type="button"
                    className="mina-map-history-toggle"
                    aria-expanded={showVisits}
                    onClick={() => {
                      setShowVisits((value) => !value);
                      setActiveVisit(null);
                    }}
                  >
                    <Clock3 size={18} />
                    <span>
                      <strong>訪問履歴</strong>
                      <small>2025年の記録 · {minaCafeVisitHistory.length}件</small>
                    </span>
                    <ChevronRight size={19} className={showVisits ? "expanded" : ""} />
                  </button>
                  {showVisits && (
                    <div className="mina-map-visit-list" aria-label="2025年のカフェ訪問履歴">
                      {minaCafeVisitHistory.map((visit) => (
                        <button
                          key={visit.id}
                          type="button"
                          aria-pressed={activeVisit === visit.id}
                          onClick={() => {
                            setActiveVisit(visit.id);
                            p.onClue?.(minaClueKeys.cafeVisit);
                          }}
                        >
                          <span className="mina-map-visit-dot" />
                          <span>
                            <strong>{visit.date}</strong>
                            <small>訪問した場所</small>
                          </span>
                          <time>{visit.clock}</time>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                      {selectedVisit && (
                        <div className="mina-map-visit-selected">
                          <Navigation size={14} />
                          <span>{selectedVisit.date} · {selectedVisit.clock}</span>
                          <strong>少し静かなカフェ</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <label className="mina-map-search">
              <Search size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="場所を検索"
                aria-label="場所を検索"
              />
              {query && (
                <button type="button" aria-label="検索を消去" onClick={() => setQuery("")}>
                  <X size={17}/>
                </button>
              )}
            </label>
            <div className="mina-map-list-head">
              <strong>保存済みの場所</strong>
              <small>{filtered.length}件</small>
            </div>
            <div className="mina-map-place-list">
              {filtered.map((place) => (
                <button
                  key={place.item.id}
                  type="button"
                  className="mina-map-place-row"
                  onClick={() => selectPlace(place.item.id)}
                >
                  <span className={`mina-map-list-icon ${place.item.id === minaCafeId ? "cafe" : ""}`}>
                    {place.item.id === minaCafeId ? <Coffee size={19}/> : <MapPin size={19}/>}
                  </span>
                  <span>
                    <strong>{place.name}</strong>
                    <small>{place.category}</small>
                  </span>
                  <ChevronRight size={17}/>
                </button>
              ))}
              {!filtered.length && <p className="mina-map-empty">一致する場所が見つかりません。</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
