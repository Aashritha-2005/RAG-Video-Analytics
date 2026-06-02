import { ReactNode } from 'react'
import { ChatMessage } from '../types'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  function stripCitations(text: string): string {
    return text.replace(/\[CITATIONS\][\s\S]*?\[\/CITATIONS\]/g, '').replace(/\[Video [AB]\]/g, '').trim()
  }

  function renderInline(text: string): ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  function renderMarkdown(text: string): ReactNode[] {
    const blocks = text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)

    return blocks.map((block, blockIndex) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      const bulletItems = lines
        .map((line) => line.match(/^[-*]\s+(.+)$/)?.[1])
        .filter((item): item is string => Boolean(item))
      const numberedItems = lines
        .map((line) => line.match(/^\d+\.\s+(.+)$/)?.[1])
        .filter((item): item is string => Boolean(item))

      if (bulletItems.length === lines.length) {
        return (
          <ul key={blockIndex} className="list-disc space-y-1 pl-5">
            {bulletItems.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item)}</li>
            ))}
          </ul>
        )
      }

      if (numberedItems.length === lines.length) {
        return (
          <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
            {numberedItems.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(item)}</li>
            ))}
          </ol>
        )
      }

      return (
        <p key={blockIndex}>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex}>
              {renderInline(line)}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      )
    })
  }

  const visibleContent = stripCitations(message.content)

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
              {visibleContent}
              {message.isStreaming && <span className="cursor-blink" />}
            </div>
          ) : (
            <>
              <div className="space-y-3 leading-7">{renderMarkdown(visibleContent)}</div>
              {message.isStreaming && <span className="cursor-blink" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
