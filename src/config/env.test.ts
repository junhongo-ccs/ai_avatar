import { describe, expect, it } from 'vitest'
import { getDifyConfigFrom, getDifyConnectionStatus, getTtsProviderFrom } from './env'

describe('env config', () => {
  it('returns connected when all Dify fields exist', () => {
    const config = getDifyConfigFrom({
      VITE_DIFY_API_URL: 'https://api.dify.ai/v1',
      VITE_DIFY_API_KEY: 'x',
      VITE_DIFY_USER_ID: 'user-1',
    })

    expect(getDifyConnectionStatus(config)).toBe('connected')
  })

  it('returns misconfigured when Dify config is missing', () => {
    const config = getDifyConfigFrom({
      VITE_DIFY_API_URL: '',
      VITE_DIFY_API_KEY: '',
      VITE_DIFY_USER_ID: '',
    })

    expect(getDifyConnectionStatus(config)).toBe('misconfigured')
  })

  it('returns browser as default tts provider', () => {
    expect(getTtsProviderFrom({})).toBe('browser')
  })

  it('returns voicevox when configured', () => {
    expect(getTtsProviderFrom({ VITE_TTS_PROVIDER: 'voicevox' })).toBe('voicevox')
  })
})
