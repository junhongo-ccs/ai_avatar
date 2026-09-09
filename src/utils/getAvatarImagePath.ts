import type { DisplayFace } from '../types/avatar'

const FALLBACK_FACE: DisplayFace = 'idle'

export const getAvatarImagePath = (face: DisplayFace | string, blink = false): string => {
  const normalized =
    face === 'idle' ||
    face === 'joy' ||
    face === 'sad' ||
    face === 'angry' ||
    face === 'surprised' ||
    face === 'normal'
      ? face
      : FALLBACK_FACE

  const variant = blink && normalized === 'idle' ? 'idle-blink' : normalized

  return `/avatar/${variant}.webp`
}
