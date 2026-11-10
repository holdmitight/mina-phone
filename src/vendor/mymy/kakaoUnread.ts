import type { Item } from "../../schema";

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
