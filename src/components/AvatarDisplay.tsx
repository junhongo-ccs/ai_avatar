import { useEffect, useRef, useState } from 'react'
import type { DisplayFace } from '../types/avatar'
import { getAvatarImagePath } from '../utils/getAvatarImagePath'

const FACE_META: Record<DisplayFace, { label: string }> = {
  idle: { label: 'idle' },
  normal: { label: 'normal' },
  joy: { label: 'joy' },
  sad: { label: 'sad' },
  angry: { label: 'concerned' },
  surprised: { label: 'surprised' },
}

type AvatarDisplayProps = {
  face: DisplayFace
  isSpeaking: boolean
}

export const AvatarDisplay = ({ face, isSpeaking }: AvatarDisplayProps) => {
  const [visibleFace, setVisibleFace] = useState(face)
  const [previousFace, setPreviousFace] = useState<DisplayFace | undefined>(undefined)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const visibleFaceRef = useRef(face)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const current = FACE_META[visibleFace]

  useEffect(() => {
    if (face === visibleFaceRef.current) {
      return
    }

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
    }

    setPreviousFace(visibleFaceRef.current)
    visibleFaceRef.current = face
    setVisibleFace(face)
    setIsTransitioning(false)

    const animationFrame = requestAnimationFrame(() => setIsTransitioning(true))
    transitionTimerRef.current = setTimeout(() => {
      setPreviousFace(undefined)
      setIsTransitioning(false)
    }, 500)

    return () => {
      cancelAnimationFrame(animationFrame)
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
    }
  }, [face])

  const imageClassName = `h-56 w-56 rounded-xl object-cover transition-opacity duration-500 md:h-64 md:w-64 ${
    isSpeaking ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''
  }`


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

      <div className="relative mx-auto w-fit rounded-2xl bg-[oklch(93.2%_0.032_255.585)] p-2">
        {previousFace ? (
          <img
            src={getAvatarImagePath(previousFace)}
            alt=""
            aria-hidden="true"
            className={`absolute ${imageClassName} ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          />
        ) : null}
        <img
          src={getAvatarImagePath(visibleFace)}
          alt={`avatar-${visibleFace}`}
          className={`relative ${imageClassName} ${
            previousFace && !isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          onError={(event) => {
            event.currentTarget.src = getAvatarImagePath('idle')
          }}
        />
      </div>
    </div>
  )
}
