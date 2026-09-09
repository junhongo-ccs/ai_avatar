import { AudioToggle } from './components/AudioToggle'
import { AvatarDisplay } from './components/AvatarDisplay'
import { ChatInput } from './components/ChatInput'
import { ChatLog } from './components/ChatLog'
import { LoadingIndicator } from './components/LoadingIndicator'
import { StatusBadge } from './components/StatusBadge'
import { useChatController } from './features/chat/useChatController'
import { useIsMobileViewport } from './hooks/useIsMobileViewport'
import communicationIcon from './assets/icon.svg'

export const App = () => {
  const isMobileViewport = useIsMobileViewport()
  const { entries, status, latestError, handleSend, setAudioEnabled } =
    useChatController({ audioOutputAllowed: !isMobileViewport })

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col overflow-hidden px-3 py-3 md:min-h-dvh md:h-auto md:px-6 md:py-6 md:overflow-visible lg:h-dvh lg:overflow-hidden">
      <header className="mb-3 flex h-[20dvh] shrink-0 items-center justify-between gap-[24px] md:mb-4 md:h-auto md:flex-row md:items-start">
        <div className="md:hidden">
          <AvatarDisplay face={status.currentFace} isSpeaking={status.isSpeaking} compact />
        </div>
        <div className="min-w-0 flex-1 md:flex-none">
          <h1 className="flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
            <img
              src={communicationIcon}
              alt=""
              aria-hidden="true"
              className="hidden h-8 w-8 shrink-0 translate-y-0.5 md:block md:h-12 md:w-12"
            />
            <span className="min-w-0 leading-tight">
              <span className="block md:inline">CCS人事センパイに</span>
              <span className="block md:inline">聞いてみよう</span>
            </span>
          </h1>
        </div>
        <div className="hidden md:block">
          <AudioToggle checked={status.audioEnabled} onChange={setAudioEnabled} />
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col gap-3 md:grid md:grid-cols-1 md:gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-stretch lg:overflow-hidden">
        <aside className="hidden space-y-3 md:block lg:sticky lg:top-4 lg:min-h-0 lg:self-start lg:overflow-y-auto lg:pr-1">
          <StatusBadge status={status} />
          <AvatarDisplay face={status.currentFace} isSpeaking={status.isSpeaking} />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-[rgb(87_121_160)] bg-white p-3 sm:p-4 md:block md:flex-none lg:flex lg:h-full lg:flex-1 lg:flex-col">
          <ChatLog entries={entries} />
          <div className="mt-2 h-5 shrink-0">
            <LoadingIndicator visible={status.isLoading} />
          </div>
          {latestError ? <p className="mt-1 text-sm text-red-700">{latestError}</p> : null}
          <div className="bottom-0 z-10 -mx-3 mt-2 shrink-0 bg-white/95 px-3 pb-2 pt-2 backdrop-blur sm:-mx-4 sm:px-4 md:sticky">
            <ChatInput
              disabled={status.isLoading}
              speechInputEnabled={!isMobileViewport}
              onSend={handleSend}
            />
          </div>
        </section>
      </section>
    </main>
  )
}
