// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const envState = {
  mode: 'connected' as 'connected' | 'misconfigured',
}

const sendMessageToDifyMock = vi.fn()
const speakTextMock = vi.fn()
const stopSpeakingMock = vi.fn()

vi.mock('../../config/env', () => ({
  getDifyConfig: () => ({
    apiUrl: 'https://api.dify.ai/v1',
    apiKey: 'dummy',
    userId: 'user-1',
  }),
  getDifyConnectionStatus: () => envState.mode,
  getTtsProvider: () => 'browser',
}))

vi.mock('../../services/difyClient', () => ({
  sendMessageToDify: (...args: unknown[]) => sendMessageToDifyMock(...args),
}))

vi.mock('../../services/speechService', () => ({
  speakText: (...args: unknown[]) => speakTextMock(...args),
  stopSpeaking: () => stopSpeakingMock(),
}))

import { useChatController } from './useChatController'

beforeEach(() => {
  sendMessageToDifyMock.mockReset()
  speakTextMock.mockReset()
  stopSpeakingMock.mockReset()
})

describe('useChatController', () => {
  it('prevents double send while loading', async () => {
    envState.mode = 'connected'
    let resolveDify: ((value: { answer: string; conversation_id: string }) => void) | undefined
    sendMessageToDifyMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDify = resolve
        }),
    )

    const { result } = renderHook(() => useChatController())

    act(() => {
      void result.current.handleSend('first')
      void result.current.handleSend('second')
    })

    expect(sendMessageToDifyMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveDify?.({ answer: '{"face":"joy","text":"done"}', conversation_id: 'conv-1' })
      await Promise.resolve()
    })
  })

  it('uses dify path and keeps conversation_id', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock
      .mockResolvedValueOnce({ answer: '{"face":"joy","text":"one"}', conversation_id: 'conv-1' })
      .mockResolvedValueOnce({ answer: '{"face":"sad","text":"two"}', conversation_id: 'conv-1' })

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('first')
    })

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-1')
    })

    await act(async () => {
      await result.current.handleSend('second')
    })

    expect(sendMessageToDifyMock).toHaveBeenNthCalledWith(
      1,
      { message: 'first', conversationId: undefined },
      expect.any(Object),
    )
    expect(sendMessageToDifyMock).toHaveBeenNthCalledWith(
      2,
      { message: 'second', conversationId: 'conv-1' },
      expect.any(Object),
    )
    expect(result.current.status.mode).toBe('dify')
    expect(result.current.status.connectionStatus).toBe('connected')
  })

  it('returns face to normal after a sad response when next answer is plain text', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock
      .mockResolvedValueOnce({ answer: '{"face":"sad","text":"first"}', conversation_id: 'conv-1' })
      .mockResolvedValueOnce({ answer: 'タグなしの通常応答です', conversation_id: 'conv-1' })

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('first')
    })

    expect(result.current.status.currentFace).toBe('sad')

    await act(async () => {
      await result.current.handleSend('second')
    })

    expect(result.current.status.currentFace).toBe('normal')
  })

  it('returns to idle while waiting for the next response', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock.mockResolvedValueOnce({
      answer: '{"face":"joy","text":"first"}',
      conversation_id: 'conv-1',
    })
    let resolveDify: ((value: { answer: string; conversation_id: string }) => void) | undefined
    sendMessageToDifyMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDify = resolve
        }),
    )

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('first')
    })
    expect(result.current.status.currentFace).toBe('joy')

    act(() => {
      void result.current.handleSend('second')
    })
    expect(result.current.status.currentFace).toBe('idle')

    await act(async () => {
      resolveDify?.({ answer: '{"face":"normal","text":"second"}', conversation_id: 'conv-1' })
      await Promise.resolve()
    })
  })

  it('adds Dify messages as separate assistant entries', async () => {
    vi.useFakeTimers()
    envState.mode = 'connected'
    sendMessageToDifyMock.mockResolvedValueOnce({
      answer: '{"face":"normal","messages":["1つ目の回答","2つ目の回答"]}',
      conversation_id: 'conv-1',
    })
    const { result } = renderHook(() => useChatController())

    try {
      await act(async () => {
        await result.current.handleSend('質問')
      })
      expect(result.current.entries.filter((entry) => entry.role === 'assistant').map((entry) => entry.text))
        .toEqual(['1つ目の回答'])

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.entries.filter((entry) => entry.role === 'assistant').map((entry) => entry.text))
        .toEqual(['1つ目の回答', '2つ目の回答'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('flushes delayed bubbles before sending the next question', async () => {
    vi.useFakeTimers()
    envState.mode = 'connected'
    sendMessageToDifyMock
      .mockResolvedValueOnce({
        answer: '{"face":"normal","messages":["1つ目","2つ目","3つ目"]}',
        conversation_id: 'conv-1',
      })
      .mockResolvedValueOnce({ answer: '{"face":"normal","text":"次の回答"}', conversation_id: 'conv-1' })
    const { result } = renderHook(() => useChatController())

    try {
      await act(async () => {
        await result.current.handleSend('最初の質問')
      })
      await act(async () => {
        await result.current.handleSend('次の質問')
      })

      expect(result.current.entries.map((entry) => entry.text)).toEqual([
        expect.any(String),
        '最初の質問',
        '1つ目',
        '2つ目',
        '3つ目',
        '次の質問',
        '次の回答',
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it('misconfigured does not call API', async () => {
    envState.mode = 'misconfigured'

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('test')
    })

    expect(sendMessageToDifyMock).not.toHaveBeenCalled()
    expect(result.current.status.mode).toBe('dify')
    expect(result.current.status.connectionStatus).toBe('misconfigured')
    expect(result.current.latestError).toContain('Dify設定が不足')
  })

  it('sets error status on dify API failure', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock.mockRejectedValueOnce(new Error('network'))

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('first')
    })

    expect(result.current.status.connectionStatus).toBe('error')
    expect(result.current.status.isLoading).toBe(false)
    expect(result.current.latestError).toContain('Dify応答の取得に失敗')
  })

  it('returns to sendable state after error', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ answer: '{"face":"joy","text":"retry ok"}', conversation_id: 'conv-r' })

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('first')
    })

    expect(result.current.status.connectionStatus).toBe('error')

    await act(async () => {
      await result.current.handleSend('retry')
    })

    expect(sendMessageToDifyMock).toHaveBeenCalledTimes(2)
    expect(result.current.status.connectionStatus).toBe('connected')
    expect(result.current.status.isLoading).toBe(false)
    expect(result.current.latestError).toBeUndefined()
  })

  it('does not speak when audio is turned off', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock.mockResolvedValueOnce({
      answer: '{"face":"joy","text":"audio off"}',
      conversation_id: 'conv-off',
    })

    const { result } = renderHook(() => useChatController())

    act(() => {
      result.current.setAudioEnabled(false)
    })

    await act(async () => {
      await result.current.handleSend('first')
    })

    expect(speakTextMock).not.toHaveBeenCalled()
    expect(result.current.status.audioEnabled).toBe(false)
  })

  it('stops current speech when audio is turned off', () => {
    envState.mode = 'connected'
    const { result } = renderHook(() => useChatController())

    act(() => {
      result.current.setAudioEnabled(false)
    })

    expect(stopSpeakingMock).toHaveBeenCalledTimes(1)
  })

  it('keeps the response face while a browser fallback starts after an earlier end callback', async () => {
    vi.useFakeTimers()
    envState.mode = 'connected'
    sendMessageToDifyMock.mockResolvedValueOnce({
      answer: '{"face":"joy","text":"fallback playback"}',
      conversation_id: 'conv-fallback',
    })
    let callbacks: { onStart?: () => void; onEnd?: () => void } | undefined
    speakTextMock.mockImplementation((_text, _provider, nextCallbacks) => {
      callbacks = nextCallbacks
    })
    const { result } = renderHook(() => useChatController())

    try {
      await act(async () => {
        await result.current.handleSend('first')
      })

      act(() => {
        callbacks?.onEnd?.()
        vi.advanceTimersByTime(1000)
        callbacks?.onStart?.()
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.status.isSpeaking).toBe(true)
      expect(result.current.status.currentFace).toBe('joy')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not speak when audio output is disallowed', async () => {
    envState.mode = 'connected'
    sendMessageToDifyMock.mockResolvedValueOnce({
      answer: '{"face":"joy","text":"mobile silent"}',
      conversation_id: 'conv-mobile',
    })

    const { result } = renderHook(() => useChatController({ audioOutputAllowed: false }))

    await act(async () => {
      await result.current.handleSend('first')
    })

    expect(speakTextMock).not.toHaveBeenCalled()
  })

  it('stops speech when audio output becomes disallowed', () => {
    envState.mode = 'connected'
    const { rerender } = renderHook(
      ({ audioOutputAllowed }) => useChatController({ audioOutputAllowed }),
      { initialProps: { audioOutputAllowed: true } },
    )

    rerender({ audioOutputAllowed: false })

    expect(stopSpeakingMock).toHaveBeenCalledTimes(1)
  })
})
