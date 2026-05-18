type LoadingIndicatorProps = {
  visible: boolean
}

export const LoadingIndicator = ({ visible }: LoadingIndicatorProps) => {
  if (!visible) {
    return null
  }

  return <p className="text-sm text-slate-600">応答を生成中です...</p>
}
