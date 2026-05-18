import { AvatarDisplay } from './components/AvatarDisplay'
import { ChatInput } from './components/ChatInput'
import { ChatLog } from './components/ChatLog'
import { LoadingIndicator } from './components/LoadingIndicator'
import { StatusBadge } from './components/StatusBadge'
import { useChatController } from './features/chat/useChatController'

export const App = () => {
  const { entries, status, latestError, handleSend, handleNextFace, conversationId } = useChatController()

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">AI Avatar PoC</h1>
        {status.mode === 'dify' && conversationId ? (
          <p className="mt-1 text-xs text-slate-600">conversation_id: {conversationId}</p>
        ) : null}
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-3 lg:sticky lg:top-4">
          <StatusBadge status={status} />
          <AvatarDisplay face={status.currentFace} isSpeaking={status.isSpeaking} />
          {status.mode === 'mock' ? (
            <button
              type="button"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status.isLoading}
              onClick={() => void handleNextFace()}
            >
              次の表情
            </button>
          ) : null}
        </aside>

        <section className="min-w-0">
          <ChatLog entries={entries} />
          <div className="mt-2 h-5">
            <LoadingIndicator visible={status.isLoading} mode={status.mode} />
          </div>
          {latestError ? <p className="mt-1 text-sm text-red-700">{latestError}</p> : null}
          <ChatInput disabled={status.isLoading} onSend={handleSend} />
        </section>
      </section>
    </main>
  )
}
