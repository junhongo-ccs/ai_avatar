import type { TtsProvider } from '../types/config'

type SpeakCallbacks = {
  onStart?: () => void
  onEnd?: () => void
  onFallback?: (message: string) => void
}

const speakWithBrowser = (text: string, callbacks?: SpeakCallbacks): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks?.onEnd?.()
    return
  }

  const value = text.trim()
  if (!value) {
    callbacks?.onEnd?.()
    return
  }

  const utterance = new SpeechSynthesisUtterance(value)
  utterance.lang = 'ja-JP'
  utterance.onstart = () => callbacks?.onStart?.()
  utterance.onend = () => callbacks?.onEnd?.()
  utterance.onerror = () => callbacks?.onEnd?.()

  try {
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch {
    callbacks?.onEnd?.()
  }
}

const speakWithVoicevox = async (text: string, callbacks?: SpeakCallbacks): Promise<void> => {
  const value = text.trim()
  if (!value) {
    callbacks?.onEnd?.()
    return
  }

  const response = await fetch('/api/tts/voicevox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: value }),
  })

  if (!response.ok) {
    throw new Error('VOICEVOX request failed')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  try {
    const audio = new Audio(url)
    audio.onplay = () => callbacks?.onStart?.()
    audio.onended = () => {
      URL.revokeObjectURL(url)
      callbacks?.onEnd?.()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      callbacks?.onEnd?.()
    }

    await audio.play()
  } catch {
    URL.revokeObjectURL(url)
    callbacks?.onEnd?.()
    throw new Error('VOICEVOX play failed')
  }
}

export const speakText = (
  text: string,
  provider: TtsProvider = 'browser',
  callbacks?: SpeakCallbacks,
): void => {
  if (provider === 'browser') {
    speakWithBrowser(text, callbacks)
    return
  }

  void speakWithVoicevox(text, callbacks).catch(() => {
    callbacks?.onFallback?.('VOICEVOXに失敗したためブラウザ音声へフォールバックしました。')
    speakWithBrowser(text, callbacks)
  })
}
