import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Allow your React frontend (or * for testing)
app.use('*', cors({
  origin: '*',                    // ← change to your deployed React URL in production
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'xi-api-key'],
  maxAgeSeconds: 3600,
}))

// Health check
app.get('/', (c) => c.text('🗣️ AI TTS + Voice Clone Worker is running!'))

// Proxy all ElevenLabs endpoints (v1 & v2)
app.all('/v1/*', async (c) => proxyToElevenLabs(c))
app.all('/v2/*', async (c) => proxyToElevenLabs(c))

async function proxyToElevenLabs(c: any) {
  const ELEVENLABS_KEY = c.env.ELEVENLABS_API_KEY
  if (!ELEVENLABS_KEY) {
    return c.text('Missing ELEVENLABS_API_KEY secret', 500)
  }

  const targetUrl = `https://api.elevenlabs.io\( {c.req.path} \){c.req.url.includes('?') ? '?' + new URL(c.req.url).search : ''}`

  const headers = new Headers()
  for (const [key, value] of c.req.raw.headers) {
    if (!key.toLowerCase().startsWith('cf-') && key !== 'host') {
      headers.set(key, value)
    }
  }
  headers.set('xi-api-key', ELEVENLABS_KEY)

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : c.req.raw.body,
    })

    // Forward the exact response (audio/mpeg, JSON, etc.)
    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', '*')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    return c.text('Proxy error: ' + (err as Error).message, 502)
  }
}

export default app
