import type { AppStatus } from '../types/status'
import type { Face } from '../types/avatar'

type StatusBadgeProps = {
  status: AppStatus
}

const FACE_LABELS: Record<Face, string> = {
  normal: 'normal',
  joy: 'joy',
  sad: 'sad',
  angry: 'concerned',
  surprised: 'surprised',
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const tone =
    status.connectionStatus === 'misconfigured'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : status.connectionStatus === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-sky-200 bg-sky-50 text-sky-800'

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
        tts: {status.ttsProvider}
      </span>
    </div>
  )
}
