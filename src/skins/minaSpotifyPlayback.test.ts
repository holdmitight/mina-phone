import { describe, expect, it } from "vitest";
import {
  parseSpotifyShareUrl,
  spotifySourceForEntry,
  spotifyEmbedUrl,
  spotifyOpenUrl,
} from "./minaSpotifyPlayback";

describe("real Spotify playback sources", () => {
  it("binds the featured music to official Spotify track and playlist embeds", () => {
    const kingGnu = spotifySourceForEntry("kinggnu");
    const illit = spotifySourceForEntry("illit");
    const kpop = spotifySourceForEntry("kpop");
    expect(kingGnu?.type).toBe("track");
    expect(illit?.type).toBe("track");
    expect(kpop?.type).toBe("playlist");
    expect(spotifyEmbedUrl(kingGnu!)).toMatch(/^https:\/\/open\.spotify\.com\/embed\/track\/[A-Za-z0-9]{22}\?/);
    expect(spotifyOpenUrl(kpop!)).toMatch(/^https:\/\/open\.spotify\.com\/playlist\/[A-Za-z0-9]{22}$/);
    expect(spotifySourceForEntry("summer2015")).toBeNull();
    expect(spotifySourceForEntry("unknown")).toBeNull();
  });
  it("accepts only safely structured Spotify sharing links and Spotify URIs", () => {
    expect(parseSpotifyShareUrl("https://open.spotify.com/track/40cjQFH3UG8bYB8RSuOCgB?si=abc"))
      .toEqual({ type: "track", id: "40cjQFH3UG8bYB8RSuOCgB" });
    expect(parseSpotifyShareUrl("https://open.spotify.com/intl-ja/album/40cjQFH3UG8bYB8RSuOCgB"))
      .toEqual({ type: "album", id: "40cjQFH3UG8bYB8RSuOCgB" });
    expect(parseSpotifyShareUrl("spotify:playlist:37i9dQZF1DX9tPFwDMOaN1"))
      .toEqual({ type: "playlist", id: "37i9dQZF1DX9tPFwDMOaN1" });
    expect(parseSpotifyShareUrl("https://not-spotify.com/track/40cjQFH3UG8bYB8RSuOCgB")).toBeNull();
    expect(parseSpotifyShareUrl("https://open.spotify.com.evil.com/track/40cjQFH3UG8bYB8RSuOCgB")).toBeNull();
    expect(parseSpotifyShareUrl("javascript:alert(1)")).toBeNull();
    expect(parseSpotifyShareUrl("https://open.spotify.com/track/../../../unsafe")).toBeNull();
    expect(parseSpotifyShareUrl("https://open.spotify.com/search/King%20Gnu")).toBeNull();
    expect(parseSpotifyShareUrl("")).toBeNull();
  });
});
