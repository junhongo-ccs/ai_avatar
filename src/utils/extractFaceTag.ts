import { FACE_VALUES, type Face } from '../types/avatar'

const facePattern = /^\[face:([a-z]+)\]\s*/i

export const extractFaceTag = (rawText: string): { face: Face; text: string } => {
  const input = rawText.trim()
  const matched = input.match(facePattern)
  if (!matched) {
    return { face: 'normal', text: input }
  }

  const candidate = matched[1].toLowerCase()
  const face = FACE_VALUES.includes(candidate as Face) ? (candidate as Face) : 'normal'
  const text = input.replace(facePattern, '').trim()

  return { face, text }
}
