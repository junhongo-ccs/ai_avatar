# Architecture (PoC)

## Overview

This PoC verifies a conversational AI avatar pipeline:

1. User input from web UI
2. Mode routing (`mock` or `dify`)
3. Response normalization into `AvatarResponse`
4. Chat log update + avatar face switch + speech synthesis

## Runtime Modes

- `mock`: Uses local mock response service
- `dify`: Calls Dify `/chat-messages`
- `misconfigured`: Dify mode requested but required env settings are missing
- `error`: Dify request failed; user can retry

## Key Components

- UI
  - `src/App.tsx`
  - `src/components/*`
- Controller
  - `src/features/chat/useChatController.ts`
- Config
  - `src/config/env.ts`
- Services
  - `src/services/mockService.ts`
  - `src/services/difyClient.ts`
  - `src/services/speechService.ts`
- Adapter
  - `src/adapters/difyResponseAdapter.ts`
- Parsing utilities
  - `src/utils/extractFaceTag.ts`
  - `src/utils/parseAvatarResponse.ts`

## Render Public Architecture

Render公開版は以下の構成で動作します:

- Render Web Service (Node)
  - `dist` を静的配信
  - `/api/tts/voicevox` エンドポイントを保持（公開版では通常未使用）
- Dify API
  - 会話応答を生成
- Browser SpeechSynthesis
  - Render公開版のTTS経路

説明図（論理構成）:

`Browser UI -> Render Web Service -> Dify API`

`Browser UI -> Browser SpeechSynthesis (TTS)`

補足:
- VOICEVOXはローカル開発時の拡張経路です。
- Render公開版では `VITE_TTS_PROVIDER=browser` を既定とし、VOICEVOX Engineは初期対象外です。

## Data Boundary Policy

UI layer handles only normalized domain objects:

- `AvatarResponse`
- `ChatEntry`
- `AppStatus`

Dify raw response is never consumed directly by UI components. Raw payload is absorbed in adapter layer and converted to `AvatarResponse`.

## Pipeline

### Mock mode

`ChatInput -> useChatController -> mockService -> parseAvatarResponse -> AvatarResponse -> UI`

### Dify mode

`ChatInput -> useChatController -> difyClient(raw) -> difyResponseAdapter -> AvatarResponse -> UI`

## Conversation Continuity

- Controller stores `conversation_id` from Dify response
- Next Dify request sends same `conversation_id`
- This enables continuous multi-turn conversation

## Why real-time answers are limited today

- 現状PoCは、Difyへのテキスト問い合わせを中心とした構成で、外部データソース参照を組み込んでいません。
- そのため、最新ニュース・天気・価格などリアルタイム情報には正確に回答できない場合があります。

拡張方針:
- API連携（天気/業務システム）
- RAG連携（社内ドキュメント検索）

## Error Handling (P3)

- Prevent double-submit while loading
- Distinguish `misconfigured` from `error`
- Recover to sendable state after API failure
- Keep UI responsive even if SpeechSynthesis is unavailable

## Out of Scope

- Live2D animation
- External TTS providers on Render public runtime
- Realtime API
- Authentication and billing
- Persistent chat history
