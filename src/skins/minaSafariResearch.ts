/** Fictional, offline Safari search history used in Mina Phone.
 * The three authored ring searches are preserved verbatim.
 * The later practical searches lead to ordinary hobby advice, not a spoiler.
 */
export const minaSafariRingSearches = [
  "指輪の図面",
  "指輪の作り方",
  "かわいい指輪",
] as const;

export const minaSafariPartsSearches = [
  "小さいレゴパーツ 固定方法",
  "レゴ パーツ 外れないようにするには",
] as const;

export type MinaSafariArticle = {
  id: string;
  site: string;
  url: string;
  title: string;
  excerpt: string;
  paragraphs: readonly string[];
};

/** The new entries surface only after Jeongyeon's archived gift conversation. */
export function minaSafariSearchHistory(giftResearchUnlocked: boolean): string[] {
  return giftResearchUnlocked
    ? [...minaSafariPartsSearches, ...minaSafariRingSearches]
    : [...minaSafariRingSearches];
}

export function isMinaSafariResearchTerm(term: string): boolean {
  const query = term.normalize("NFKC").trim().toLowerCase().replace(/\\s+/gu, "");
  if (!query) return false;
  if ([...minaSafariPartsSearches, ...minaSafariRingSearches].some(
    (item) => item.normalize("NFKC").toLowerCase().replace(/\\s+/gu, "") === query,
  )) return true;
  if (/(?:指輪|リング)/u.test(query) && /(?:作り方|図面|設計|かわいい|サイズ|作る)/u.test(query)) return true;
  return /(?:レゴ|lego|ブロック)/iu.test(query) &&
    /(?:小さ|ミニ|パーツ|外れ|固定|サイズ|白|ピンク|parts|small)/iu.test(query);
}

const hobbyArticles: readonly MinaSafariArticle[] = [
  {
    id: "hobby-fit",
    site: "小さな工作ノート",
    url: "https://craft-memo.example/blocks/fit",
    title: "小さなブロックが外れやすいときに確認したいこと",
    excerpt: "パーツの向き、組み合わせ、接続面の数。小さな作品ほど基本を見直すのが近道です。",
    paragraphs: [
      "小さなブロックは、同じように見えても組み合わせ方によって安定感が変わります。まずはパーツの向きと接続面が十分に取れているかを確認します。",
      "完成形を急いで作るより、何度か仮組みをして指で軽く動かしてみると、外れやすい場所に気づきやすくなります。",
      "無理に押し込まず、一度ばらしてから組み直すのもひとつの方法です。",
    ],
  },
  {
    id: "hobby-size",
    site: "ブロックの小さな百科",
    url: "https://tiny-build.example/guide/parts",
    title: "ミニサイズのパーツを選ぶときのメモ",
    excerpt: "白やピンクなど淡い色のパーツを組み合わせるときも、色より先にサイズを揃えるのが基本。",
    paragraphs: [
      "同じ色のブロックでも、高さや幅が少し違うだけで仕上がりは変わります。使う前にサイズごとに分けておくと作業がしやすくなります。",
      "輪郭を作るときは、全体の形を見ながら一つずつ微調整するほうが失敗を減らせます。",
    ],
  },
  {
    id: "hobby-retry",
    site: "週末クラフト日誌",
    url: "https://weekend-craft.example/mini/rebuild",
    title: "小さな作品を何度も作り直した話",
    excerpt: "一度でうまくいかないのは珍しくありません。机の上で繰り返し試した記録。",
    paragraphs: [
      "思い描いていた形と、実際に作ってみた形が違うことはよくあります。写真を撮って比較すると、次に直したいところが見えてきます。",
      "少しずつ作り直した跡が残っているのも、手作りならではの面白さです。",
    ],
  },
];

const accessoryArticles: readonly MinaSafariArticle[] = [
  {
    id: "accessory-size",
    site: "手作りの小さなメモ",
    url: "https://handmade-memo.example/accessory/size",
    title: "小さなアクセサリーのサイズを考える",
    excerpt: "作り始める前に、幅と厚み、身につけたときの感覚を紙に描いてみる。",
    paragraphs: [
      "アクセサリーの形を考えるときは、最初に紙へ簡単な線を描いてみると全体像がつかみやすくなります。",
      "素材が硬い場合は、見た目だけでなく着けたときの感触も確かめながら調整します。",
    ],
  },
  {
    id: "accessory-sketch",
    site: "日々のデザイン帖",
    url: "https://little-design.example/notes/rough",
    title: "図面がなくても描ける、小さなもののラフスケッチ",
    excerpt: "完成した絵より、何度も消して書き直すメモを大切にする方法。",
    paragraphs: [
      "小さい作品ほど、実物大のラフスケッチが役に立つことがあります。最初から正確に描こうとしなくても構いません。",
      "途中で気になった点を余白に残しておけば、次に試すときの手がかりになります。",
    ],
  },
  {
    id: "accessory-color",
    site: "暮らしと色のノート",
    url: "https://color-note.example/pale/pink-white",
    title: "白と淡いピンクを組み合わせる、小さな配色のヒント",
    excerpt: "主役の色をひとつ決めると、シンプルな形もまとまりやすくなります。",
    paragraphs: [
      "淡い色を組み合わせるときは、明るさの近い色を少しずつ並べてみると仕上がりを想像しやすくなります。",
      "写真に撮って見比べると、肉眼では気づかなかった色の差が見えることもあります。",
    ],
  },
];

export function minaSafariResearchResults(term: string): readonly MinaSafariArticle[] {
  const query = term.trim();
  if (!query) return [];
  if (/(?:レゴ|ブロック|パーツ|固定|外れない)/u.test(query)) return hobbyArticles;
  if (/(?:指輪|図面|アクセサリー|かわいい)/u.test(query)) return accessoryArticles;
  return [];
}
