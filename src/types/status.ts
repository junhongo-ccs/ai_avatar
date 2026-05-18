import type { Face } from './avatar'

export type AppStatus = {
  mode: 'mock'
  isLoading: boolean
  errorMessage?: string
  currentFace: Face
}
