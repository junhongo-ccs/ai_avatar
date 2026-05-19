import type { AvatarResponse } from '../types/avatar'
import { extractFaceTag } from './extractFaceTag'

type RawAvatarJson = {
  face?: string
  text?: string
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
    if (typeof parsed.text === 'string') {
      return {
        face: asFace(parsed.face),
        text: parsed.text.trim() || fallbackText,
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
    raw,
    source,
  }
}
