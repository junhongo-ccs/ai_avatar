type LoadingIndicatorProps = {
  visible: boolean
  mode?: 'mock' | 'dify'
}

export const LoadingIndicator = ({ visible, mode = 'mock' }: LoadingIndicatorProps) => {
  if (!visible) {
    return null
  }

  return (
    <p className="text-sm font-medium text-slate-700">
      {mode === 'dify' ? 'Difyへ問い合わせ中です...' : 'モック応答を生成中です...'}
    </p>
  )
}
