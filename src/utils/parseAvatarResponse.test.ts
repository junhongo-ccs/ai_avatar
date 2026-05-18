import { describe, expect, it } from 'vitest'
import { parseAvatarResponse } from './parseAvatarResponse'

describe('parseAvatarResponse', () => {
  it('extracts face and text from JSON string', () => {
    const result = parseAvatarResponse('{"face":"joy","text":"こんにちは"}', { source: 'dify' })
    expect(result.face).toBe('joy')
    expect(result.text).toBe('こんにちは')
    expect(result.source).toBe('dify')
  })

  it('parses face-tag text', () => {
    const result = parseAvatarResponse('[face:joy]こんにちは', { source: 'dify' })
    expect(result.face).toBe('joy')
    expect(result.text).toBe('こんにちは')
  })

  it('falls back face and text safely when invalid', () => {
    const result = parseAvatarResponse('{"face":"unknown","text":""}', {
      source: 'dify',
      fallbackText: 'safe text',
    })
    expect(result.face).toBe('normal')
    expect(result.text).toBe('safe text')
  })
})
