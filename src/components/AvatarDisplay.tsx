import { useEffect, useRef, useState } from 'react'
import { FACE_LABELS, FACE_VALUES, type DisplayFace } from '../types/avatar'
import { getAvatarImagePath } from '../utils/getAvatarImagePath'

type AvatarDisplayProps = {
  face: DisplayFace
  isSpeaking: boolean
  compact?: boolean
}

const BLINK_INTERVAL_MS = 4500
const BLINK_DURATION_MS = 180
const FACE_FADE_MS = 500

// Fetch every face up front so the first switch to a face does not wait on
// the network. Keep references so the browser does not discard the images.
const preloadedImages: HTMLImageElement[] = []
const preloadAvatarImages = () => {
  if (preloadedImages.length > 0 || typeof Image === 'undefined') {
    return
  }
  const paths = [...FACE_VALUES, 'idle' as const].map((face) => getAvatarImagePath(face))
  paths.push(getAvatarImagePath('idle', true))
  paths.forEach((path) => {
    const image = new Image()
    image.src = path
    preloadedImages.push(image)
  })
}

export const AvatarDisplay = ({ face, isSpeaking, compact = false }: AvatarDisplayProps) => {
  // baseFace stays fully opaque underneath. A new face is layered on top and
  // only fades in once its image has loaded, so the avatar never goes blank
  // while the next image is still downloading.
  const [baseFace, setBaseFace] = useState(face)
  const [incomingLoaded, setIncomingLoaded] = useState(false)
  const [incomingVisible, setIncomingVisible] = useState(false)
  const [blinkActive, setBlinkActive] = useState(false)
  const incomingImageRef = useRef<HTMLImageElement>(null)
  const blinkTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const incomingFace = face !== baseFace ? face : undefined

  useEffect(preloadAvatarImages, [])

  useEffect(() => {
    setIncomingLoaded(false)
    setIncomingVisible(false)
    if (incomingFace && incomingImageRef.current?.complete && incomingImageRef.current.naturalWidth > 0) {
      setIncomingLoaded(true)
    }
  }, [incomingFace])

  useEffect(() => {
    if (!incomingFace || !incomingLoaded) {
      return
    }

    const animationFrame = requestAnimationFrame(() => setIncomingVisible(true))
    const settleTimer = setTimeout(() => {
      setBaseFace(incomingFace)
    }, FACE_FADE_MS)

    return () => {
      cancelAnimationFrame(animationFrame)
      clearTimeout(settleTimer)
    }
  }, [incomingFace, incomingLoaded])

  useEffect(() => {
    if (face !== 'idle') {
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
      }, BLINK_DURATION_MS)
    }, BLINK_INTERVAL_MS)

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
  }, [face])

  const imageClassName = `${
    compact ? 'h-36 w-36' : 'h-56 w-56 md:h-64 md:w-64'
  } rounded-xl object-cover transition-opacity duration-500 ${
    isSpeaking ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''
  }`

  const baseImagePath =
    baseFace === 'idle' && !incomingFace && blinkActive
      ? getAvatarImagePath(baseFace, true)
      : getAvatarImagePath(baseFace)

  return (
    <div className={compact ? 'shrink-0' : 'rounded-2xl border border-[rgb(87_121_160)] bg-sky-50 p-5 shadow-sm'}>
      <div className={`relative mx-auto w-fit rounded-2xl bg-[oklch(93.2%_0.032_255.585)] ${compact ? 'p-1' : 'p-2'}`}>
        <div className="relative">
          <img
            src={baseImagePath}
            alt={`avatar-${incomingFace ? face : baseFace}`}
            className={`relative ${imageClassName}`}
            onError={(event) => {
              event.currentTarget.src = getAvatarImagePath('idle')
            }}
          />
          {incomingFace ? (
            <img
              key={incomingFace}
              ref={incomingImageRef}
              src={getAvatarImagePath(incomingFace)}
              alt=""
              aria-hidden="true"
              className={`absolute left-0 top-0 ${imageClassName} ${incomingVisible ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIncomingLoaded(true)}
              onError={() => setBaseFace(incomingFace)}
            />
          ) : null}
        </div>
      </div>
      {!compact ? <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          face: {FACE_LABELS[face]}
        </span>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            isSpeaking ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isSpeaking ? 'speaking' : 'silent'}
        </span>
      </div> : null}
    </div>
  )
}
