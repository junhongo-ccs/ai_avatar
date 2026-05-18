export const speakText = (text: string): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  const value = text.trim()
  if (!value) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(value)
  utterance.lang = 'ja-JP'

  try {
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch {
    // no-op to keep UI responsive in unsupported environments
  }
}
