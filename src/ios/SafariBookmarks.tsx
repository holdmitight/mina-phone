/**
 * Fictional, low-key website pages for the three saved Safari bookmarks.
 * Keep clues ambient: these should read like everyday public webpages, not
 * notes from a character explaining the story.
 */
export const curatedSafariTitles = [
  "少し静かなカフェ",
  "今夜の映画リスト",
  "スープの温め直し方",
] as const;

export function isCuratedSafariBookmark(title: string): boolean {
  return curatedSafariTitles.some((candidate) => candidate === title.trim());
}

export function SafariBookmarkPage({ title }: { title: string }) {
  switch (title.trim()) {
    case "少し静かなカフェ":
      return (
        <article className="safari-bookmark-site safari-cafe-site" aria-label={title}>
          <header className="safari-site-masthead">
            <span className="safari-site-brand">cozy café</span>
            <span className="safari-site-nav">ABOUT　 MENU　 NEWS</span>
          </header>
          <div className="safari-cafe-hero">
            <span className="safari-hero-eyebrow">A LITTLE QUIET PLACE</span>
            <span className="safari-cafe-cup" aria-hidden="true">☕</span>
            <h1>少し、静かな時間を。</h1>
            <p>窓辺の小さなテーブルと、淹れたてのコーヒー。</p>
          </div>
          <div className="safari-site-body">
            <span className="safari-section-kicker">OUR PLACE</span>
            <h2>お店のこと</h2>
            <p>通りから一本入ったところにある、小さなカフェです。窓側には二人掛けの席が三つ、奥にはひとりで過ごせるカウンターがあります。</p>
            <p>午後は少し日差しが入り、夕方になると店内の音も落ち着きます。読書も、ちょっとした休憩も、お好きなように。</p>
            <div className="safari-cafe-menu">
              <span className="safari-section-kicker">TODAY'S MENU</span>
              <div><strong>カフェラテ</strong><small>ミルク多めにもできます</small></div>
              <div><strong>はちみつトースト</strong><small>焼きたてをご用意しています</small></div>
              <div><strong>季節のスープ</strong><small>内容は店内の黒板をご覧ください</small></div>
            </div>
            <p className="safari-site-footnote">席の予約は受け付けていません。混雑時は少しお待ちいただく場合があります。</p>
          </div>
          <footer className="safari-site-footer">cozy café　·　small days, good coffee</footer>
        </article>
      );
    case "今夜の映画リスト":
      return (
        <article className="safari-bookmark-site safari-movie-site" aria-label={title}>
          <header className="safari-site-masthead">
            <span className="safari-site-brand">night screen</span>
            <span className="safari-site-nav">FILMS　 NOTES　 ARCHIVE</span>
          </header>
          <div className="safari-movie-hero">
            <span className="safari-hero-eyebrow">WEEKLY WATCHLIST</span>
            <h1>今夜の映画リスト</h1>
            <p>眠る前に、気分で選ぶ三本。</p>
            <time>2025.11.04　/　編集部メモ</time>
          </div>
          <div className="safari-site-body">
            <section className="safari-movie-entry">
              <span className="safari-movie-number">01</span>
              <div><h2>雨の日に観たい短編</h2><p>窓の外を眺めたくなるような、台詞の少ない作品。長くないので、平日の夜にも。</p><small>SHORT FILM　·　静かな気分の日に</small></div>
            </section>
            <section className="safari-movie-entry">
              <span className="safari-movie-number">02</span>
              <div><h2>少し古いコメディ</h2><p>何度観ても笑える場面がある。予定のない夜は、こういう軽い一本がちょうどいい。</p><small>COMEDY　·　気楽に観たいとき</small></div>
            </section>
            <section className="safari-movie-entry">
              <span className="safari-movie-number">03</span>
              <div><h2>景色のきれいな旅映画</h2><p>大きな出来事は起きないけれど、移動中の風景と音楽が印象に残る作品。</p><small>ROAD MOVIE　·　週末向け</small></div>
            </section>
            <p className="safari-site-footnote">配信状況は変更になる場合があります。観たい作品は各サービスでご確認ください。</p>
          </div>
          <footer className="safari-site-footer">night screen　©　film notes</footer>
        </article>
      );
    case "スープの温め直し方":
      return (
        <article className="safari-bookmark-site safari-soup-site" aria-label={title}>
          <header className="safari-site-masthead">
            <span className="safari-site-brand">warm table</span>
            <span className="safari-site-nav">RECIPE　 KITCHEN　 TIPS</span>
          </header>
          <div className="safari-soup-hero">
            <span className="safari-hero-eyebrow">KITCHEN TIP / 保存版</span>
            <h1>スープの温め直し方</h1>
            <p>作り置きのスープを、おいしく食べるための小さなコツ。</p>
            <div className="safari-soup-metadata"><span>調理のコツ</span><span>読む時間：約2分</span></div>
          </div>
          <div className="safari-site-body">
            <h2>鍋で温めるとき</h2>
            <p>冷蔵したスープは鍋に移し、底からゆっくり混ぜながら温めます。具材の中心まで十分に熱くなるようにしてください。</p>
            <ol className="safari-soup-steps">
              <li>スープを鍋に移し、全体を一度かき混ぜる。</li>
              <li>焦げつかないよう、ときどき底から混ぜる。</li>
              <li>全体がしっかり熱くなったら器に注ぐ。</li>
            </ol>
            <h2>ちょっとしたメモ</h2>
            <p>温めるうちに煮詰まったら、水やだしを少しずつ足して味を調整します。ミルク入りのものは分離しないよう様子を見ながら。</p>
            <div className="safari-soup-note"><strong>保存について</strong><p>作ったら早めに冷まして冷蔵し、長く置いたものや状態が不明なものは食べないようにしましょう。</p></div>
            <p className="safari-site-footnote">食材や保存状態によって適切な扱いは異なります。</p>
          </div>
          <footer className="safari-site-footer">warm table　·　毎日の台所ノート</footer>
        </article>
      );
    default:
      return null;
  }
}
