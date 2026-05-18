export const FACE_VALUES = ['normal', 'joy', 'sad', 'angry', 'surprised'] as const

export type Face = (typeof FACE_VALUES)[number]

export type AvatarSource = 'mock'

export type AvatarResponse = {
  face: Face
  text: string
  raw: string
  source: AvatarSource
}
