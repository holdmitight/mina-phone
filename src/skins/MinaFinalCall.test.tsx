import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MinaFinalCallScript, minaFinalCallLines, minaFinalCallOutcomes } from "./MinaFinalCall";

describe("the final fictional phone call from Mina", () => {
  it("starts as a restrained conversation and doesn't spoil the secret on the first line", () => {
    const html = renderToStaticMarkup(createElement(MinaFinalCallScript, {
      step: 0,
      onAdvance: vi.fn(),
      onChoose: vi.fn(),
    }));
    expect(html).toContain("もしもし");
    expect(html).toContain("続きを聞く");
    expect(html).not.toContain("レゴの指輪");
    expect(html).not.toContain("偶然じゃない");
    expect(minaFinalCallLines).toHaveLength(8);
  });

  it("makes it clear Mina borrowed Jeongyeon's phone to reach A without identifying A early", () => {
    expect(minaFinalCallLines[1].ja).toContain("定延のスマホを借りてる");
    expect(minaFinalCallLines[3].ja).toContain("レゴの指輪");
    expect(minaFinalCallLines[5].ja).toContain("偶然じゃない");
    expect(minaFinalCallLines[6].ja).toContain("自分の手");
  });

  it("lets the player hear the full question before choosing what to say", () => {
    const html = renderToStaticMarkup(createElement(MinaFinalCallScript, {
      step: minaFinalCallLines.length - 1,
      onAdvance: vi.fn(),
      onChoose: vi.fn(),
    }));
    expect(html).toContain("会ってくれる");
    expect(html).toContain("会いに行く");
    expect(html).toContain("少し時間がほしい");
    expect(html).toContain("暂时不回答");
    expect(html).not.toContain("続きを聞く");
  });

  it("respects yes, not-yet, and silence without pretending the ring is already delivered", () => {
    expect(minaFinalCallOutcomes.meet.ja).toContain("私がちゃんと渡す");
    expect(minaFinalCallOutcomes.time.ja).toContain("急がなくていい");
    expect(minaFinalCallOutcomes.silence.ja).toContain("返事は");
    expect(minaFinalCallOutcomes.meet.epilogue).not.toContain("指輪をはめた");
  });
});
