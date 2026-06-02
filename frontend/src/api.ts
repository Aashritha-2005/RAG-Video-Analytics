import { Citation, ProcessResponse } from './types'

const API_BASE: string = 'https://rag-video-analytics.onrender.com'

export async function processVideos(urlA: string, urlB: string): Promise<ProcessResponse> {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url_a: urlA, url_b: urlB }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to process videos')
  }
  return res.json()
}

export function streamChat(
  sessionId: string,
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  citations?: Citation[],
) {
  fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  }).then(async res => {
    if (!res.ok) throw new Error('Stream request failed')
    if (!res.body) throw new Error('Stream response body is unavailable')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) onToken(line.slice(6))
      }
    }
    onDone()
  }).catch(onError)
}
// build Tue Jun  2 19:18:08 IST 2026
