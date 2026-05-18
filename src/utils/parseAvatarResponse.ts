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

export const parseAvatarResponse = (raw: string): AvatarResponse => {
  const trimmed = raw.trim()

  try {
    const parsed = JSON.parse(trimmed) as RawAvatarJson
    if (typeof parsed.text === 'string') {
      return {
        face: asFace(parsed.face),
        text: parsed.text.trim(),
        raw,
        source: 'mock',
      }
    }
  } catch {
    // fallback to tag parser when input is not JSON
  }

  const fromTag = extractFaceTag(trimmed)
  return {
    face: fromTag.face,
    text: fromTag.text,
    raw,
    source: 'mock',
  }
}
