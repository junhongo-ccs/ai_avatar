import { useEffect, useRef, useState } from 'react'
import { FACE_LABELS, type DisplayFace } from '../types/avatar'
import { getAvatarImagePath } from '../utils/getAvatarImagePath'

type AvatarDisplayProps = {
  face: DisplayFace
  isSpeaking: boolean
  compact?: boolean
}

export const AvatarDisplay = ({ face, isSpeaking, compact = false }: AvatarDisplayProps) => {
  const [visibleFace, setVisibleFace] = useState(face)
  const [previousFace, setPreviousFace] = useState<DisplayFace | undefined>(undefined)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [blinkActive, setBlinkActive] = useState(false)
  const visibleFaceRef = useRef(face)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const blinkTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

  useEffect(() => {
    if (face !== 'idle' || isSpeaking) {
      setBlinkActive(false)
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current)
        blinkTimerRef.current = undefined
      }
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current)
        blinkTimeoutRef.current = undefined
      }
      return
    }

    blinkTimerRef.current = setInterval(() => {
      setBlinkActive(true)
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current)
      }
      blinkTimeoutRef.current = setTimeout(() => {
        setBlinkActive(false)
      }, 130)
    }, 6000)

    return () => {
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current)
        blinkTimerRef.current = undefined
      }
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current)
        blinkTimeoutRef.current = undefined
      }
    }
  }, [face, isSpeaking])

  const imageClassName = `${
    compact ? 'h-36 w-36' : 'h-56 w-56 md:h-64 md:w-64'
  } rounded-xl object-cover transition-opacity duration-500 ${
    isSpeaking ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''
  }`

  const currentImagePath =
    face === 'idle' && !isSpeaking && blinkActive ? getAvatarImagePath(face, true) : getAvatarImagePath(face)

  return (
    <div className={compact ? 'shrink-0' : 'rounded-2xl border border-[rgb(87_121_160)] bg-sky-50 p-5 shadow-sm'}>
      {!compact ? <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          face: {FACE_LABELS[visibleFace]}
        </span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            isSpeaking ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isSpeaking ? 'speaking' : 'silent'}
        </span>
      </div> : null}

      <div className={`relative mx-auto w-fit rounded-2xl bg-[oklch(93.2%_0.032_255.585)] ${compact ? 'p-1' : 'p-2'}`}>
        {previousFace ? (
          <img
            src={getAvatarImagePath(previousFace)}
            alt=""
            aria-hidden="true"
            className={`absolute ${imageClassName} ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          />
        ) : null}
        <img
          src={currentImagePath}
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
