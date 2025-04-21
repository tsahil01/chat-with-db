"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { DataTable } from "./data-table"
import ReactMarkdown from "react-markdown"
import { Card } from "@/components/ui/card"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  ignoreUI?: boolean
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Function to check if content is likely markdown
  const isMarkdown = (content: string) => {
    // Simple check for common markdown patterns
    return (
      typeof content === "string" &&
      (content.includes("**") ||
        content.includes("__") ||
        content.includes("##") ||
        content.includes("```") ||
        content.includes("- ") ||
        content.includes("1. ") ||
        (content.includes("[") && content.includes("](")))
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message) =>
          message.ignoreUI ? null : (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg",
                  message.role === "user" ? "bg-primary text-primary-foreground p-4" : "bg-card",
                )}
              >
                {message.content.includes("Query returned") && message.content.includes("[") ? (
                  <ResultDisplay content={message.content} />
                ) : isMarkdown(message.content) ? (
                  <Card className="p-4 markdown-content prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Card>
                ) : (
                  <div className={message.role === "assistant" ? "p-4" : ""}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
                <div
                  className={cn(
                    "text-xs mt-2",
                    message.role === "user" ? "text-primary-foreground/70 px-0" : "text-muted-foreground px-4 pb-2",
                  )}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ),
        )
      )}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-card rounded-lg p-4 max-w-[80%]">
            <div className="flex space-x-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

function ResultDisplay({ content }: { content: string }) {
  try {
    // Extract the JSON part from the message
    const jsonMatch = content.match(/\[([\s\S]*)\]/)
    if (!jsonMatch) return <p className="whitespace-pre-wrap">{content}</p>

    const jsonString = `[${jsonMatch[1]}]`
    const data = JSON.parse(jsonString)

    // Extract the count part
    const countMatch = content.match(/Query returned (\d+) results:/)
    const count = countMatch ? countMatch[1] : "0"

    return (
      <div className="p-4">
        <p className="mb-2 font-medium">Query returned {count} results:</p>
        <DataTable data={data} />
      </div>
    )
  } catch (error) {
    console.error("Error parsing result:", error)
    return <p className="whitespace-pre-wrap">{content}</p>
  }
}
