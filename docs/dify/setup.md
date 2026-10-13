# Dify Setup Guide (PoC)

## 1. Create App

- App type: **Chatflow**
- Recommended name: `ai-avatar-poc`

## 2. Build the minimum flow

- Nodes:
  - User Input
  - LLM
  - Answer

## 3. LLM instruction (minimum)

Use an instruction that enforces JSON-only output:

```text
あなたはAIアバター応答生成です。
必ずJSONのみを返してください。前後に説明文を付けないでください。
形式は次に厳密に従ってください:
{"face":"normal|joy|sad|angry|surprised","text":"ユーザーへの返答"}

ルール:
- face は必ず normal, joy, sad, angry, surprised のいずれか
- 不明な場合は normal
- text は日本語で簡潔に
- JSON以外（Markdown、コードブロック、注釈）を出力しない
- 出力は必ず1行のJSONオブジェクトのみ。先頭は {、末尾は }、それ以外の文字を含めないこと。
```

## 4. Publish and API key

1. Publish app
2. Generate API key from API access page
3. Use PoC-only key

## 5. Validate API

Call `POST /chat-messages` with `response_mode=blocking` and confirm:

- `answer` is JSON string
- `conversation_id` is returned

Example expected answer:

```json
{"face":"joy","text":"こんにちは！はい、元気です。あなたはどうですか？"}
```

## 6. Server env

The browser calls the backend `/api/chat`, and the backend forwards to Dify with the API key.
Set `backend/.env` (locally) or the Render environment variables:

```env
DIFY_API_URL=https://dify.solccs.net/v1
DIFY_API_KEY=***
DIFY_USER_ID=local-user-001
```

Do not prefix the key with `VITE_`: Vite embeds `VITE_*` values into the public JavaScript bundle.

## 7. Notes

- If the server env is incomplete, `/api/chat` returns 503 and the app shows `misconfigured`.
- Adapter must normalize Dify raw response before UI.
