import type { DifyConfig, DifyConnectionStatus, TtsProvider } from '../types/config'

type EnvLike = Record<string, string | undefined>

export const getDifyConfigFrom = (env: EnvLike): DifyConfig => {
  return {
    apiUrl: env.VITE_DIFY_API_URL?.trim() ?? '',
    apiKey: env.VITE_DIFY_API_KEY?.trim() ?? '',
    userId: env.VITE_DIFY_USER_ID?.trim() || 'local-user-001',
  }
}

export const getDifyConfig = (): DifyConfig => getDifyConfigFrom(import.meta.env)

export const getTtsProviderFrom = (env: EnvLike): TtsProvider =>
  env.VITE_TTS_PROVIDER === 'voicevox' ? 'voicevox' : 'browser'

export const getTtsProvider = (): TtsProvider => getTtsProviderFrom(import.meta.env)

export const getDifyConnectionStatus = (config: DifyConfig): DifyConnectionStatus => {
  if (!config.apiUrl || !config.apiKey || !config.userId) {
    return 'misconfigured'
  }

  return 'connected'
}
