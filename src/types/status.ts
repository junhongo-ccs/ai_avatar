import type { Face } from './avatar'
import type { TtsProvider } from './config'

export type ConnectionStatus = 'connected' | 'misconfigured' | 'error'

export type AppStatus = {
  mode: 'dify'
  connectionStatus: ConnectionStatus
  ttsProvider: TtsProvider
  audioEnabled: boolean
  isLoading: boolean
  isSpeaking: boolean
  errorMessage?: string
  currentFace: Face
}
