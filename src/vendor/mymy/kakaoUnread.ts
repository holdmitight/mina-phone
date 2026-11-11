import type { Item } from "../../schema";

/**
 * Some original template messages carry later timestamps than the found-phone
 * scene. Scripted new arrivals must remain at the end of the corresponding
 * conversation, otherwise both the preview and unread boundary hide them.
 * Archival backstory entries keep their ordinary date order.
 */
export function orderKakaoMessages(items: readonly Item[]): Item[] {
  const isLiveStoryMessage = (item: Item) =>
    item.id === "mina-story-cafe-sana-ping" ||
    item.id === "mina-story-jeongyeon-gift-ping" ||
    item.id.startsWith("mina-jeongyeon-interactive-") ||
    item.id.startsWith("mina-sana-interactive-");
  return [...items].sort((a, b) => {
    const aLive = isLiveStoryMessage(a);
    const bLive = isLiveStoryMessage(b);
    if (aLive !== bLive) return aLive ? 1 : -1;
    return a.time.localeCompare(b.time);
  });
}

/** Chat-list unread counts belong to incoming messages, never to Mina's replies. */
const explicitlyUnread = (item: Item): boolean =>
  Boolean(item.meta.unread && item.meta.unread !== "0");

/**
 * Only incoming messages since the last outgoing/read message can be unread.
 * The published story also appends already-read 2025 chat history, so counting
 * every `read: false` item in a thread would resurrect very old messages.
 */
export function unreadKakaoMessages(
  chronologicalItems: readonly Item[],
  seenIncomingIds: readonly string[],
): Item[] {
  const seen = new Set(seenIncomingIds);
  let lastReadBoundary = -1;
  for (let index = 0; index < chronologicalItems.length; index += 1) {
    const item = chronologicalItems[index];
    if (item.outgoing || (item.read && !explicitlyUnread(item))) {
      lastReadBoundary = index;
    }
  }
  return chronologicalItems.slice(lastReadBoundary + 1).filter((item) =>
    !item.outgoing &&
    (!item.read || explicitlyUnread(item)) &&
    !seen.has(item.id),
  );
}

/** Persist read receipts against stable message IDs, not disappearing badges. */
export function markKakaoThreadRead(
  previous: readonly string[],
  items: readonly Item[],
): string[] {
  const result = [...previous];
  const seen = new Set(result);
  for (const item of items) {
    if (!item.outgoing && (!item.read || explicitlyUnread(item)) && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item.id);
    }
  }
  return result;
}
