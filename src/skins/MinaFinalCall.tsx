import type { ReactNode } from "react";

/** The caller ID belongs to Jeongyeon: Mina borrowed her handset to ring the
 * phone A found. The call is text-only fiction, not an actual phone connection.
 */
export const minaFinalCallLines = [
  { ja: "……もしもし。", zh: "……喂？" },
  { ja: "びっくりさせてごめん。……私、南。今、定延のスマホを借りてる。", zh: "抱歉吓到你了……是我，南。我现在借了定延的手机。" },
  { ja: "そのスマホ……あなたが持ってるんじゃないかって、思ってた。", zh: "那部手机……我想，应该在你手里吧。" },
  { ja: "2015年の夏。レゴの指輪がいいって言ってくれたの、覚えてる？", zh: "2015 年夏天，你说过更想要 LEGO 戒指，还记得吗？" },
  { ja: "何回も作り直したの。……今度は、自分の手で作りたかったから。", zh: "我重做了好多次……因为这次，我真的想亲手做给你。" },
  { ja: "あのカフェに置いてきたのは……偶然じゃない。会う勇気がなくて。……ごめん。", zh: "手机留在那家咖啡店……不是偶然。我没有勇气直接去见你……对不起。" },
  { ja: "十年前の約束、まだ渡せてない。……今度こそ、ちゃんと会って、あなたに渡したい。", zh: "十年前的约定，我还没能兑现……这一次，我想当面把它交给你。" },
  { ja: "……会ってくれる？", zh: "……你愿意见我吗？" },
] as const;

export const minaFinalMissedCallNotice = "Phone: Jeongyeon · 不在着信（タップして折り返す）";

export type MinaFinalCallChoice = "meet" | "time" | "silence";

export const minaFinalCallOutcomes: Record<MinaFinalCallChoice, {
  ja: string;
  zh: string;
  epilogue: string;
}> = {
  meet: {
    ja: "……ありがとう。待ってる。今度こそ、私がちゃんと渡すから。",
    zh: "……谢谢你。我等你。这次，我一定会亲手交给你。",
    epilogue: "受話器の向こうで、小さく息をのむ音がした。\n\n「……ありがとう。待ってる。」",
  },
  time: {
    ja: "うん。急がなくていいよ。……聞いてくれて、ありがとう。",
    zh: "嗯，不用急着回答……谢谢你愿意听我说。",
    epilogue: "今すぐ答えを出さなくてもいい。\n\n「……聞いてくれて、ありがとう。」",
  },
  silence: {
    ja: "……うん。返事は、今じゃなくていいから。……また、いつか。",
    zh: "……嗯。现在不回答也没关系……以后，有机会的话。",
    epilogue: "答えを待つ静かな時間。\n\n「……また、いつか。」",
  },
};

export function MinaFinalCallScript({
  step,
  onAdvance,
  onChoose,
}: {
  step: number;
  onAdvance: () => void;
  onChoose: (choice: MinaFinalCallChoice) => void;
}): ReactNode {
  const index = Math.min(Math.max(0, step), minaFinalCallLines.length - 1);
  const current = minaFinalCallLines[index];
  return (
    <div className="mina-final-call-script" aria-live="polite">
      <div className="mina-final-call-speaker">MINA · 通話中</div>
      <p lang="ja" className="mina-final-call-ja">{current.ja}</p>
      <p lang="zh-CN" className="mina-final-call-zh">{current.zh}</p>
      <span className="mina-final-call-progress">{index + 1} / {minaFinalCallLines.length}</span>
      {index < minaFinalCallLines.length - 1 ? (
        <button type="button" className="mina-final-call-next" onClick={onAdvance}>
          続きを聞く
        </button>
      ) : (
        <div className="mina-final-call-choices" role="group" aria-label="電話への返事">
          <button type="button" onClick={() => onChoose("meet")}>会いに行く <small>我去见你</small></button>
          <button type="button" onClick={() => onChoose("time")}>少し時間がほしい <small>我还需要一点时间</small></button>
          <button type="button" onClick={() => onChoose("silence")}>…… <small>暂时不回答</small></button>
        </div>
      )}
    </div>
  );
}
