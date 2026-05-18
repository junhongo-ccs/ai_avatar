import { useState, type FormEvent } from 'react'

type ChatInputProps = {
  disabled?: boolean
  onSend: (text: string) => Promise<void>
}

export const ChatInput = ({ disabled = false, onSend }: ChatInputProps) => {
  const [text, setText] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = text.trim()
    if (!value || disabled) {
      return
    }

    setText('')
    await onSend(value)
  }

  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <input
        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="メッセージを入力"
        disabled={disabled}
      />
      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-500"
        type="submit"
        disabled={disabled || text.trim().length === 0}
      >
        送信
      </button>
    </form>
  )
}
