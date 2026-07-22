type AudioToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

export const AudioToggle = ({ checked, onChange }: AudioToggleProps) => {
  return (
    <label className="inline-flex items-center gap-3 rounded-full border border-slate-300 bg-white px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-slate-700">応答音声</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="応答音声のオンオフ"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          checked ? 'bg-cyan-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span
        className={`inline-flex w-7 justify-center text-xs font-semibold ${
          checked ? 'text-cyan-700' : 'text-slate-500'
        }`}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
    </label>
  )
}
