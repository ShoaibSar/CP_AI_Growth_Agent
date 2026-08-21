import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'

const PORT = process.env.PORT || 8787
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4'
const apiKey = process.env.OPENAI_API_KEY

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const client = apiKey ? new OpenAI({ apiKey }) : null

// Health / config probe — the UI uses this to decide live vs. fallback up front.
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    liveAvailable: Boolean(apiKey),
    model: MODEL
  })
})

// Streaming endpoint. Body: { system, user, temperature?, maxTokens? }
// Streams Server-Sent Events: {type:'delta', text} ... {type:'done'} | {type:'error'}
app.post('/api/stream', async (req, res) => {
  const { system, user, maxTokens = 4000 } = req.body || {}

  if (!client) {
    res.status(503).json({ error: 'no_api_key', message: 'OPENAI_API_KEY not set on server.' })
    return
  }
  if (!user) {
    res.status(400).json({ error: 'bad_request', message: 'Missing user prompt.' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

  try {
    const stream = await client.responses.create({
      model: MODEL,
      max_output_tokens: maxTokens,
      reasoning: { effort: 'low' },
      text: { verbosity: 'low' },
      instructions: system || 'You are a helpful assistant.',
      input: user,
      stream: true
    })

    let full = ''
    let usage = null
    let incompleteReason = null
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        full += event.delta
        send({ type: 'delta', text: event.delta })
      } else if (event.type === 'response.completed') {
        usage = event.response?.usage || null
      } else if (event.type === 'response.incomplete') {
        incompleteReason = event.response?.incomplete_details?.reason || 'response_incomplete'
      } else if (event.type === 'response.failed') {
        throw new Error(event.response?.error?.message || 'response_failed')
      } else if (event.type === 'error') {
        throw new Error(event.message || 'stream_error')
      }
    }

    if (incompleteReason) throw new Error(`Model response incomplete: ${incompleteReason}`)
    send({ type: 'done', text: full, usage })
    res.end()
  } catch (err) {
    console.error('[api error]', err?.message || err)
    // Client sees an error event and can fall back silently.
    try { send({ type: 'error', message: err?.message || 'api_error' }) } catch {}
    res.end()
  }
})

app.listen(PORT, () => {
  console.log(`\n  Glass-Box proxy on http://localhost:${PORT}`)
  console.log(`  Model: ${MODEL}`)
  console.log(`  Live API: ${apiKey ? 'ENABLED' : 'DISABLED (fallback only) - set OPENAI_API_KEY in .env'}\n`)
})
