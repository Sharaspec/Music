# Wavecraft Studio

A single-page AI music studio built on the [SunoAPI](https://docs.sunoapi.org) platform. Users bring their own API key and can create, remix and explore music from one page, with light, dark and system themes.

## Features

| Studio | What it does | SunoAPI endpoints |
| --- | --- | --- |
| **Key gate** | Checks the key against the credits endpoint. The key is stored in the browser only (optional "remember me"). | `GET /api/v1/generate/credit` |
| **Create: Simple** | Describe a song. Includes "Surprise me" ideas, style chips, an instrumental toggle, and image, video or audio reference attachments. | `POST /api/v1/generate` (`customMode: false`) |
| **Create: Custom** | Title, style (with ✨ AI style boost), a lyrics editor with section tags and ✍️ AI lyrics, excluded styles, vocal gender, style weight, weirdness, audio weight, variety, persona or voice, and duration. | `/generate`, `/style/generate`, `/lyrics` |
| **Models** | V6, V6 Wild and V6 Mini, plus the discontinued legacy models (V5.5 → V4) | — |
| **Lyrics** | Lyric notebook. Send any result to the Custom creator. | `/lyrics`, `/lyrics/record-info` |
| **Remix** | Upload a file, paste a URL or pick a library track, then Cover, Extend, Add band, Add vocals, Mashup or Replace section. | `/generate/upload-cover`, `/upload-extend`, `/add-instrumental`, `/add-vocals`, `/mashup`, `/replace-section`, File Upload API |
| **Sounds** | Ambiences, loops and effects with loop, BPM and key controls | `/generate/sounds` |
| **Library** | Search, filter and favorite tracks, import by task ID, and manage personas. Each track can be extended, have a section replaced, be split into stems, or be exported as MIDI (downloadable `.mid`), WAV or an MP4 video. Tracks can also get cover art, a persona, karaoke-style synced lyrics and audio recovery. | `/generate/extend`, `/vocal-removal/*`, `/midi/*`, `/wav/*`, `/mp4/*`, `/suno/cover/*`, `/generate/generate-persona`, `/generate/get-timestamped-lyrics`, `/suno/recovery/*` |

Other pieces:
- Live task tracking in an Activity drawer. Tasks keep being polled after a page reload.
- A first take can be streamed before the final render is finished.
- A persistent player with synced lyrics
- Confetti when a song finishes, and keyboard shortcuts (<kbd>Ctrl/⌘</kbd>+<kbd>Enter</kbd> to submit, <kbd>Space</kbd> to play or pause)
- A mobile-friendly layout

## Deploying on Netlify

There is no build step. `netlify.toml` publishes `public/` and sets up the following:

- `/proxy/suno/*` → `https://api.sunoapi.org/*` and `/proxy/upload/*` → `https://sunoapiorg.redpandaai.co/*`. These same-origin proxies avoid browser CORS problems. The key only travels in the `Authorization` header.
- `/api/callback`: a tiny Netlify Function that acknowledges SunoAPI's required `callBackUrl`. The app polls for results itself.

Connect the repo in Netlify and deploy the `main` branch. Nothing else needs to be configured.

## Local development

```bash
npx netlify dev        # serves public/ with the proxies and function
```

When you open `public/index.html` directly, the app calls SunoAPI directly. You can change the connection mode under ⚙️ Settings.
