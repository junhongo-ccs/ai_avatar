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
    <div className="h-[44vh] min-h-[16rem] max-h-[34rem] overflow-y-auto rounded-2xl bg-[oklch(93.2%_0.032_255.585)] p-4 lg:h-auto lg:min-h-0 lg:max-h-none lg:flex-1">
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] ${entry.role === 'user' ? 'items-end' : 'items-start'} flex flex-col sm:max-w-[85%]`}>
              <p className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <span>{entry.role === 'user' ? 'あなた' : 'CCS人事'}</span>
              </p>
              <p
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  entry.role === 'user'
                    ? 'rounded-br-none bg-[rgb(174_225_254)] text-black'
                    : entry.role === 'assistant'
                      ? 'rounded-bl-none bg-sky-600 text-white'
                      : 'rounded-bl-none bg-sky-600 text-white'
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
