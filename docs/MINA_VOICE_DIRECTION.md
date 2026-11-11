# Mina Phone · Japanese voice direction (private references)

This guide describes **delivery**, not a request to reproduce a real person's voice.

## Reference material

The author supplied two private original-voice extracts in the conversation. Prepared locally as `reference_01.wav` (10 seconds) and `reference_02.wav` (11 seconds), 24 kHz mono WAV. **These audio files are not in this public repository.** They are for private listening and comparison only; the game must not silently redistribute them or train a voice clone without permission.

## Performance goals

- Language: Japanese (ja-JP). Choose an independent, appropriately licensed Japanese-speaking female synthetic voice.
- Tone: warm, quiet and gently hesitant, not an announcer or exaggerated anime-style performance.
- Pacing: slightly slow but still conversational; give ellipses and emotional shifts space rather than reading punctuation mechanically.
- Emotional arc: begin almost under the breath, reveal the borrowed phone, then slowly make the LEGO-ring confession. Keep the final question especially restrained.
- The Japanese dialogue should sound like a private phone call. Avoid dramatic reverb, music and sharp gain changes.
- Be transparent that the line is synthetic audio, not an authentic recording of the real person.

## Audition only the opening line

Once a Japanese-capable VoiceStudio TTS engine is running and configured:

```bash
npm run voice:sample
```

This renders **only** `「びっくりさせてごめん。……私、ミナ。今、ジョンヨンのスマホを借りてる。」` to `voice-preview/line-01.wav`. The folder is ignored by Git. It does not change the site's live voice manifest or publish any audio.

Choose a compatible model/voice with `VOICESTUDIO_MODEL` and `VOICESTUDIO_VOICE`. See [VoiceStudio setup](VOICESTUDIO.md). Compare the generated voice's delivery against the **style** of the private references, not against the person's unique vocal identity. Revise voice/model choice until the licensed voice feels appropriate.

After choosing the voice, run `npm run voice:generate` to produce all seven call lines plus three response outcomes. Review every line. Only publish generated recordings you have rights to distribute.

## Privacy and consent

Do not put the original sound clips, reference speaker identity embeddings, or an API key into `public/`, `src/`, GitHub Pages or a public repository. If someone wants to use an identifiable person's real voice for synthetic dialogue, obtain their permission first.
