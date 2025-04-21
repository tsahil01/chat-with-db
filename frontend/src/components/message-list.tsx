"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

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
                  "max-w-[80%] rounded-lg p-4",
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.content.includes("Query returned") && message.content.includes("[") ? (
                  <ResultDisplay content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <div
                  className={cn(
                    "text-xs mt-2",
                    message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground",
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
          <div className="bg-muted rounded-lg p-4 max-w-[80%]">
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
      <div>
        <p className="mb-2">Query returned {count} results:</p>
        <div className="bg-background rounded-md overflow-hidden">
          <DataTable data={data} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error parsing result:", error)
    return <p className="whitespace-pre-wrap">{content}</p>
  }
}

// Import the DataTable component to use in the ResultDisplay
import { DataTable } from "./data-table"
