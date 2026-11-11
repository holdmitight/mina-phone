# VoiceStudio × Mina Phone

Source: https://github.com/debpalash/VoiceStudio (AGPL-3.0).

This repository does not bundle VoiceStudio's app or model. It uses the documented local TTS endpoint to render final-call audio while editing. Mina Phone remains a static GitHub Pages website. No API key is shipped to players.

## What the integration does

The fictional call is from Jeongyeon's handset, with a generic Japanese synthetic voice speaking Mina's dialogue after the player answers. AI-rendered WAV files are preferred when present; the existing browser speech fallback remains available. Players can replay each line; ending choices can also play generated audio. Story progress and saves are unchanged.

## Private voice-style references and a one-line audition

The two author-supplied original audio excerpts are kept in a **private local reference pack**, not published in this GitHub repository. Use them to guide delivery choices for a separately licensed Japanese synthetic voice; they do not authorize cloning a real performer's voice.

To hear only the opening Japanese line before rendering the complete call, launch the VoiceStudio TTS API and run `npm run voice:sample`. The test file is saved as `voice-preview/line-01.wav`, without changing the game's published audio manifest. See [Japanese voice direction](MINA_VOICE_DIRECTION.md).

## Generate all ten lines

1. Install VoiceStudio from https://github.com/debpalash/VoiceStudio and launch its local API (normally http://127.0.0.1:3900).
2. Choose a Japanese-capable TTS engine and voice in VoiceStudio. Verify the selected engine's model license. Only clone a voice with its owner's permission; do not imitate a real artist without consent.
3. Open a terminal in the Mina Phone repository and run: npm run voice:generate
4. For a different engine or voice set VOICESTUDIO_MODEL and VOICESTUDIO_VOICE before running. The defaults are model tts-1, voice alloy. On Windows PowerShell use $env:VOICESTUDIO_MODEL and $env:VOICESTUDIO_VOICE. If necessary use VOICESTUDIO_URL for the API endpoint.
5. Review ten WAV files in public/mina-voice/. After all files succeed, the script updates src/skins/minaVoiceAssets.json. Commit both the WAV files and manifest. GitHub Pages will then serve them under the /mina-phone/ base path.

For a remote backend, use HTTPS with OMNIVOICE_API_KEY set privately on the generation machine. Never publish that key in VITE_ variables, JavaScript, the manifest, or the repository.

Until generated audio files are committed, the phone continues using its original device-provided Japanese speech. That fallback is not VoiceStudio AI audio and depends on the browser and installed voices.

## Fork VoiceStudio separately

To have the entire VoiceStudio project under your GitHub username, use https://github.com/debpalash/VoiceStudio/fork . This adapter does not create a fork. See upstream API-auth documentation at https://github.com/debpalash/VoiceStudio/blob/main/docs/api-auth.md .

VoiceStudio is licensed AGPL-3.0; separate engines and model weights have independent licenses. No VoiceStudio source code has been copied into Mina Phone.
