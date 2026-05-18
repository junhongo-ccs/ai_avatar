import { useEffect, useRef } from 'react'
import type { ChatEntry } from '../types/chat'

type ChatLogProps = {
  entries: ChatEntry[]
}

export const ChatLog = ({ entries }: ChatLogProps) => {
  const endRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries])

  return (
    <div className="h-[30rem] overflow-y-auto rounded-2xl border border-slate-300 bg-white p-4">
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${entry.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <p className="mb-1 text-xs text-slate-500">{entry.role}</p>
              <p
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  entry.role === 'user'
                    ? 'rounded-br-md bg-sky-600 text-white'
                    : entry.role === 'assistant'
                      ? 'rounded-bl-md bg-slate-100 text-slate-900'
                      : 'bg-amber-50 text-amber-900'
                }`}
              >
                {entry.text}
              </p>
            </div>
          </li>
        ))}
        <li ref={endRef} />
      </ul>
    </div>
  )
}
