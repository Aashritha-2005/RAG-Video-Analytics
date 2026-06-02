import { Citation, ProcessResponse } from './types'

const API_BASE: string =
  (window as unknown as Record<string, string>).__BACKEND_URL__ ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'

export async function processVideos(urlA: string, urlB: string): Promise<ProcessResponse> {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({ url_a: urlA, url_b: urlB })
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
  onCitations: (citations: Citation[]) => void,
  onDone: () => void,
  onError: (err: string) => void
): void {
  fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({ session_id: sessionId, message })
  }).then(async (res) => {
    if (!res.ok) throw new Error('Stream request failed')
    if (!res.body) throw new Error('Stream response body is unavailable')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (!data.trim()) continue

        if (data.includes('[CITATIONS]')) {
          const match = data.match(/\[CITATIONS\](.*)\[\/CITATIONS\]/)
          if (match) {
            try {
              const citations = JSON.parse(match[1]) as Citation[]
              onCitations(citations)
            } catch {
              onCitations([])
            }
          }
          continue
        }
        onToken(data)
      }
    }
    onDone()
  }).catch((err: Error) => onError(err.message))
}
