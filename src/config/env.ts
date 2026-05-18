import type { DifyConfig, DifyConnectionStatus } from '../types/config'

const normalizeBool = (value: string | undefined) => value?.toLowerCase() === 'true'

type EnvLike = Record<string, string | undefined>

export const getDifyConfigFrom = (env: EnvLike): DifyConfig => {
  return {
    apiUrl: env.VITE_DIFY_API_URL?.trim() ?? '',
    apiKey: env.VITE_DIFY_API_KEY?.trim() ?? '',
    userId: env.VITE_DIFY_USER_ID?.trim() || 'local-user-001',
    useMock: normalizeBool(env.VITE_USE_MOCK),
  }
}

export const getDifyConfig = (): DifyConfig => getDifyConfigFrom(import.meta.env)

export const getDifyConnectionStatus = (config: DifyConfig): DifyConnectionStatus => {
  if (config.useMock) {
    return 'mock'
  }

  if (!config.apiUrl || !config.apiKey || !config.userId) {
    return 'misconfigured'
  }

  return 'connected'
}
