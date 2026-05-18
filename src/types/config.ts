export type DifyConfig = {
  apiUrl: string
  apiKey: string
  userId: string
  useMock: boolean
}

export type DifyConnectionStatus = 'mock' | 'connected' | 'misconfigured'
export type TtsProvider = 'browser' | 'voicevox'
