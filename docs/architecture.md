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

## Error Handling (P3)

- Prevent double-submit while loading
- Distinguish `misconfigured` from `error`
- Recover to sendable state after API failure
- Keep UI responsive even if SpeechSynthesis is unavailable

## Out of Scope

- Live2D animation
- Speech recognition
- External TTS providers
- Realtime API
- Authentication and billing
- Persistent chat history
