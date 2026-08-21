// Client-side engine: talks to the local streaming proxy, parses the model's
// fenced ```json block, and silently falls back to a pre-generated result set
// if the live call fails. The streamed reasoning text is surfaced to the UI
// via the onDelta callback (the "thinking out loud" glass-box effect).

export async function checkHealth() {
  try {
    const r = await fetch('/api/health')
    if (!r.ok) return { liveAvailable: false }
    return await r.json()
  } catch {
    return { liveAvailable: false }
  }
}

// Extract the last fenced ```json ... ``` block, else try to find a bare {...}.
export function extractJson(text) {
  if (!text) return null
  const fenceRe = /```json\s*([\s\S]*?)```/gi
  let match
  let last = null
  while ((match = fenceRe.exec(text)) !== null) last = match[1]
  const candidate = last ?? (() => {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    return start !== -1 && end > start ? text.slice(start, end + 1) : null
  })()
  if (!candidate) return null
  try {
    return JSON.parse(candidate.trim())
  } catch {
    return null
  }
}

// Runs one streaming stage.
//  opts: { system, user, temperature, maxTokens, onDelta(textChunk), signal }
// Returns { text, json }.
export async function runStage({ system, user, temperature = 0.2, maxTokens = 4000, onDelta, signal }) {
  const res = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, temperature, maxTokens }),
    signal
  })

  if (!res.ok || !res.body) {
    throw new Error(`stage_http_${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let errored = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const line = raw.replace(/^data:\s*/, '').trim()
      if (!line) continue
      let evt
      try { evt = JSON.parse(line) } catch { continue }
      if (evt.type === 'delta') {
        full += evt.text
        onDelta?.(evt.text)
      } else if (evt.type === 'done') {
        if (evt.text) full = evt.text
      } else if (evt.type === 'error') {
        errored = evt.message || 'stream_error'
      }
    }
  }

  if (errored) throw new Error(errored)
  return { text: full, json: extractJson(full) }
}
