import type { Face } from '../types/avatar'

const FALLBACK_FACE: Face = 'normal'

export const getAvatarImagePath = (face: Face | string): string => {
  const normalized =
    face === 'joy' || face === 'sad' || face === 'angry' || face === 'surprised' || face === 'normal'
      ? face
      : FALLBACK_FACE

  return `/avatar/${normalized}.png`
}
