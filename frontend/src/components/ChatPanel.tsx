import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { streamChat } from '../api'
import { useAppStore } from '../store'
import { MessageBubble } from './MessageBubble'

const suggestions = [
  'Why did Video A get more engagement than Video B?',
  "What's the engagement rate of each video?",
  'Compare the hooks in the first 5 seconds',
  "Who's the creator of Video B and what's their follower count?",
  'Suggest improvements for B based on what worked in A'
]

export function ChatPanel() {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const {
    sessionId,
    messages,
    isStreaming,
    addUserMessage,
    addAssistantMessage,
    appendToken,
    finalizeMessage,
    setIsStreaming
  } = useAppStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim() || !sessionId || isStreaming) return
    addUserMessage(text)
    const assistantMsgId = addAssistantMessage()
    setDraft('')
    setIsStreaming(true)

    streamChat(
      sessionId,
      text,
      (token) => appendToken(assistantMsgId, token),
      (citations) => finalizeMessage(assistantMsgId, citations),
      () => setIsStreaming(false),
      (err) => {
        appendToken(assistantMsgId, `\n\nError: ${err}`)
        finalizeMessage(assistantMsgId, [])
        setIsStreaming(false)
      }
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(draft)
    }
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-130px)] max-w-5xl flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-5 py-4">
        <div>
          <h1 className="text-xl font-bold">Chat with your videos</h1>
          <p className="mt-1 text-sm text-gray-400">Ask for hook, content, and performance analysis.</p>
        </div>
        <span className="rounded-full bg-gray-950 px-3 py-1 text-xs font-semibold text-gray-300 ring-1 ring-gray-800">
          Session {sessionId?.slice(0, 8)}
        </span>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-semibold text-gray-400">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isStreaming}
                  className="rounded-full border border-gray-700 bg-gray-950 px-4 py-2 text-left text-sm text-gray-200 transition hover:border-blue-500 hover:text-white disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-800 bg-gray-950 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
            placeholder="Ask about performance, hooks, creators, or improvements..."
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-md border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(draft)}
            disabled={isStreaming || !draft.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
