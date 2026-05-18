import { describe, expect, it } from 'vitest'
import { adaptDifyResponse } from './difyResponseAdapter'

describe('adaptDifyResponse', () => {
  it('normalizes Dify raw JSON answer to AvatarResponse', () => {
    const raw = {
      conversation_id: 'conv-1',
      answer: '{"face":"joy","text":"hello"}',
      internal: { ignored: true },
    }

    const adapted = adaptDifyResponse(raw)
    expect(adapted.conversationId).toBe('conv-1')
    expect(adapted.avatar).toEqual({
      face: 'joy',
      text: 'hello',
      raw: '{"face":"joy","text":"hello"}',
      source: 'dify',
    })
    expect((adapted.avatar as Record<string, unknown>).answer).toBeUndefined()
  })

  it('supports face-tag answers and safe fallback text', () => {
    const tagged = adaptDifyResponse({ answer: '[face:joy]こんにちは' })
    expect(tagged.avatar.face).toBe('joy')
    expect(tagged.avatar.text).toBe('こんにちは')

    const emptyText = adaptDifyResponse({ answer: '{"face":"joy","text":"   "}' })
    expect(emptyText.avatar.text).toBe('応答を解釈できませんでした。もう一度お試しください。')
  })

  it('falls back unknown face to normal', () => {
    const adapted = adaptDifyResponse({ answer: '{"face":"mystery","text":"ok"}' })
    expect(adapted.avatar.face).toBe('normal')
  })
})
