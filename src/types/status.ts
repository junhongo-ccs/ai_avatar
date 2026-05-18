import type { Face } from './avatar'

export type ConnectionStatus = 'mock' | 'connected' | 'misconfigured' | 'error'

export type AppStatus = {
  mode: 'mock' | 'dify'
  connectionStatus: ConnectionStatus
  isLoading: boolean
  errorMessage?: string
  currentFace: Face
}
