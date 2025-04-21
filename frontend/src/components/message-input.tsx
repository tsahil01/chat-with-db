"use client"

import type React from "react"
import { Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MessageInputProps {
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function MessageInput({ input, setInput, handleSubmit, isLoading }: MessageInputProps) {
  // Example queries that users might want to try
  const exampleQueries = [
    "Show me all models that support image input",
    "Which model is set as default?",
    "List all models sorted by name",
    "Count how many models are from each provider",
  ]

  const handleExampleClick = (query: string) => {
    setInput(query)
  }

  return (
    <div className="border-t dark:border-gray-800 p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {exampleQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => handleExampleClick(query)}
            className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors"
          >
            {query}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none pr-12 focus-visible:ring-1 focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 bottom-2 transition-all"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message (or press Enter)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  )
}
