import { ChatMessage } from '../types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white'
              : 'rounded-tl-sm bg-gray-800 text-white'
          }`}
        >
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
            {message.isStreaming && <span className="cursor-blink" />}
          </div>
        </div>

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.citations.map((citation, index) => {
              const isA = citation.video_id === 'A'
              return (
                <span
                  key={`${citation.source}-${index}`}
                  title={citation.chunk_preview}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isA ? 'bg-blue-500/15 text-blue-300' : 'bg-purple-500/15 text-purple-300'
                  }`}
                >
                  [Video {citation.video_id}]
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
