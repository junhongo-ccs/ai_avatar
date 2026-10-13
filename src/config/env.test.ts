import { describe, expect, it } from 'vitest'
import { getTtsProviderFrom } from './env'

describe('env config', () => {
  it('returns browser as default tts provider', () => {
    expect(getTtsProviderFrom({})).toBe('browser')
  })

  it('returns voicevox when configured', () => {
    expect(getTtsProviderFrom({ VITE_TTS_PROVIDER: 'voicevox' })).toBe('voicevox')
  })
})
