import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createSpeechRecognitionController,
  isSpeechRecognitionSupported,
} from '../services/speechRecognitionService'

type ChatInputProps = {
  disabled?: boolean
  onSend: (text: string) => Promise<void>
}

export const ChatInput = ({ disabled = false, onSend }: ChatInputProps) => {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognitionError, setRecognitionError] = useState<string | undefined>(undefined)

  const speechSupported = useMemo(() => isSpeechRecognitionSupported(), [])

  const recognition = useMemo(
    () =>
      createSpeechRecognitionController({
        lang: 'ja-JP',
        onStart: () => {
          setIsListening(true)
          setRecognitionError(undefined)
        },
        onEnd: () => setIsListening(false),
        onError: () => {
          setIsListening(false)
          setRecognitionError('音声認識に失敗しました。もう一度お試しください。')
        },
        onResult: (transcript) => {
          setText(transcript)
          setRecognitionError(undefined)
        },
      }),
    [],
  )

  useEffect(() => {
    return () => {
      recognition.stop()
    }
  }, [recognition])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || disabled) {
      return
    }

    setText('')
    await onSend(value)
  }

  const toggleListening = () => {
    if (!speechSupported || disabled) {
      return
    }

    if (isListening) {
      recognition.stop()
      return
    }

    recognition.start()
  }

  return (
    <div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <input
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="メッセージを入力"
          disabled={disabled}
        />
        <button
          className="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          type="button"
          disabled={!speechSupported || disabled}
          onClick={toggleListening}
        >
          {isListening ? 'マイク入力停止' : 'マイク入力開始'}
        </button>
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
          type="submit"
          disabled={disabled || text.trim().length === 0}
        >
          送信
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-600">
        音声入力: {speechSupported ? (isListening ? '認識中...' : '待機中') : 'このブラウザでは非対応'}
      </p>
      {recognitionError ? <p className="mt-1 text-xs text-rose-700">{recognitionError}</p> : null}
    </div>
  )
}
