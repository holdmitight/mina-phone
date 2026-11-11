import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MinaFinalCallScript, minaFinalCallLines, minaFinalCallOutcomes, canSpeakMinaFinalCall, speakMinaFinalLine, stopMinaFinalSpeech } from "./MinaFinalCall";

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
    expect(minaFinalCallLines[4].ja).toContain("自分の手");
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

  it("voices the Japanese dialogue using on-device speech synthesis and keeps replay available", () => {
    const spoken: unknown[] = [];
    const cancel = vi.fn();
    const resume = vi.fn();
    const speak = vi.fn((item: unknown) => spoken.push(item));
    const speechSynthesis = {
      getVoices: () => [{ name: "Kyoko", lang: "ja-JP" }],
      cancel,
      speak,
      resume,
      paused: false,
    };
    class TestUtterance {
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    vi.stubGlobal("window", { speechSynthesis });
    vi.stubGlobal("SpeechSynthesisUtterance", TestUtterance);
    try {
      expect(canSpeakMinaFinalCall()).toBe(true);
      expect(speakMinaFinalLine("……もしもし。")).toBe(true);
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(speak).toHaveBeenCalledTimes(1);
      expect((spoken[0] as TestUtterance).text).toBe("……もしもし。");
      expect((spoken[0] as TestUtterance).lang).toBe("ja-JP");
      expect((spoken[0] as TestUtterance).voice).toEqual({ name: "Kyoko", lang: "ja-JP" });
      const html = renderToStaticMarkup(createElement(MinaFinalCallScript, {
        step: 0,
        onAdvance: vi.fn(),
        onChoose: vi.fn(),
      }));
      expect(html).toContain("もう一度聴く");
      expect(html).toContain("重听这句话");
      stopMinaFinalSpeech();
      expect(cancel).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("respects yes, not-yet, and silence without pretending the ring is already delivered", () => {
    expect(minaFinalCallOutcomes.meet.ja).toContain("私がちゃんと渡す");
    expect(minaFinalCallOutcomes.time.ja).toContain("急がなくていい");
    expect(minaFinalCallOutcomes.silence.ja).toContain("返事は");
    expect(minaFinalCallOutcomes.meet.epilogue).not.toContain("指輪をはめた");
  });
});
