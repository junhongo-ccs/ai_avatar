import { useEffect, useState } from 'react'

const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

const getIsMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches

export const useIsMobileViewport = () => {
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches)

    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  return isMobileViewport
}
