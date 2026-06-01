import { ChatMessage } from '../types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  function formatMessage(text: string): string {
    return text
      // Bold: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Numbered points: "1. text" at start of line -> proper list item with line break before
      .replace(/(\d+\.\s)/g, '<br/><strong>$1</strong>')
      // Bullet points: "* text" or "- text" at start -> bullet
      .replace(/^[\*\-]\s(.+)/gm, '• $1')
      // Double newlines -> paragraph breaks
      .replace(/\n\n/g, '<br/><br/>')
      // Single newlines -> line breaks
      .replace(/\n/g, '<br/>')
      // Clean up leading <br/>
      .replace(/^<br\/>/, '')
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[70%] items-end' : 'max-w-[85%] items-start'}`}>
        <div
          className={`px-6 py-4 text-sm leading-relaxed ${
            isUser
              ? 'ml-auto bg-[#1C1208] text-[#F5F0E8]'
              : 'animate-fade-in border border-[#D4C9B0] bg-white text-[#1C1208]'
          }`}
        >
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
              {message.isStreaming && <span className="cursor-blink" />}
            </div>
          ) : (
            <>
              <div
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                style={{ whiteSpace: 'normal', lineHeight: '1.7' }}
              />
              {message.isStreaming && <span className="cursor-blink" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
