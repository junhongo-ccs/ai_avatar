// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const envState = {
  mode: 'mock' as 'mock' | 'connected' | 'misconfigured',
}

const sendMessageMock = vi.fn()
const sendNextFaceSampleMock = vi.fn()
const sendMessageToDifyMock = vi.fn()
const speakTextMock = vi.fn()

vi.mock('../../config/env', () => ({
  getDifyConfig: () => ({
    apiUrl: 'https://api.dify.ai/v1',
    apiKey: 'dummy',
    userId: 'user-1',
    useMock: envState.mode === 'mock',
  }),
  getDifyConnectionStatus: () => envState.mode,
}))

vi.mock('../../services/mockService', () => ({
  sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  sendNextFaceSample: (...args: unknown[]) => sendNextFaceSampleMock(...args),
}))

vi.mock('../../services/difyClient', () => ({
  sendMessageToDify: (...args: unknown[]) => sendMessageToDifyMock(...args),
}))

vi.mock('../../services/speechService', () => ({
  speakText: (...args: unknown[]) => speakTextMock(...args),
}))

import { useChatController } from './useChatController'

beforeEach(() => {
  sendMessageMock.mockReset()
  sendNextFaceSampleMock.mockReset()
  sendMessageToDifyMock.mockReset()
  speakTextMock.mockReset()
})

describe('useChatController', () => {
  it('mock path works when VITE_USE_MOCK=true', async () => {
    envState.mode = 'mock'
    sendMessageMock.mockResolvedValue({ face: 'joy', text: 'mock ok' })

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('hello')
    })

    expect(sendMessageMock).toHaveBeenCalledTimes(1)
    expect(sendMessageToDifyMock).not.toHaveBeenCalled()
    expect(result.current.status.mode).toBe('mock')
    expect(result.current.status.connectionStatus).toBe('mock')
  })

  it('prevents double send while loading', async () => {
    envState.mode = 'mock'
    let resolveMock: ((value: { face: 'joy'; text: string }) => void) | undefined
    sendMessageMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMock = resolve
        }),
    )

    const { result } = renderHook(() => useChatController())

    act(() => {
      void result.current.handleSend('first')
      void result.current.handleSend('second')
    })

    expect(sendMessageMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveMock?.({ face: 'joy', text: 'done' })
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

  it('misconfigured does not call APIs', async () => {
    envState.mode = 'misconfigured'

    const { result } = renderHook(() => useChatController())

    await act(async () => {
      await result.current.handleSend('test')
    })

    expect(sendMessageMock).not.toHaveBeenCalled()
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
})
