import { AvatarDisplay } from './components/AvatarDisplay'
import { ChatInput } from './components/ChatInput'
import { ChatLog } from './components/ChatLog'
import { LoadingIndicator } from './components/LoadingIndicator'
import { StatusBadge } from './components/StatusBadge'
import { useChatController } from './features/chat/useChatController'

export const App = () => {
  const { entries, status, latestError, handleSend, conversationId } = useChatController()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 md:py-6 lg:h-dvh lg:overflow-hidden">
      <header className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">AI Avatar | Recruitment </h1>
        {conversationId ? (
          <p className="mt-1 text-xs text-slate-600">conversation_id: {conversationId}</p>
        ) : null}
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-stretch lg:overflow-hidden">
        <aside className="space-y-3 lg:sticky lg:top-4 lg:min-h-0 lg:self-start lg:overflow-y-auto lg:pr-1">
          <StatusBadge status={status} />
          <AvatarDisplay face={status.currentFace} isSpeaking={status.isSpeaking} />
        </aside>

        <section className="min-h-0 min-w-0 rounded-2xl border border-slate-300 bg-white p-3 sm:p-4 lg:flex lg:h-full lg:flex-col">
          <ChatLog entries={entries} />
          <div className="mt-2 h-5 shrink-0">
            <LoadingIndicator visible={status.isLoading} />
          </div>
          {latestError ? <p className="mt-1 text-sm text-red-700">{latestError}</p> : null}
          <div className="sticky bottom-0 z-10 -mx-3 mt-2 shrink-0 border-t border-slate-200 bg-white/95 px-3 pb-2 pt-2 backdrop-blur sm:-mx-4 sm:px-4">
            <ChatInput disabled={status.isLoading} onSend={handleSend} />
          </div>
        </section>
      </section>
    </main>
  )
}
