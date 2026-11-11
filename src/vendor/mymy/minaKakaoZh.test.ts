import { describe, expect, it } from "vitest";
import story from "../../../stories/template/story.json";
import { minaKakao2025Items } from "./mina-kakao-2025";
import { minaKakaoChineseSubtitle } from "./minaKakaoZh";
import { minaSanaChoices, minaSanaIntro } from "./mina-sana-replies";
import { replyToSanaText } from "./sanaAdaptive";

describe("Chinese small-text subtitles in Mina's KakaoTalk", () => {
  it("translates every authored original KakaoTalk chat bubble", () => {
    const messages = story.chats.filter((chat) => chat.app === "kakao").flatMap((chat) => chat.messages);
    expect(messages).toHaveLength(66);
    for (const message of messages) {
      expect(minaKakaoChineseSubtitle(message), message.id).toMatch(/[\u3400-\u9fff]/u);
    }
  });
  it("translates every 2025 flashback message, in all chats", () => {
    expect(minaKakao2025Items).toHaveLength(43);
    for (const message of minaKakao2025Items) {
      expect(minaKakaoChineseSubtitle(message), message.id).toMatch(/[\u3400-\u9fff]/u);
    }
  });
  it("translates interactive Sana messages and the added Jeongyeon gift conversation", () => {
    const bodies = [
      "みーたん、まだ起きてる？",
      "야, 그거 이번엔 성공했어?ㅋㅋ",
      "야, 아직도 그거 만들고 있어?ㅋㅋ",
      "응…… 생각보다 어려워.",
      "그냥 다른 거 사서 주면 안 돼?",
      "안 돼. 내가 직접 만들어 주고 싶어.",
      "ㅋㅋ 알았어. 이번엔 꼭 전해 줘.",
      ...minaSanaIntro,
      ...minaSanaChoices.flatMap((choice) => [choice.text, ...choice.responses]),
    ];
    for (const body of bodies) {
      expect(minaKakaoChineseSubtitle({ id: "dynamic", body }), body).toMatch(/[\u3400-\u9fff]/u);
    }
  });
  it("keeps user free text as written, without inventing a translation", () => {
    expect(minaKakaoChineseSubtitle({ id: "local-kkt-1", body: "I'm holding her phone" })).toBe("");
  });
  it("translates phone-lost and relationship replies from the adaptive branch", () => {
    const requests = ["I found Mina's phone", "I will return her phone", "I want to see her", "I miss her", "I'm scared"];
    for (const input of requests) {
      const reply = replyToSanaText(input, []).replies[0];
      expect(minaKakaoChineseSubtitle({ id: "adaptive", body: reply }), reply).toMatch(/[\u3400-\u9fff]/u);
    }
  });
});
