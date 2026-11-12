import { useState, type ReactNode } from "react";
import voiceAssets from "./minaVoiceAssets.json";

/** Fictional ending: Mina borrows Jeongyeon's phone. The caller ID shows
 * Jeongyeon; Mina identifies herself only after the player answers.
 * Browser voices are generic Japanese TTS, not the real Mina's voice.
 */
// Keep ALL queued utterances alive; Safari may otherwise garbage-collect
// speech before it is audible. Do not cancel immediately before speak().
const queuedSpeech: SpeechSynthesisUtterance[] = [];
const generatedVoices = voiceAssets as {
  lines: string[];
  outcomes: Record<string, string>;
};
let activeVoiceAudio: HTMLAudioElement | null = null;

/** Only author-generated, same-origin WAV files may be played by players. */
function localVoiceFile(id: number | string): string {
  const file = typeof id === "number"
    ? generatedVoices.lines[id]
    : generatedVoices.outcomes[id];
  return file && /^[a-z0-9-]+\.(?:wav|mp3)$/u.test(file) ? file : "";
}
export function hasMinaRecordedVoice(id: number | string): boolean {
  return Boolean(localVoiceFile(id));
}
export function playMinaFinalLine(
  id: number | string,
  japanese: string,
  onStatus?: (status: "speaking" | "finished" | "error") => void,
): boolean {
  const file = localVoiceFile(id);
  if (!file) return speakMinaFinalLine(japanese, onStatus);
  try {
    if (activeVoiceAudio) {
      activeVoiceAudio.pause();
      activeVoiceAudio.currentTime = 0;
    }
    // Version recorded lines so cached phones load the current dialogue.
    const audio = new Audio(import.meta.env.BASE_URL + "mina-voice/" + file +
      (typeof id === "number" ? "?v=receiver-49f8363f" : ""));
    activeVoiceAudio = audio;
    let fellBack = false;
    const fallback = () => {
      if (fellBack || activeVoiceAudio !== audio) return;
      fellBack = true;
      activeVoiceAudio = null;
      speakMinaFinalLine(japanese, onStatus);
    };
    audio.onplaying = () => {
      if (activeVoiceAudio === audio) onStatus?.("speaking");
    };
    audio.onended = () => {
      if (activeVoiceAudio !== audio) return;
      activeVoiceAudio = null;
      onStatus?.("finished");
    };
    audio.onerror = fallback;
    void audio.play().catch(fallback);
    return true;
  } catch {
    activeVoiceAudio = null;
    return speakMinaFinalLine(japanese, onStatus);
  }
}

export function canSpeakMinaFinalCall(): boolean {
  return typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined";
}

export function stopMinaFinalSpeech(): void {
  if (activeVoiceAudio) {
    activeVoiceAudio.pause();
    activeVoiceAudio.currentTime = 0;
    activeVoiceAudio = null;
  }
  if (!canSpeakMinaFinalCall()) return;
  window.speechSynthesis.cancel();
  queuedSpeech.length = 0;
}

export function speakMinaFinalLine(
  ja: string,
  onStatus?: (status: "speaking" | "finished" | "error") => void,
): boolean {
  if (!canSpeakMinaFinalCall()) {
    onStatus?.("error");
    return false;
  }
  try {
    const synth = window.speechSynthesis;
    // Calling cancel() and then speak() in the SAME iOS Safari click can
    // silently discard the utterance. Let the device queue each line.
    const speech = new SpeechSynthesisUtterance(ja);
    speech.lang = "ja-JP";
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    const japanese = synth.getVoices().filter((voice) => /^ja(?:-|$)/iu.test(voice.lang));
    const selected = japanese.find((voice) =>
      /kyoko|nanami|haruka|sayaka|hikari|mizuki|nozomi/i.test(voice.name),
    ) ?? japanese[0];
    // Explicit null voices have caused silent failures in some WebKit builds.
    if (selected) speech.voice = selected;
    const release = () => {
      const index = queuedSpeech.indexOf(speech);
      if (index !== -1) queuedSpeech.splice(index, 1);
    };
    speech.onstart = () => onStatus?.("speaking");
    speech.onend = () => {
      release();
      onStatus?.("finished");
    };
    speech.onerror = () => {
      release();
      onStatus?.("error");
    };
    queuedSpeech.push(speech);
    synth.speak(speech);
    if (synth.paused) synth.resume();
    return true;
  } catch {
    onStatus?.("error");
    return false;
  }
}

export const minaFinalCallLines = [
  { ja: "びっくりさせてごめんね。……私だよ。今、ジョンヨンオンニのスマホを借りてるの。", zh: "抱歉吓到你了……是我。我现在借了定延姐姐的手机。" },
  { ja: "そのスマホの中……もう、全部見たよね。", zh: "那部手机……你都看到了吧。" },
  { ja: "あのレゴの指輪、覚えてる？", zh: "你还记不记得那个LEGO戒指？" },
  { ja: "何度も作り直したの……。", zh: "我重做了好多次……" },
  { ja: "ごめんね。十年前の約束、まだ果たせてなくて……。", zh: "对不起。十年前的约定，我还没能兑现……" },
  { ja: "今、あの指輪をあなたに渡したい。", zh: "现在我想把它送给你。" },
  { ja: "……会ってくれる？", zh: "……你愿意见我吗？" },
] as const;

export const minaFinalMissedCallNotice = "Phone: Jeongyeon · 不在着信（タップして折り返す）";

export type MinaFinalCallChoice = "meet" | "decline";

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
  decline: {
    ja: "……うん。わかった。",
    zh: "……嗯，我知道了。",
    epilogue: "「……うん。わかった。」\n\nミナは少し黙ってから、いつもの声で「じゃあね」と言った。電話を切ると、画面の時計は17:16を指していた。",
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
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "speaking" | "finished" | "error">("idle");
  return (
    <div className="mina-final-call-script" aria-live="polite">
      <div className="mina-final-call-speaker">MINA · 通話中</div>
      <p lang="ja" className="mina-final-call-ja">{current.ja}</p>
      <p lang="zh-CN" className="mina-final-call-zh">{current.zh}</p>
      <div className="mina-final-call-audio-controls">
        <button type="button" onClick={() => {
          setVoiceStatus("idle");
          playMinaFinalLine(index, current.ja, setVoiceStatus);
        }} aria-label="Minaの今のセリフを音声で再生">
          🔊 もう一度聴く <small>重听这句话</small>
        </button>
        <span role="status">{
          voiceStatus === "error" ? "语音播放失败，请检查日语语音或刷新后重试" :
          voiceStatus === "speaking" ? "播放中 · 日本語" :
          voiceStatus === "finished" ? "播放结束 · 可重听" :
          !hasMinaRecordedVoice(index) && !canSpeakMinaFinalCall() ? "此设备不支持语音朗读" : null
        }</span>
      </div>
      <span className="mina-final-call-progress">{index + 1} / {minaFinalCallLines.length}</span>
      {index < minaFinalCallLines.length - 1 ? (
        <button type="button" className="mina-final-call-next" onClick={() => { setVoiceStatus("idle"); onAdvance(); }}>
          続きを聞く
        </button>
      ) : (
        <div className="mina-final-call-choices" role="group" aria-label="電話への返事">
          <button type="button" onClick={() => onChoose("meet")}>会いに行く <small>我去见你</small></button>
          <button type="button" onClick={() => onChoose("decline")}>会わない <small>不见面</small></button>
        </div>
      )}
    </div>
  );
}
