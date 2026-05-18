# AI Avatar PoC (P1 + P2)

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Configure mode

- Mock mode (P1 behavior)

```env
VITE_USE_MOCK=true
```

- Dify mode (P2 behavior)

```env
VITE_USE_MOCK=false
VITE_DIFY_API_URL=https://api.dify.ai/v1
VITE_DIFY_API_KEY=your_dify_api_key
VITE_DIFY_USER_ID=local-user-001
```

4. Run dev server

```bash
npm run dev
```

## Dify response contract (P2)

The frontend expects Dify `answer` to be either:

1. JSON string (preferred)

```json
{"face":"joy","text":"こんにちは！"}
```

2. Face-tag text (fallback)

```text
[face:joy] こんにちは！
```

Supported faces: `normal`, `joy`, `sad`, `angry`, `surprised`.

## Runtime behavior

- `VITE_USE_MOCK=true`: uses mock service and face test button.
- `VITE_USE_MOCK=false`: calls Dify `/chat-messages`.
- If `VITE_USE_MOCK=false` and Dify env is missing, app stays in `misconfigured` mode (no auto-fallback to mock).
- Dify raw response is normalized by adapter before UI.
- `conversation_id` is retained and reused for continuous conversation.

## Out of scope

- P3 advanced error classification
- Live2D, speech recognition, external TTS, Realtime API
- Authentication and persistent history
