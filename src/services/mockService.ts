import type { AvatarResponse } from '../types/avatar'
import { parseAvatarResponse } from '../utils/parseAvatarResponse'

const samples = [
  '[face:normal] 通常モードで応答しています。',
  '[face:joy] こんにちは。今日はいい日ですね。',
  '[face:sad] うまくいかなくて少し落ち込んでいます。',
  '{"face":"angry","text":"それは困ります。状況を確認しましょう。"}',
  '{"face":"surprised","text":"えっ、本当ですか？"}',
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
let sampleIndex = 0

export const sendMessage = async (message: string): Promise<AvatarResponse> => {
  await sleep(400)
  const picked = samples[sampleIndex]
  sampleIndex = (sampleIndex + 1) % samples.length
  const payload = message.trim().length > 0 ? picked : '[face:normal] 入力を確認できませんでした。'
  return parseAvatarResponse(payload)
}

export const sendNextFaceSample = async (): Promise<AvatarResponse> => {
  await sleep(250)
  const picked = samples[sampleIndex]
  sampleIndex = (sampleIndex + 1) % samples.length
  return parseAvatarResponse(picked)
}
