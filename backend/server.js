import { createApp } from './app.js'
import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const port = Number.parseInt(process.env.PORT ?? '8787', 10)
const app = createApp()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')

if (fs.existsSync(distDir)) {
  app.use('/', express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next()
    }
    return res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`VOICEVOX proxy listening on http://127.0.0.1:${port}`)
})
