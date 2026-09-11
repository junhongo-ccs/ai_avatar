import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AvatarDisplay } from '../components/AvatarDisplay'
import { ChatInput } from '../components/ChatInput'
import { ChatLog } from '../components/ChatLog'
import { LoadingIndicator } from '../components/LoadingIndicator'
import type { DisplayFace } from '../types/avatar'
import type { ChatEntry } from '../types/chat'

const initialEntries: ChatEntry[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'こんにちは。会社のことや働き方、選考について、気になることがあれば聞いてください。',
    face: 'joy',
    timestamp: 1,
  },
  {
    id: 'question',
    role: 'user',
    text: '在宅勤務について教えてください。',
    timestamp: 2,
  },
  {
    id: 'answer',
    role: 'assistant',
    text: 'ぜひ、イベント会場の社員に直接聞いてみてください！',
    face: 'normal',
    timestamp: 3,
  },
]

const MobileChatPreview = () => {
  const [entries, setEntries] = useState(initialEntries)
  const [face, setFace] = useState<DisplayFace>('normal')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (text: string) => {
    const timestamp = Date.now()
    setIsLoading(true)
    setEntries((current) => [
      ...current,
      { id: `user-${timestamp}`, role: 'user', text, timestamp },
    ])
    setFace('joy')

    window.setTimeout(() => {
      setEntries((current) => [
        ...current,
        {
          id: `assistant-${timestamp}`,
          role: 'assistant',
          text: 'Storybook上のプレビューです。実際の会場では、社員にも直接聞いてみてください！',
          face: 'joy',
          timestamp: timestamp + 1,
        },
      ])
      setIsLoading(false)
      setFace('joy')
    }, 900)
  }

  return (
    <main className="mx-auto flex h-[844px] w-[390px] max-w-full flex-col overflow-hidden bg-[rgb(0_91_150)] px-3 py-3 font-sans">
      <header className="mb-3 flex h-[20%] shrink-0 items-center justify-between gap-[24px] rounded-2xl bg-[rgb(0_91_150)] px-3 py-2">
        <AvatarDisplay face={face} isSpeaking={false} compact />
        <h1 className="flex min-w-0 flex-1 items-center gap-2 text-xl font-bold text-white">
          <div className="min-w-0">
            <span className="mb-4 block leading-tight">
              <span className="block">CCS人事センパイに</span>
              <span className="block">聞いてみよう</span>
            </span>
            <p className="text-xs font-normal leading-tight text-white">
              ＊チャット内容はサービス改善のために記録されます。
              個人情報や第三者の個人情報は入力しないでください。
            </p>
          </div>
        </h1>
      </header>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[rgb(87_121_160)] bg-[rgb(232_242_251)] p-3">
        <ChatLog entries={entries} />
        <div className="mt-2 shrink-0 border-t border-slate-100 pt-2">
          <LoadingIndicator visible={isLoading} />
          <ChatInput speechInputEnabled={false} onSend={handleSend} />
        </div>
      </section>
    </main>
  )
}

const meta = {
  title: 'Mobile UI/Chat preview',
  component: MobileChatPreview,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MobileChatPreview>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
