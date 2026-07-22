import express from 'express'

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

export const createApp = ({
  fetchImpl = fetch,
  engineUrl,
  defaultSpeaker,
  basicAuthUser,
  basicAuthPassword,
} = {}) => {
  const app = express()
  const authUser = basicAuthUser ?? process.env.BASIC_AUTH_USER ?? ''
  const authPassword = basicAuthPassword ?? process.env.BASIC_AUTH_PASSWORD ?? ''
  const authEnabled = authUser.length > 0 && authPassword.length > 0

  if (authEnabled) {
    app.use((req, res, next) => {
      const credentials = readBasicCredentials(req.headers.authorization)
      if (credentials?.user === authUser && credentials.password === authPassword) {
        return next()
      }

      res.setHeader('WWW-Authenticate', 'Basic realm="AI Avatar"')
      return res.status(401).send('Authentication required')
    })
  }

  app.use(express.json())

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
