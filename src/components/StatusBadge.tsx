import type { AppStatus } from '../types/status'

type StatusBadgeProps = {
  status: AppStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const tone =
    status.connectionStatus === 'misconfigured'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : status.connectionStatus === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : status.connectionStatus === 'connected'
        ? 'border-sky-200 bg-sky-50 text-sky-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      mode: {status.mode}
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        status: {status.connectionStatus}
      </span>
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        face: {status.currentFace}
      </span>
    </div>
  )
}
