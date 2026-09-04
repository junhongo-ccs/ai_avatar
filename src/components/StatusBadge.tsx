import type { AppStatus } from '../types/status'
import { FACE_LABELS } from '../types/avatar'

type StatusBadgeProps = {
  status: AppStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const tone =
    status.connectionStatus === 'misconfigured'
      ? 'border-[rgb(87_121_160)] bg-amber-50 text-amber-800'
      : status.connectionStatus === 'error'
        ? 'border-[rgb(87_121_160)] bg-rose-50 text-rose-800'
        : 'border-[rgb(87_121_160)] bg-sky-50 text-sky-800'

  return (
    <div
      className={`flex w-full flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${tone}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      <span className="font-semibold">mode: {status.mode}</span>
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        status: {status.connectionStatus}
      </span>
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        face: {FACE_LABELS[status.currentFace]}
      </span>
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        speaking: {status.isSpeaking ? 'on' : 'off'}
      </span>
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        audio: {status.audioEnabled ? 'on' : 'off'}
      </span>
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        tts: {status.ttsProvider}
      </span>
    </div>
  )
}
