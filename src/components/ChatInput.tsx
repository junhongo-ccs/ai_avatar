import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createSpeechRecognitionController,
  isSpeechRecognitionSupported,
} from '../services/speechRecognitionService'

type ChatInputProps = {
  disabled?: boolean
  speechInputEnabled?: boolean
  onSend: (text: string) => Promise<void>
}

export const ChatInput = ({
  disabled = false,
  speechInputEnabled = true,
  onSend,
}: ChatInputProps) => {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognitionError, setRecognitionError] = useState<string | undefined>(undefined)

  const speechSupported = useMemo(
    () => speechInputEnabled && isSpeechRecognitionSupported(),
    [speechInputEnabled],
  )

  const recognition = useMemo(
    () => {
      if (!speechInputEnabled) {
        return null
      }

      return createSpeechRecognitionController({
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
      })
    },
    [speechInputEnabled],
  )

  useEffect(() => {
    return () => {
      recognition?.stop()
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
    if (!speechSupported || disabled || !recognition) {
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
      <form onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          className="min-h-11 w-full rounded-xl border border-[rgb(87_121_160)] bg-white px-3 py-2 text-base focus:border-[rgb(0_83_203)] focus:outline-none focus:ring-2 focus:ring-[rgb(0_83_203)]"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="メッセージを入力"
          disabled={disabled}
        />
        {speechInputEnabled ? (
          <button
            className="min-h-11 whitespace-nowrap rounded-xl border border-[rgb(87_121_160)] bg-white px-3 py-2 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            type="button"
            disabled={!speechSupported || disabled}
            onClick={toggleListening}
          >
            {isListening ? 'マイク入力停止' : 'マイク入力開始'}
          </button>
        ) : null}
        <button
          className="min-h-11 rounded-xl bg-[rgb(0_83_203)] px-4 py-2 text-base text-white disabled:cursor-not-allowed disabled:bg-slate-500"
          type="submit"
          disabled={disabled || text.trim().length === 0}
        >
          送信
        </button>
      </form>
      {speechInputEnabled ? (
        <p className="mt-2 text-xs text-slate-600">
          音声入力: {speechSupported ? (isListening ? '認識中...' : '待機中') : 'このブラウザでは非対応'}
        </p>
      ) : null}
      {speechInputEnabled && recognitionError ? (
        <p className="mt-1 text-xs text-rose-700">{recognitionError}</p>
      ) : null}
    </div>
  )
}
