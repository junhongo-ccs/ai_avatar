import type { AppStatus } from '../types/status'

type StatusBadgeProps = {
  status: AppStatus
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
      <span className="h-2 w-2 rounded-full bg-emerald-600" />
      mode: {status.mode}
      <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
        face: {status.currentFace}
      </span>
    </div>
  )
}
