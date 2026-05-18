import { useMemo, useState } from 'react'
import { sendMessage, sendNextFaceSample } from '../../services/mockService'
import { speakText } from '../../services/speechService'
import type { ChatEntry } from '../../types/chat'
import type { AppStatus } from '../../types/status'

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useChatController = () => {
  const [entries, setEntries] = useState<ChatEntry[]>([
    {
      id: createId(),
      role: 'system',
      text: 'モックMVPへようこそ。メッセージ送信か「次の表情」で確認できます。',
      timestamp: Date.now(),
    },
  ])
  const [status, setStatus] = useState<AppStatus>({
    mode: 'mock',
    isLoading: false,
    currentFace: 'normal',
  })

  const handleSend = async (text: string) => {
    const userEntry: ChatEntry = {
      id: createId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    }

    setEntries((prev) => [...prev, userEntry])
    setStatus((prev) => ({ ...prev, isLoading: true, errorMessage: undefined }))

    try {
      const response = await sendMessage(text)
      pushAssistantResponse(response.text, response.face)
    } catch {
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: 'モック応答の取得に失敗しました。',
      }))
    }
  }

  const latestError = useMemo(() => status.errorMessage, [status.errorMessage])

  const pushAssistantResponse = (text: string, face: AppStatus['currentFace']) => {
    const aiEntry: ChatEntry = {
      id: createId(),
      role: 'assistant',
      text,
      face,
      timestamp: Date.now(),
    }
    setEntries((prev) => [...prev, aiEntry])
    setStatus((prev) => ({
      ...prev,
      isLoading: false,
      currentFace: face,
    }))
    speakText(text)
  }

  const handleNextFace = async () => {
    setStatus((prev) => ({ ...prev, isLoading: true, errorMessage: undefined }))
    try {
      const response = await sendNextFaceSample()
      pushAssistantResponse(response.text, response.face)
    } catch {
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: '表情テストに失敗しました。',
      }))
    }
  }

  return {
    entries,
    status,
    latestError,
    handleSend,
    handleNextFace,
  }
}
