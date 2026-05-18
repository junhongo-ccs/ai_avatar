import { useMemo, useRef, useState } from 'react'
import { adaptDifyResponse } from '../../adapters/difyResponseAdapter'
import { getDifyConfig, getDifyConnectionStatus, getTtsProvider } from '../../config/env'
import { sendMessageToDify } from '../../services/difyClient'
import { sendMessage, sendNextFaceSample } from '../../services/mockService'
import { speakText } from '../../services/speechService'
import type { ChatEntry } from '../../types/chat'
import type { AppStatus } from '../../types/status'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const initialMessageByConnectionStatus = {
  mock: 'モックMVPへようこそ。メッセージ送信か「次の表情」で確認できます。',
  connected: 'Dify接続モードです。メッセージを送信して会話を開始してください。',
  misconfigured: 'Dify設定が不足しています。.env を確認してください。',
  error: '通信エラーが発生しています。再送信を試してください。',
} as const

export const useChatController = () => {
  const config = getDifyConfig()
  const envConnectionStatus = getDifyConnectionStatus(config)
  const ttsProvider = getTtsProvider()
  const initialMode: AppStatus['mode'] = envConnectionStatus === 'mock' ? 'mock' : 'dify'

  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: createId(),
      role: 'system',
      text: initialMessageByConnectionStatus[envConnectionStatus],
      timestamp: Date.now(),
    },
  ])
  const [status, setStatus] = useState<AppStatus>({
    mode: initialMode,
    connectionStatus: envConnectionStatus,
    ttsProvider,
    isLoading: false,
    isSpeaking: false,
    currentFace: 'normal',
  })
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const loadingRef = useRef(false)

  const setLoading = (next: boolean) => {
    loadingRef.current = next
    setStatus((prev) => ({ ...prev, isLoading: next }))
  }

  const pushAssistantResponse = (text: string, face: AppStatus['currentFace']) => {
    const aiEntry: ChatEntry = {
      id: createId(),
      role: 'assistant',
      text,
      face,
      timestamp: Date.now(),
    }

    setEntries((prev) => [...prev, aiEntry])
    setLoading(false)
    setStatus((prev) => ({
      ...prev,
      currentFace: face,
      errorMessage: undefined,
      connectionStatus: prev.mode === 'dify' ? 'connected' : 'mock',
    }))
    speakText(text, status.ttsProvider, {
      onStart: () => {
        setStatus((prev) => ({ ...prev, isSpeaking: true }))
      },
      onEnd: () => {
        setStatus((prev) => ({ ...prev, isSpeaking: false }))
      },
      onFallback: (message) => {
        setStatus((prev) => ({ ...prev, errorMessage: message }))
      },
    })
  }

  const handleSend = async (text: string) => {
    if (loadingRef.current) {
      return
    }

    const value = text.trim()
    if (!value) {
      return
    }

    const userEntry: ChatEntry = {
      id: createId(),
      role: 'user',
      text: value,
      timestamp: Date.now(),
    }

    setEntries((prev) => [...prev, userEntry])
    setLoading(true)
    setStatus((prev) => ({
      ...prev,
      errorMessage: undefined,
      connectionStatus: prev.mode === 'dify' ? 'connected' : 'mock',
    }))

    if (status.connectionStatus === 'misconfigured') {
      setLoading(false)
      setStatus((prev) => ({
        ...prev,
        errorMessage: 'Dify設定が不足しています。.env の VITE_DIFY_* を確認してください。',
        connectionStatus: 'misconfigured',
      }))
      return
    }

    try {
      if (status.mode === 'mock') {
        const response = await sendMessage(value)
        pushAssistantResponse(response.text, response.face)
        return
      }

      const raw = await sendMessageToDify({ message: value, conversationId }, config)
      const adapted = adaptDifyResponse(raw)
      if (adapted.conversationId) {
        setConversationId(adapted.conversationId)
      }
      pushAssistantResponse(adapted.avatar.text, adapted.avatar.face)
    } catch {
      setLoading(false)
      setStatus((prev) => ({
        ...prev,
        connectionStatus: prev.mode === 'dify' ? 'error' : 'mock',
        isSpeaking: false,
        errorMessage:
          prev.mode === 'dify'
            ? 'Dify応答の取得に失敗しました。接続情報とアプリ公開状態を確認してください。'
            : 'モック応答の取得に失敗しました。',
      }))
    }
  }

  const handleNextFace = async () => {
    if (status.mode !== 'mock' || loadingRef.current) {
      return
    }

    setLoading(true)
    setStatus((prev) => ({ ...prev, errorMessage: undefined, connectionStatus: 'mock' }))
    try {
      const response = await sendNextFaceSample()
      pushAssistantResponse(response.text, response.face)
    } catch {
      setLoading(false)
      setStatus((prev) => ({
        ...prev,
        isSpeaking: false,
        errorMessage: '表情テストに失敗しました。',
      }))
    }
  }

  const latestError = useMemo(() => status.errorMessage, [status.errorMessage])

  return {
    entries,
    status,
    latestError,
    handleSend,
    handleNextFace,
    conversationId,
  }
}
