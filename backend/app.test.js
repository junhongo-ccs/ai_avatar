import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.js'

const makeJsonResponse = (body, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
})

const makeBinaryResponse = (buffer, ok = true, status = 200) => ({
  ok,
  status,
  arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
})

describe('VOICEVOX backend route', () => {
  it('requires basic auth when configured', async () => {
    const app = createApp({
      fetchImpl: vi.fn(),
      basicAuthUser: 'demo',
      basicAuthPassword: 'secret',
    })

    const response = await request(app).post('/api/tts/voicevox').send({ text: 'hello' })
    expect(response.status).toBe(401)
    expect(response.headers['www-authenticate']).toContain('Basic')
  })

  it('accepts requests with valid basic auth', async () => {
    const wav = Buffer.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69])
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse({ speedScale: 1.0 }))
      .mockResolvedValueOnce(makeBinaryResponse(wav))

    const app = createApp({
      fetchImpl: fetchMock,
      basicAuthUser: 'demo',
      basicAuthPassword: 'secret',
    })

    const response = await request(app)
      .post('/api/tts/voicevox')
      .auth('demo', 'secret')
      .send({ text: 'hello', speaker: 1 })

    expect(response.status).toBe(200)
  })

  it('returns 400 when text is missing', async () => {
    const app = createApp({ fetchImpl: vi.fn() })
    const response = await request(app).post('/api/tts/voicevox').send({ text: '   ' })
    expect(response.status).toBe(400)
  })

  it('returns 5xx when VOICEVOX audio_query fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse({}, false, 500))
    const app = createApp({ fetchImpl: fetchMock })

    const response = await request(app).post('/api/tts/voicevox').send({ text: 'hello', speaker: 1 })
    expect(response.status).toBe(502)
  })

  it('returns audio/wav on success', async () => {
    const wav = Buffer.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69])
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse({ speedScale: 1.0 }))
      .mockResolvedValueOnce(makeBinaryResponse(wav))

    const app = createApp({ fetchImpl: fetchMock })
    const response = await request(app).post('/api/tts/voicevox').send({ text: 'hello', speaker: 1 })

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('audio/wav')
    expect(response.body.length).toBeGreaterThan(0)
  })
})
