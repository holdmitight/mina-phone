/** Hand-drawn, intentionally indistinct memories saved on Mina's old phone.
 * These are story illustrations, never edits of the author's eight real photos.
 */
const memoryArt = (paint: string) =>
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">' +
    '<defs><linearGradient id="film" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffede7" stop-opacity=".24"/><stop offset="1" stop-color="#b3b3c9" stop-opacity=".29"/></linearGradient><filter id="soft"><feGaussianBlur stdDeviation="2.5"/></filter></defs>' +
    paint +
    '<rect width="600" height="750" fill="url(#film)" opacity=".45"/>' +
    '</svg>',
  );

const studio = memoryArt(
  '<rect width="600" height="750" fill="#d3cec7"/>' +
  '<rect x="34" y="50" width="525" height="370" fill="#eae4df"/>' +
  '<rect x="68" y="83" width="410" height="300" fill="#c5cdd1"/>' +
  '<path d="M180 86v295M340 86v295M72 290h400" stroke="#f6eeea" stroke-width="15"/>' +
  '<path d="M0 460h600v290H0" fill="#b5a493"/>' +
  '<path d="M0 462 600 472M100 464 145 750M310 465 310 750M525 465 480 750" stroke="#8b7e74" stroke-width="4" opacity=".35"/>' +
  '<path d="M50 385h500" stroke="#9c806a" stroke-width="14"/><path d="M97 386v75M495 386v75" stroke="#817568" stroke-width="8"/>' +
  '<g filter="url(#soft)" transform="translate(250 580) rotate(-12)"><path d="M0 48Q-15-9 12-20Q27-25 48 8L70 45Q58 75 22 80Z" fill="#e8bec2"/><path d="M71 55Q75-1 112 12Q146 27 148 76L106 99Z" fill="#eccbc7"/><path d="M23-12Q38-43 57-55M90 15Q108-22 125-30" stroke="#f8e8db" stroke-width="8" fill="none"/></g>',
);

const rainyWindow = memoryArt(
  '<rect width="600" height="750" fill="#94a8b5"/>' +
  '<rect width="600" height="420" fill="#a8bec5"/>' +
  '<path d="M80 0V500M500 0V500M0 405H600" stroke="#e5dfd3" stroke-width="19"/>' +
  '<g stroke="#e8e9ed" stroke-width="5" opacity=".48"><path d="M45 10 14 78M162 46 110 146M300 0 240 155M431 33 395 112M546 8 488 129M105 185 61 260M290 184 235 310M532 210 493 321M414 340 380 420"/></g>' +
  '<rect y="445" width="600" height="305" fill="#d6c5b8"/>' +
  '<path d="M109 440Q275 185 450 440Z" fill="#795d6f" stroke="#6f5066" stroke-width="7"/>' +
  '<path d="M272 440v180q0 52 51 25" fill="none" stroke="#675061" stroke-width="12" stroke-linecap="round"/>' +
  '<path d="M140 439Q208 400 272 439Q335 400 426 439" fill="none" stroke="#b09dae" stroke-width="5" opacity=".55"/>' +
  '<rect x="70" y="620" width="460" height="16" rx="8" fill="#b8a7a4" opacity=".4"/>',
);

const sea = memoryArt(
  '<rect width="600" height="750" fill="#e8abc5"/>' +
  '<path d="M0 0H600V280H0Z" fill="#bda6c8"/>' +
  '<path d="M0 260Q310 220 600 270V440H0" fill="#e4b3c6"/>' +
  '<circle cx="433" cy="311" r="81" fill="#f6d5bd" opacity=".85"/>' +
  '<path d="M0 420Q240 388 600 425V750H0" fill="#adabc3"/>' +
  '<path d="M0 487Q300 450 600 494M0 565Q300 536 600 564M0 662Q300 640 600 664" stroke="#f8d8d5" stroke-width="6" opacity=".42" fill="none"/>' +
  '<path d="M0 730Q173 646 307 698Q446 751 600 682V750H0" fill="#727a96" opacity=".42"/>' +
  '<path d="M388 410Q433 430 470 418M403 447Q438 450 465 444" stroke="#f4d1b9" stroke-width="9" opacity=".6"/>',
);

export const minaSummerMemoryPhotos = [
  { id: "mina-memory-studio", title: "レッスンのあと", date: "2015.06.16", src: studio,
    note: "はじめて、一緒に帰った日。", location: "日本 · ダンススタジオ" },
  { id: "mina-memory-rain", title: "借りた傘", date: "2015.07.04", src: rainyWindow,
    note: "「雨が大きい」。ふと思い出して、笑ってしまった。", location: "日本" },
  { id: "mina-memory-sea", title: "いつか", date: "2015.08.09", src: sea,
    note: "もらった写真。『いつか、一緒に行こうね』って。", location: "送られてきた写真" },
] as const;
