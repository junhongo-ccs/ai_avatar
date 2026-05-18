# AI Avatar PoC (P1 Mock MVP)

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Run dev server

```bash
npm run dev
```

## Current scope (P1 only)

- Mock response flow only (`VITE_USE_MOCK=true`)
- Face tag parsing (`[face:joy]` format and JSON `{"face":"joy","text":"..."}`)
- Avatar image switching from `public/avatar/*.png`
- Chat log + text input + send
- SpeechSynthesis API playback

## Not implemented yet

- Dify API integration (P2)
- Advanced status/error controls (P3)
- Live2D, speech recognition, external TTS, Realtime API
