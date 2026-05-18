import type { Face } from '../types/avatar'
import { getAvatarImagePath } from '../utils/getAvatarImagePath'

type AvatarDisplayProps = {
  face: Face
}

export const AvatarDisplay = ({ face }: AvatarDisplayProps) => {
  const src = getAvatarImagePath(face)

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        Current face: {face}
      </div>
      <img
        src={src}
        alt={`avatar-${face}`}
        className="mx-auto h-56 w-56 rounded-xl border border-slate-200 object-cover md:h-64 md:w-64"
        onError={(event) => {
          event.currentTarget.src = getAvatarImagePath('normal')
        }}
      />
    </div>
  )
}
