import { AvatarDisplay } from './components/AvatarDisplay'
import { ChatInput } from './components/ChatInput'
import { ChatLog } from './components/ChatLog'
import { LoadingIndicator } from './components/LoadingIndicator'
import { StatusBadge } from './components/StatusBadge'
import { useChatController } from './features/chat/useChatController'

export const App = () => {
  const { entries, status, latestError, handleSend, handleNextFace } = useChatController()

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">AI Avatar PoC - P1 Mock MVP</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <div className="space-y-3">
          <StatusBadge status={status} />
          <AvatarDisplay face={status.currentFace} />
          <button
            type="button"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={status.isLoading}
            onClick={() => void handleNextFace()}
          >
            次の表情
          </button>
        </div>

        <div>
          <ChatLog entries={entries} />
          <div className="mt-2 h-5">
            <LoadingIndicator visible={status.isLoading} />
          </div>
          {latestError ? <p className="mt-1 text-sm text-red-700">{latestError}</p> : null}
          <ChatInput disabled={status.isLoading} onSend={handleSend} />
        </div>
      </section>
    </main>
  )
}
