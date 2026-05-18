// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { ChatInput } from './ChatInput'

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

describe('ChatInput with speech recognition', () => {
  afterEach(() => {
    cleanup()
  })

  it('reflects recognition result into text input', async () => {
    window.SpeechRecognition = RecognitionMock as never
    const onSend = vi.fn().mockResolvedValue(undefined)

    render(<ChatInput onSend={onSend} />)

    fireEvent.click(screen.getByRole('button', { name: 'マイク開始' }))
    RecognitionMock.lastInstance?.onresult?.({ results: [[{ transcript: '音声テキスト' }]] })

    await waitFor(() => {
      const input = screen.getByPlaceholderText('メッセージを入力') as HTMLInputElement
      expect(input.value).toBe('音声テキスト')
    })
  })

  it('toggles listening state with start/stop', async () => {
    window.SpeechRecognition = RecognitionMock as never
    const onSend = vi.fn().mockResolvedValue(undefined)

    render(<ChatInput onSend={onSend} />)

    fireEvent.click(screen.getByRole('button', { name: 'マイク開始' }))
    expect(await screen.findByText('音声入力: 認識中...')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'マイク停止' }))
    expect(await screen.findByText('音声入力: 待機中')).toBeTruthy()
  })

  it('keeps text send working when speech is unsupported', async () => {
    window.SpeechRecognition = undefined
    window.webkitSpeechRecognition = undefined

    const onSend = vi.fn().mockResolvedValue(undefined)
    render(<ChatInput onSend={onSend} />)

    const micButton = screen.getByRole('button', { name: 'マイク開始' }) as HTMLButtonElement
    expect(micButton.disabled).toBe(true)

    const input = screen.getByPlaceholderText('メッセージを入力')
    fireEvent.change(input, { target: { value: '手入力メッセージ' } })
    fireEvent.click(screen.getByRole('button', { name: '送信' }))

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('手入力メッセージ')
    })
  })
})
