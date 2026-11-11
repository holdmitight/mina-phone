/** Official Spotify Embed links only. The browser plays them through Spotify;
 * the game never downloads, proxies, or pretends to own music recordings.
 */
export type SpotifyContentType = "track" | "album" | "playlist";
export type SpotifySource = Readonly<{ type: SpotifyContentType; id: string }>;
const spotifySources: Record<string, SpotifySource> = {
  // Verified public track/playlist IDs from Spotify and music catalog pages.
  kinggnu: { type: "track", id: "40cjQFH3UG8bYB8RSuOCgB" },
  illit: { type: "track", id: "0pMoUGdpD8nupNP1mSdZUn" },
  kpop: { type: "playlist", id: "37i9dQZF1DX9tPFwDMOaN1" },
  tokyo: { type: "playlist", id: "37i9dQZF1DXafb0IuPwJyF" },
  kimbops: { type: "playlist", id: "37i9dQZF1DX0018ciYu6bM" },
  pophits: { type: "playlist", id: "1WH6WVBwPBz35ZbWsgCpgr" },
  akb: { type: "playlist", id: "6ZZJwl8BsgFUqXXaOT46Nn" },
};
/** All Spotify URLs are validated to avoid embedding arbitrary websites. */
export function spotifySourceForEntry(id: string): SpotifySource | null {
  return spotifySources[id] ?? null;
}
export function parseSpotifyShareUrl(raw: string): SpotifySource | null {
  const value = raw.trim();
  const uri = /^spotify:(track|album|playlist):([A-Za-z0-9]{22})$/i.exec(value);
  if (uri) return { type: uri[1].toLowerCase() as SpotifyContentType, id: uri[2] };
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    // Spotify currently shares /intl-ja/track/... URLs in some markets.
    if (segments[0]?.startsWith("intl-")) segments.shift();
    if (segments[0] === "user" && segments[2] === "playlist") segments.splice(0, 2);
    if (!["track","playlist","album"].includes(segments[0]) || !/^[A-Za-z0-9]{22}$/.test(segments[1] || "")) return null;
    return { type: segments[0] as SpotifyContentType, id: segments[1] };
  } catch {
    return null;
  }
}
export function spotifyEmbedUrl(source: SpotifySource): string {
  return `https://open.spotify.com/embed/${source.type}/${source.id}?utm_source=generator&theme=0`;
}
export function spotifyOpenUrl(source: SpotifySource): string {
  return `https://open.spotify.com/${source.type}/${source.id}`;
}
