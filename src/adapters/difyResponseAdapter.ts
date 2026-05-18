import type { AvatarResponse, Face } from '../types/avatar'
import { parseAvatarResponse } from '../utils/parseAvatarResponse'

const SAFE_TEXT = '応答を解釈できませんでした。もう一度お試しください。'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asSafeFace = (value: unknown): Face => {
  if (value === 'normal' || value === 'joy' || value === 'sad' || value === 'angry' || value === 'surprised') {
    return value
  }
  return 'normal'
}

export type AdaptedDifyResult = {
  avatar: AvatarResponse
  conversationId?: string
}

export const adaptDifyResponse = (raw: unknown): AdaptedDifyResult => {
  if (!isRecord(raw)) {
    return {
      avatar: {
        face: 'normal',
        text: SAFE_TEXT,
        raw: String(raw),
        source: 'dify',
      },
    }
  }

  const conversationId = typeof raw.conversation_id === 'string' ? raw.conversation_id : undefined
  const answer = typeof raw.answer === 'string' ? raw.answer : ''

  const parsed = parseAvatarResponse(answer, {
    source: 'dify',
    fallbackText: SAFE_TEXT,
  })

  return {
    avatar: {
      ...parsed,
      face: asSafeFace(parsed.face),
      text: parsed.text.trim() || SAFE_TEXT,
    },
    conversationId,
  }
}
