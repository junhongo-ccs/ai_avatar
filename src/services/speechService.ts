import type { TtsProvider } from '../types/config'

type SpeakCallbacks = {
  onStart?: () => void
  onEnd?: () => void
  onFallback?: (message: string) => void
}

let activeAudio: HTMLAudioElement | null = null

// Chrome/Firefox are known to sometimes drop SpeechSynthesisUtterance's `end`
// event (backgrounded tab, long utterance, interrupted playback), which would
// otherwise leave the avatar's face stuck indefinitely. This estimates a
// generous upper bound on speech duration and forces onEnd if the real event
// never arrives. It is intentionally conservative: normal completion is still
// driven by the real `end` event, while this is only the last-resort safeguard.
const BROWSER_TTS_MS_PER_CHAR = 300
const BROWSER_TTS_MIN_FALLBACK_MS = 8000
const BROWSER_TTS_MAX_FALLBACK_MS = 90000

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }

  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
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

  let ended = false
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined
  const finish = () => {
    if (ended) {
      return
    }
    ended = true
    if (fallbackTimer) {
      clearTimeout(fallbackTimer)
    }
    callbacks?.onEnd?.()
  }

  const finishFromFallback = () => {
    // Some browsers lose the end event while the utterance keeps playing.
    // Never cancel here: this timer only prevents the avatar state from
    // remaining stuck, and must not truncate the user's audio response.
    finish()
  }

  const estimatedMs = Math.min(
    BROWSER_TTS_MAX_FALLBACK_MS,
    Math.max(BROWSER_TTS_MIN_FALLBACK_MS, value.length * BROWSER_TTS_MS_PER_CHAR),
  )
  fallbackTimer = setTimeout(finishFromFallback, estimatedMs)

  const utterance = new SpeechSynthesisUtterance(value)
  utterance.lang = 'ja-JP'
  utterance.onstart = () => callbacks?.onStart?.()
  utterance.onend = finish
  utterance.onerror = finish

  try {
    stopSpeaking()
    window.speechSynthesis.speak(utterance)
  } catch {
    finish()
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
    stopSpeaking()
    const audio = new Audio(url)
    activeAudio = audio
    audio.onplay = () => callbacks?.onStart?.()
    audio.onended = () => {
      activeAudio = null
      URL.revokeObjectURL(url)
      callbacks?.onEnd?.()
    }
    audio.onerror = () => {
      activeAudio = null
      URL.revokeObjectURL(url)
      callbacks?.onEnd?.()
    }

    await audio.play()
  } catch {
    activeAudio = null
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
