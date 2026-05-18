// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { speakText } from './speechService'

class UtteranceMock {
  text = ''
  lang = ''
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

class AudioMock {
  static shouldFail = false
  onplay: (() => void) | null = null
  onended: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(_url: string) {}

  async play(): Promise<void> {
    if (AudioMock.shouldFail) {
      this.onerror?.()
      throw new Error('play failed')
    }

    this.onplay?.()
    this.onended?.()
  }
}

describe('speechService', () => {
  beforeEach(() => {
    AudioMock.shouldFail = false
    vi.restoreAllMocks()

    ;(globalThis as unknown as { SpeechSynthesisUtterance: typeof UtteranceMock }).SpeechSynthesisUtterance =
      UtteranceMock
    ;(globalThis as unknown as { Audio: typeof AudioMock }).Audio = AudioMock

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: {
        cancel: vi.fn(),
        speak: vi.fn((utterance: UtteranceMock) => {
          utterance.onstart?.()
          utterance.onend?.()
        }),
      },
    })

    globalThis.fetch = vi.fn() as unknown as typeof fetch
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:voice')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('uses browser speech when provider is browser', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()

    speakText('こんにちは', 'browser', { onStart, onEnd })

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalled()
  })

  it('calls voicevox endpoint when provider is voicevox', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['wav'], { type: 'audio/wav' }),
    })

    speakText('VOICEVOXで再生', 'voicevox')
    await Promise.resolve()
    await Promise.resolve()

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tts/voicevox', expect.any(Object))
  })

  it('falls back to browser when voicevox fails', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false })
    const onFallback = vi.fn()

    speakText('fallback test', 'voicevox', { onFallback })
    await Promise.resolve()
    await Promise.resolve()

    expect(onFallback).toHaveBeenCalled()
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1)
  })

  it('toggles speaking callbacks on voicevox playback', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['wav'], { type: 'audio/wav' }),
    })
    const onStart = vi.fn()
    const onEnd = vi.fn()

    speakText('speaking state', 'voicevox', { onStart, onEnd })
    await Promise.resolve()
    await Promise.resolve()

    expect(onStart).toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalled()
  })
})
