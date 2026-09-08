import type { DisplayFace } from '../types/avatar'

const FALLBACK_FACE: DisplayFace = 'idle'

export const getAvatarImagePath = (face: DisplayFace | string): string => {
  const normalized =
    face === 'idle' ||
    face === 'joy' ||
    face === 'sad' ||
    face === 'angry' ||
    face === 'surprised' ||
    face === 'normal'
      ? face
      : FALLBACK_FACE

  return `/avatar/${normalized}.webp`
}
