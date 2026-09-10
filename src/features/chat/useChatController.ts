import { useEffect, useMemo, useRef, useState } from 'react'
import { adaptDifyResponse } from '../../adapters/difyResponseAdapter'
import { getDifyConfig, getDifyConnectionStatus, getTtsProvider } from '../../config/env'
import { sendMessageToDify } from '../../services/difyClient'
import { speakText, stopSpeaking } from '../../services/speechService'
import type { Face } from '../../types/avatar'
import type { ChatEntry } from '../../types/chat'
import type { AppStatus } from '../../types/status'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
const SPOKEN_FACE_HOLD_MS = 1500
const SILENT_FACE_HOLD_MS = 1500
const MESSAGE_BUBBLE_DELAY_MS = 1000

const initialMessageByConnectionStatus = {
  connected:
    'こんにちは。会社のことや働き方、選考について気になることがあれば、お気軽に聞いてください。\n\nこんな内容ならお答えできます。\n- 勤務地について\n- 在宅勤務について\n- 残業時間について\n- 新人研修について\n- 福利厚生について\n- その他（＊QAは今後も追加予定）',
  misconfigured: 'Dify設定が不足しています。.env を確認してください。',
  error: '通信エラーが発生しています。再送信を試してください。',
} as const

type UseChatControllerOptions = {
  audioOutputAllowed?: boolean
}

export const useChatController = ({ audioOutputAllowed = true }: UseChatControllerOptions = {}) => {
  const config = getDifyConfig()
  const envConnectionStatus = getDifyConnectionStatus(config)
  const ttsProvider = getTtsProvider()

  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: createId(),
      role: 'system',
      text: initialMessageByConnectionStatus[envConnectionStatus],
      timestamp: Date.now(),
    },
  ])
  const [status, setStatus] = useState<AppStatus>({
    mode: 'dify',
    connectionStatus: envConnectionStatus,
    ttsProvider,
    audioEnabled: true,
    isLoading: false,
    isSpeaking: false,
    currentFace: 'idle',
  })
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const loadingRef = useRef(false)
  const audioOutputAllowedRef = useRef(audioOutputAllowed)
  const faceResetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const messageTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([])
  const pendingAssistantEntriesRef = useRef<ChatEntry[]>([])
  const responseSequenceRef = useRef(0)

  audioOutputAllowedRef.current = audioOutputAllowed

  const clearFaceResetTimer = () => {
    if (faceResetTimerRef.current) {
      clearTimeout(faceResetTimerRef.current)
      faceResetTimerRef.current = undefined
    }
  }

  const clearMessageTimers = () => {
    messageTimerRefs.current.forEach(clearTimeout)
    messageTimerRefs.current = []
  }

  const flushPendingAssistantEntries = () => {
    clearMessageTimers()
    const pendingEntries = pendingAssistantEntriesRef.current
    pendingAssistantEntriesRef.current = []
    if (pendingEntries.length > 0) {
      setEntries((prev) => [...prev, ...pendingEntries])
    }
  }

  const scheduleIdleFace = (sequence: number, delayMs = SPOKEN_FACE_HOLD_MS) => {
    clearFaceResetTimer()
    faceResetTimerRef.current = setTimeout(() => {
      if (sequence === responseSequenceRef.current) {
        setStatus((prev) => ({ ...prev, currentFace: 'idle' }))
      }
    }, delayMs)
  }

  useEffect(() => () => {
    clearFaceResetTimer()
    clearMessageTimers()
  }, [])

  useEffect(() => {
    if (audioOutputAllowed) {
      return
    }

    stopSpeaking()
    setStatus((prev) => ({ ...prev, isSpeaking: false }))
  }, [audioOutputAllowed])

  const setLoading = (next: boolean) => {
    loadingRef.current = next
    setStatus((prev) => ({ ...prev, isLoading: next }))
  }

  const pushAssistantResponse = (messages: string[], face: Face) => {
    const responseSequence = responseSequenceRef.current + 1
    responseSequenceRef.current = responseSequence
    clearFaceResetTimer()
    flushPendingAssistantEntries()

    const responseText = messages.join(' ')
    const aiEntries: ChatEntry[] = messages.map((text, index) => ({
      id: createId(),
      role: 'assistant',
      text,
      face,
      timestamp: Date.now() + index,
    }))

    const [firstEntry, ...remainingEntries] = aiEntries
    if (firstEntry) {
      setEntries((prev) => [...prev, firstEntry])
    }
    pendingAssistantEntriesRef.current = remainingEntries
    remainingEntries.forEach((entry, index) => {
      const timer = setTimeout(() => {
        if (responseSequence !== responseSequenceRef.current) {
          return
        }
        const pendingEntries = pendingAssistantEntriesRef.current
        if (!pendingEntries.some((pendingEntry) => pendingEntry.id === entry.id)) {
          return
        }
        pendingAssistantEntriesRef.current = pendingEntries.filter((pendingEntry) => pendingEntry.id !== entry.id)
        setEntries((prev) => [...prev, entry])
      }, (index + 1) * MESSAGE_BUBBLE_DELAY_MS)
      messageTimerRefs.current.push(timer)
    })
    setLoading(false)
    setStatus((prev) => ({
      ...prev,
      currentFace: face,
      errorMessage: undefined,
      connectionStatus: 'connected',
    }))
    if (!status.audioEnabled || !audioOutputAllowedRef.current) {
      scheduleIdleFace(responseSequence, SILENT_FACE_HOLD_MS + remainingEntries.length * MESSAGE_BUBBLE_DELAY_MS)
      return
    }

    speakText(responseText, status.ttsProvider, {
      onStart: () => {
        if (responseSequence !== responseSequenceRef.current) {
          return
        }
        // VOICEVOX playback can fail before browser fallback begins. Its onEnd
        // schedules an idle reset, so cancel that reset and restore the response
        // face once fallback playback actually starts.
        clearFaceResetTimer()
        setStatus((prev) => ({ ...prev, isSpeaking: true, currentFace: face }))
      },
      onEnd: () => {
        if (responseSequence !== responseSequenceRef.current) {
          return
        }
        setStatus((prev) => ({ ...prev, isSpeaking: false }))
        scheduleIdleFace(responseSequence)
      },
      onFallback: (message) => {
        setStatus((prev) => ({ ...prev, errorMessage: message }))
      },
    })
  }

  const setAudioEnabled = (enabled: boolean) => {
    if (!enabled) {
      stopSpeaking()
      const pendingBubbleDelayMs = pendingAssistantEntriesRef.current.length * MESSAGE_BUBBLE_DELAY_MS
      scheduleIdleFace(responseSequenceRef.current, SILENT_FACE_HOLD_MS + pendingBubbleDelayMs)
    }

    setStatus((prev) => ({
      ...prev,
      audioEnabled: enabled,
      isSpeaking: enabled ? prev.isSpeaking : false,
    }))
  }

  const handleSend = async (text: string) => {
    if (loadingRef.current) {
      return
    }

    const value = text.trim()
    if (!value) {
      return
    }

    responseSequenceRef.current += 1
    clearFaceResetTimer()
    flushPendingAssistantEntries()

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
      connectionStatus: 'connected',
      currentFace: 'idle',
    }))

    if (status.connectionStatus === 'misconfigured') {
      setLoading(false)
      setStatus((prev) => ({
        ...prev,
        errorMessage: 'Dify設定が不足しています。.env の VITE_DIFY_* を確認してください。',
        connectionStatus: 'misconfigured',
        currentFace: 'idle',
      }))
      return
    }

    try {
      const raw = await sendMessageToDify({ message: value, conversationId }, config)
      const adapted = adaptDifyResponse(raw)
      if (adapted.conversationId) {
        setConversationId(adapted.conversationId)
      }
      pushAssistantResponse(adapted.avatar.messages, adapted.avatar.face)
    } catch {
      setLoading(false)
      setStatus((prev) => ({
        ...prev,
        connectionStatus: 'error',
        isSpeaking: false,
        currentFace: 'idle',
        errorMessage: 'Dify応答の取得に失敗しました。接続情報とアプリ公開状態を確認してください。',
      }))
    }
  }

  const latestError = useMemo(() => status.errorMessage, [status.errorMessage])

  return {
    entries,
    status,
    latestError,
    handleSend,
    setAudioEnabled,
    conversationId,
  }
}
