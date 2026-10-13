import express from 'express'
import { timingSafeEqual } from 'node:crypto'

const parseSpeaker = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const readBasicCredentials = (header) => {
  if (typeof header !== 'string' || !header.startsWith('Basic ')) {
    return null
  }

  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')
    if (separatorIndex < 0) {
      return null
    }

    return {
      user: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

const isTimingSafeEqual = (value, expected) => {
  const valueBuffer = Buffer.from(value)
  const expectedBuffer = Buffer.from(expected)
  const sameLength = valueBuffer.length === expectedBuffer.length
  // Compare an equal-length dummy value when the supplied value has a different
  // length so authentication always performs a timing-safe comparison.
  const comparedBuffer = sameLength ? valueBuffer : expectedBuffer
  return timingSafeEqual(comparedBuffer, expectedBuffer) && sameLength
}

export const createApp = ({
  fetchImpl = fetch,
  engineUrl,
  defaultSpeaker,
  basicAuthUser,
  basicAuthPassword,
  difyApiUrl,
  difyApiKey,
  difyUserId,
} = {}) => {
  const app = express()
  const authUser = basicAuthUser ?? process.env.BASIC_AUTH_USER ?? ''
  const authPassword = basicAuthPassword ?? process.env.BASIC_AUTH_PASSWORD ?? ''
  const authEnabled = authUser.length > 0 && authPassword.length > 0

  if (authEnabled) {
    app.use((req, res, next) => {
      const credentials = readBasicCredentials(req.headers.authorization)
      const validUser = isTimingSafeEqual(credentials?.user ?? '', authUser)
      const validPassword = isTimingSafeEqual(credentials?.password ?? '', authPassword)
      if (validUser && validPassword) {
        return next()
      }

      res.setHeader('WWW-Authenticate', 'Basic realm="AI Avatar"')
      return res.status(401).send('Authentication required')
    })
  }

  app.use(express.json())

  // The Dify API key stays on the server: the browser only calls /api/chat,
  // so the key never ships in the client bundle or request headers.
  const difyUrl = (difyApiUrl ?? process.env.DIFY_API_URL ?? '').trim().replace(/\/$/, '')
  const difyKey = (difyApiKey ?? process.env.DIFY_API_KEY ?? '').trim()
  const difyUser = (difyUserId ?? process.env.DIFY_USER_ID ?? '').trim() || 'local-user-001'

  app.post('/api/chat', async (req, res) => {
    if (!difyUrl || !difyKey) {
      return res.status(503).json({ error: 'dify is not configured' })
    }

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) {
      return res.status(400).json({ error: 'message is required' })
    }

    const conversationId =
      typeof req.body?.conversationId === 'string' && req.body.conversationId ? req.body.conversationId : undefined

    try {
      const difyResponse = await fetchImpl(`${difyUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${difyKey}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: message,
          response_mode: 'blocking',
          conversation_id: conversationId,
          user: difyUser,
        }),
      })

      if (!difyResponse.ok) {
        console.error(`[api/chat] Dify responded ${difyResponse.status}`)
        return res.status(502).json({ error: 'dify request failed', status: difyResponse.status })
      }

      return res.status(200).json(await difyResponse.json())
    } catch (error) {
      // Node's fetch hides the network reason (DNS, refused, timeout, TLS) in error.cause.
      const reason = error?.cause?.code ?? error?.cause?.message ?? error?.message ?? 'unknown'
      console.error(`[api/chat] Dify request error: ${reason}`)
      return res.status(502).json({ error: 'dify request failed', reason })
    }
  })

  const vvEngineUrl = (engineUrl ?? process.env.VOICEVOX_ENGINE_URL ?? 'http://127.0.0.1:50021').replace(/\/$/, '')
  const vvDefaultSpeaker = parseSpeaker(defaultSpeaker ?? process.env.VOICEVOX_SPEAKER, 1)

  app.post('/api/tts/voicevox', async (req, res) => {
    try {
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
      if (!text) {
        return res.status(400).json({ error: 'text is required' })
      }

      const speaker = parseSpeaker(req.body?.speaker, vvDefaultSpeaker)
      const queryUrl = `${vvEngineUrl}/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`
      const queryResponse = await fetchImpl(queryUrl, { method: 'POST' })
      if (!queryResponse.ok) {
        return res.status(502).json({ error: 'voicevox audio_query failed' })
      }

      const audioQuery = await queryResponse.json()
      const synthesisUrl = `${vvEngineUrl}/synthesis?speaker=${speaker}`
      const synthesisResponse = await fetchImpl(synthesisUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioQuery),
      })

      if (!synthesisResponse.ok) {
        return res.status(502).json({ error: 'voicevox synthesis failed' })
      }

      const wavBuffer = Buffer.from(await synthesisResponse.arrayBuffer())
      res.setHeader('Content-Type', 'audio/wav')
      return res.status(200).send(wavBuffer)
    } catch {
      return res.status(500).json({ error: 'voicevox tts failed' })
    }
  })

  return app
}
