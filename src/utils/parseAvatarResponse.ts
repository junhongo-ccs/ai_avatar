import type { AvatarResponse } from '../types/avatar'
import { extractFaceTag } from './extractFaceTag'

type RawAvatarJson = {
  face?: string
  text?: string
  messages?: unknown
}

const asFace = (face: string | undefined) => {
  if (face === 'joy' || face === 'sad' || face === 'angry' || face === 'surprised' || face === 'normal') {
    return face
  }
  return 'normal'
}

type ParseOptions = {
  source?: AvatarResponse['source']
  fallbackText?: string
}

export const parseAvatarResponse = (raw: string, options?: ParseOptions): AvatarResponse => {
  const trimmed = raw.trim()
  const source = options?.source ?? 'dify'
  const fallbackText = options?.fallbackText ?? '応答を解釈できませんでした。'

  try {
    const parsed = JSON.parse(trimmed) as RawAvatarJson
    if (Array.isArray(parsed.messages)) {
      const messages = parsed.messages
        .filter((message): message is string => typeof message === 'string')
        .map((message) => message.trim())
        .filter(Boolean)

      if (messages.length > 0) {
        return {
          face: asFace(parsed.face),
          text: messages.join(' '),
          messages,
          raw,
          source,
        }
      }
    }
    if (typeof parsed.text === 'string') {
      const text = parsed.text.trim() || fallbackText
      return {
        face: asFace(parsed.face),
        text,
        messages: [text],
        raw,
        source,
      }
    }
  } catch {
    // fallback to tag parser when input is not JSON
  }

  const fromTag = extractFaceTag(trimmed)
  return {
    face: fromTag.face,
    text: fromTag.text.trim() || fallbackText,
    messages: [fromTag.text.trim() || fallbackText],
    raw,
    source,
  }
}
