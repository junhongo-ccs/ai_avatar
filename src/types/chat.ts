import type { Face } from './avatar'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatEntry = {
  id: string
  role: ChatRole
  text: string
  face?: Face
  timestamp: number
}
