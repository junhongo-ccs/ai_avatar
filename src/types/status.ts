import type { Face } from './avatar'
import type { TtsProvider } from './config'

export type ConnectionStatus = 'mock' | 'connected' | 'misconfigured' | 'error'

export type AppStatus = {
  mode: 'mock' | 'dify'
  connectionStatus: ConnectionStatus
  ttsProvider: TtsProvider
  isLoading: boolean
  isSpeaking: boolean
  errorMessage?: string
  currentFace: Face
}
