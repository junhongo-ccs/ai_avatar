import type { Face } from '../types/avatar'
import { getAvatarImagePath } from '../utils/getAvatarImagePath'

const FACE_META: Record<Face, { label: string; description: string }> = {
  normal: { label: '通常', description: '落ち着いた状態で会話します。' },
  joy: { label: 'よろこび', description: '前向きで明るい返答をしています。' },
  sad: { label: 'しょんぼり', description: '寄り添うトーンで返答しています。' },
  angry: { label: 'いかり', description: '強い感情を表現した返答です。' },
  surprised: { label: 'おどろき', description: '驚きを含む反応をしています。' },
}

const FACE_ORDER: Face[] = ['normal', 'joy', 'sad', 'angry', 'surprised']

type AvatarDisplayProps = {
  face: Face
  isSpeaking: boolean
}

export const AvatarDisplay = ({ face, isSpeaking }: AvatarDisplayProps) => {
  const src = getAvatarImagePath(face)
  const current = FACE_META[face]

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          face: {face} ({current.label})
        </span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            isSpeaking ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isSpeaking ? 'speaking' : 'silent'}
        </span>
      </div>

      <div className={`mx-auto w-fit rounded-2xl p-2 ${isSpeaking ? 'bg-cyan-50' : 'bg-slate-50'}`}>
        <img
          src={src}
          alt={`avatar-${face}`}
          className={`mx-auto h-56 w-56 rounded-xl border border-slate-200 object-cover md:h-64 md:w-64 ${
            isSpeaking ? 'animate-pulse' : ''
          }`}
          onError={(event) => {
            event.currentTarget.src = getAvatarImagePath('normal')
          }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-600">{current.description}</p>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Face Preview</p>
        <ul className="grid grid-cols-5 gap-2">
          {FACE_ORDER.map((previewFace) => (
            <li key={previewFace} className="text-center">
              <div
                className={`overflow-hidden rounded-lg border p-1 ${
                  previewFace === face ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200'
                }`}
              >
                <img
                  src={getAvatarImagePath(previewFace)}
                  alt={`preview-${previewFace}`}
                  className="h-12 w-full rounded object-cover"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-600">{previewFace}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
