import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Phone } from "../Phone";
import { validateWork, type Work } from "../schema";
import "../styles.css";
import "./player.css";
import "./mina.css";
function StoryPlayer() {
  const [work, setWork] = useState<Work | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    fetch(
      new URLSearchParams(location.search).get("preview") === "test"
        ? "./test-work.json"
        : new URLSearchParams(location.search).get("template") === "blank"
          ? "./blank-work.json"
          : "./work.json",
      { signal: abort.signal },
    )
      .then((r) => {
        if (!r.ok) throw Error("作品データが見つかりません。ページを再読み込みしてください。");
        return r.json();
      })
      .then((x) => {
        const w = validateWork(x);
        document.title =
          w.title === "捡手机" ? "スマートフォン" : w.title + " · スマートフォン";
        setWork(w);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e));
      });
    return () => abort.abort();
  }, []);
  return (
    <main className="story-runtime">
      {work ? (
        <Phone work={work} />
      ) : (
        <p role="status">{error || "MINA のスマートフォンを開いています…"}</p>
      )}
      <div className="mina-runtime-signature" aria-hidden="true"><span>MINA</span><small>AFTER HOURS</small><i>いちばん静かな、好き。</i></div>
      <div className="mina-runtime-credit"><span>MINA · 非公式フィクション</span><a href="./mina-media/credits.html" target="_blank" rel="noreferrer">素材・ライセンス ↗</a></div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<StoryPlayer />);
