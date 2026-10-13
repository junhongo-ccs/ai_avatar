import type { TtsProvider } from '../types/config'

type EnvLike = Record<string, string | undefined>

export const getTtsProviderFrom = (env: EnvLike): TtsProvider =>
  env.VITE_TTS_PROVIDER === 'voicevox' ? 'voicevox' : 'browser'

// Read the single variable instead of passing the whole import.meta.env:
// Vite inlines every VITE_* value into the bundle when the object is used as a whole.
export const getTtsProvider = (): TtsProvider =>
  getTtsProviderFrom({ VITE_TTS_PROVIDER: import.meta.env.VITE_TTS_PROVIDER })
