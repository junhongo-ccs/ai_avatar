import { describe, expect, it } from 'vitest'
import { extractFaceTag } from './extractFaceTag'

describe('extractFaceTag', () => {
  it('parses valid face tag and text', () => {
    expect(extractFaceTag('[face:joy] こんにちは')).toEqual({ face: 'joy', text: 'こんにちは' })
  })

  it('falls back to normal for unknown face', () => {
    expect(extractFaceTag('[face:unknown] hello')).toEqual({ face: 'normal', text: 'hello' })
  })

  it('returns normal when no tag exists', () => {
    expect(extractFaceTag('plain text')).toEqual({ face: 'normal', text: 'plain text' })
  })
})
