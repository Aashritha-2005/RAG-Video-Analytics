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
    <section className="mx-auto flex h-[calc(100vh-150px)] max-w-5xl flex-col overflow-hidden border border-[#D4C9B0] bg-[#F5F0E8]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4C9B0] bg-white px-8 py-5">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-[#1C1208]">CHAT WITH YOUR VIDEOS</h1>
        </div>
        <span className="border border-[#D4C9B0] px-3 py-1 text-xs font-bold tracking-widest text-[#7A6A55]">
          Session {sessionId?.slice(0, 8)}
        </span>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#F5F0E8] px-8 py-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isStreaming}
                  className={`animate-fade-in-up w-full border border-[#D4C9B0] bg-white px-4 py-3 text-left text-sm text-[#1C1208] transition-colors hover:border-[#8B3A1A] hover:text-[#8B3A1A] disabled:opacity-50 stagger-${Math.min(index + 1, 4)}`}
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

      <div className="border-t border-[#D4C9B0] bg-white px-8 py-5">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
            placeholder="Ask about performance, hooks, creators, or improvements..."
            className="max-h-32 min-h-[54px] flex-1 resize-none border border-[#D4C9B0] bg-[#F5F0E8] p-4 text-base text-[#1C1208] outline-none transition-colors placeholder:text-[#9B8E7E] focus:border-[#8B3A1A] focus:outline-none disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(draft)}
            disabled={isStreaming || !draft.trim()}
            className="inline-flex shrink-0 items-center justify-center bg-[#1C1208] px-6 py-4 text-[#F5F0E8] transition-colors hover:bg-[#8B3A1A] disabled:cursor-not-allowed disabled:bg-[#9B8E7E]"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
