import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { AppArtwork } from "./AppArtwork";
import type { Work } from "./schema";
export function notificationContent(text: string, apps: Work["apps"]) {
  const separator = text.search(/[:：]/);
  const sender = separator > 0 ? text.slice(0, separator).trim() : "メッセージ";
  const app = apps.find((a) => a.name === sender);

  // Authored Kakao notifications sometimes contain the contact label as part
  // of the app name (for example "KakaoTalk · 君 ♡"). Resolve them to the
  // KakaoTalk app instead of falling back to the green SMS icon. Only remove
  // the placeholder 「君」 from the notification heading, not its message body
  // or the stored conversation.
  const kakaoHeading = /^KakaoTalk(?:\s*[·•・]\s*(.*))?$/iu.exec(sender);
  const rawBody = separator > 0 ? text.slice(separator + 1).trimStart() : text;
  const embeddedContact = /^君\s*([♡♥💗])\s*[:：]\s*/u.exec(rawBody);
  const contactLabel = (kakaoHeading?.[1] ?? embeddedContact?.[1] ?? "")
    .replace(/君/gu, "").trim();
  const isKakao = Boolean(kakaoHeading);
  return {
    title: isKakao ? "KakaoTalk" + (contactLabel ? " · " + contactLabel : "") : sender,
    body: isKakao && embeddedContact ? rawBody.slice(embeddedContact[0].length) : rawBody,
    appId: isKakao ? "kakao" : sender === "Phone" ? "phone" : app?.id ?? "messages",
  };
}
export function SystemNotifications({
  notices,
  apps,
  onOpen,
  onDismiss,
  compact = false,
}: {
  notices: string[];
  apps: Work["apps"];
  onOpen: (index: number) => void;
  onDismiss: (index: number) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const entries = notices.map((text, index) => ({ text, index })).reverse();
  const shown = compact && !expanded ? entries.slice(0, 1) : entries;
  return (
    <div
      className={
        "device-notices " +
        (compact && !expanded && notices.length > 1 ? "notice-stacked" : "")
      }
    >
      <div className="notice-cards">
        {shown.map(({ text, index }) => {
          const n = notificationContent(text, apps);
          return (
            <motion.div
              layout
              className="device-notice"
              key={text + "::" + index}
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) onDismiss(index);
              }}
            >
              <button className="notice-open" onClick={() => onOpen(index)}>
                <span className="notice-app-art">
                  <AppArtwork id={n.appId} />
                </span>
                <span className="notice-copy">
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                </span>
                <time>今</time>
              </button>
              {!compact && (
                <button
                  className="notice-remove"
                  aria-label="通知を消去"
                  onClick={() => onDismiss(index)}
                >
                  <X size={15} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      {compact && notices.length > 1 && (
        <button
          className="notice-expand"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "折りたたむ" : notices.length + "件の通知"}
        </button>
      )}
    </div>
  );
}
