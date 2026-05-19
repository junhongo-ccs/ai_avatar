type LoadingIndicatorProps = {
  visible: boolean
}

export const LoadingIndicator = ({ visible }: LoadingIndicatorProps) => {
  if (!visible) {
    return null
  }

  return <p className="text-sm font-medium text-slate-700">Difyへ問い合わせ中です...</p>
}
