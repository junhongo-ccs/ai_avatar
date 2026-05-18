// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  createSpeechRecognitionController,
  isSpeechRecognitionSupported,
} from './speechRecognitionService'

class RecognitionMock {
  static lastInstance: RecognitionMock | null = null
  lang = ''
  continuous = false
  interimResults = false
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: { error?: string }) => void) | null = null
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null = null
  constructor() {
    RecognitionMock.lastInstance = this
  }

  start() {
    this.onstart?.()
  }

  stop() {
    this.onend?.()
  }
}

describe('speechRecognitionService', () => {
  it('is available when SpeechRecognition exists', () => {
    window.SpeechRecognition = RecognitionMock as never
    expect(isSpeechRecognitionSupported()).toBe(true)
  })

  it('is unavailable when SpeechRecognition does not exist', () => {
    window.SpeechRecognition = undefined
    window.webkitSpeechRecognition = undefined
    expect(isSpeechRecognitionSupported()).toBe(false)
  })

  it('is available when only webkitSpeechRecognition exists', () => {
    window.SpeechRecognition = undefined
    window.webkitSpeechRecognition = RecognitionMock as never
    expect(isSpeechRecognitionSupported()).toBe(true)
  })

  it('creates working controller with callbacks', () => {
    window.SpeechRecognition = RecognitionMock as never
    let started = false
    let ended = false
    let transcript = ''

    const controller = createSpeechRecognitionController({
      lang: 'ja-JP',
      onStart: () => {
        started = true
      },
      onEnd: () => {
        ended = true
      },
      onResult: (text) => {
        transcript = text
      },
    })

    expect(controller.isSupported).toBe(true)
    controller.start()

    RecognitionMock.lastInstance?.onresult?.({ results: [[{ transcript: 'こんにちは' }]] })

    controller.stop()

    expect(started).toBe(true)
    expect(ended).toBe(true)
    expect(transcript).toBe('こんにちは')
  })
})
