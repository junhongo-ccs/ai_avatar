export const FACE_VALUES = ['normal', 'joy', 'sad', 'angry', 'surprised'] as const

export type Face = (typeof FACE_VALUES)[number]

export type DisplayFace = Face | 'idle'

export const FACE_LABELS: Record<DisplayFace, string> = {
  idle: 'idle',
  normal: 'normal',
  joy: 'joy',
  sad: 'sad',
  angry: 'concerned',
  surprised: 'surprised',
}

export type AvatarSource = 'dify'

export type AvatarResponse = {
  face: Face
  text: string
  messages: string[]
  raw: string
  source: AvatarSource
}
