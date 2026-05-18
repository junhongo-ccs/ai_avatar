export type RecognitionOptions = {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (message: string) => void
  onResult?: (transcript: string) => void
}

type RecognitionEventLike = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>
}

type RecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: RecognitionEventLike) => void) | null
  start: () => void
  stop: () => void
}

type RecognitionConstructor = new () => RecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
}

const getRecognitionConstructor = (): RecognitionConstructor | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export const isSpeechRecognitionSupported = (): boolean => getRecognitionConstructor() !== null

export type SpeechRecognitionController = {
  isSupported: boolean
  start: () => void
  stop: () => void
}

export const createSpeechRecognitionController = (
  options: RecognitionOptions = {},
): SpeechRecognitionController => {
  const Constructor = getRecognitionConstructor()
  if (!Constructor) {
    return {
      isSupported: false,
      start: () => {},
      stop: () => {},
    }
  }

  const recognition = new Constructor()
  recognition.lang = options.lang ?? 'ja-JP'
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? false

  recognition.onstart = () => options.onStart?.()
  recognition.onend = () => options.onEnd?.()
  recognition.onerror = (event) => options.onError?.(event.error ?? 'speech recognition error')
  recognition.onresult = (event) => {
    const firstResult = event.results?.[0]?.[0]
    const transcript = firstResult?.transcript?.trim()
    if (transcript) {
      options.onResult?.(transcript)
    }
  }

  return {
    isSupported: true,
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  }
}
