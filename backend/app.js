import express from 'express'

const parseSpeaker = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const createApp = ({ fetchImpl = fetch, engineUrl, defaultSpeaker } = {}) => {
  const app = express()
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
