import type { Face } from '../types/avatar'
import { getAvatarImagePath } from '../utils/getAvatarImagePath'

const FACE_META: Record<Face, { label: string }> = {
  normal: { label: 'normal' },
  joy: { label: 'joy' },
  sad: { label: 'sad' },
  angry: { label: 'concerned' },
  surprised: { label: 'surprised' },
}

type AvatarDisplayProps = {
  face: Face
  isSpeaking: boolean
}

export const AvatarDisplay = ({ face, isSpeaking }: AvatarDisplayProps) => {
  const src = getAvatarImagePath(face)
  const current = FACE_META[face]

  return (
    <div className="rounded-2xl border border-[rgb(87_121_160)] bg-sky-50 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          face: {current.label}
        </span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            isSpeaking ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isSpeaking ? 'speaking' : 'silent'}
        </span>
      </div>

      <div className="mx-auto w-fit rounded-2xl bg-[oklch(93.2%_0.032_255.585)] p-2">
        <img
          src={src}
          alt={`avatar-${face}`}
          className={`mx-auto h-56 w-56 rounded-xl object-cover md:h-64 md:w-64 ${
            isSpeaking ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''
          }`}
          onError={(event) => {
            event.currentTarget.src = getAvatarImagePath('normal')
          }}
        />
      </div>
    </div>
  )
}
