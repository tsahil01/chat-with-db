"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { SchemaViewer } from "@/components/schema-viewer"
import { MessageList } from "@/components/message-list"
import { MessageInput } from "@/components/message-input"
import { getSchema, sendChatMessage, executeSQL } from "@/lib/api"
import type { Message, DatabaseSchema } from "@/lib/types"
import { Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const DB_URL = "postgresql://postgres:postgres@localhost:5432/chatdb"

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [schema, setSchema] = useState<DatabaseSchema | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaCollapsed, setSchemaCollapsed] = useState(true)

  // Fetch schema data first
  useEffect(() => {
    async function fetchSchema() {
      try {
        setSchemaLoading(true)
        const data = await getSchema(DB_URL)
        setSchema(data)

        const schemaMessage: Message = {
          id: Date.now().toString(),
          content: `Here is the schema information: ${JSON.stringify(data)}`,
          role: "assistant",
          timestamp: new Date(),
          ignoreUI: true,
        }
        setMessages((prev) => [...prev, schemaMessage])

        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content:
            "# Welcome to Chat with DB 👋\n\nI can help you query the database using natural language. Try asking questions about the data or request specific information.\n\n**Examples:**\n- Show me product data\n- Which user has least orders?\n- Count models by provider",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, welcomeMessage])
      } catch (err) {
        console.error("Error fetching schema:", err)
        const errorMessage: Message = {
          id: Date.now().toString(),
          content:
            "**Connection Error**\n\nI had trouble loading the database schema. Please check your connection to the database.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setSchemaLoading(false)
      }
    }

    fetchSchema()
  }, [])

  async function handleSendMessage(prompt: string) {
    const data = await sendChatMessage(
      prompt,
      messages.map((m) => ({ role: m.role, content: m.content })),
    )
    console.log("Response from backend:", data)

    if (data.generatedSQL) {
      const sql = data.generatedSQL
      const sqlMessage: Message = {
        id: Date.now().toString(),
        content: `Running SQL Query:\n\n\`\`\`sql\n${sql}\n\`\`\``,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, sqlMessage])

      try {
        const output = await executeSQL(sql, DB_URL)
        // Format the results as a readable string
        let resultContent = ""
        if (output && output.length > 0) {
          resultContent = `Query returned ${output.length} results:\n\n${JSON.stringify(output, null, 2)}`
        } else {
          resultContent = "Query executed successfully, but returned no results."
        }

        const resultMessage: Message = {
          id: Date.now().toString(),
          content: resultContent,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, resultMessage])
      } catch (error) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `**Error executing SQL**\n\n\`\`\`\n${(error as Error).message}\n\`\`\``,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    } else if (data.textResponse) {
      const text = data.textResponse
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: text,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    } else if (data.visualization) {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    await handleSendMessage(input)
  }

  const toggleSchema = () => {
    setSchemaCollapsed((prev) => !prev)
  }

  if (schemaLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <div className="flex space-x-2">
          <div className="h-3 w-3 bg-primary rounded-full animate-bounce"></div>
          <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <p className="mt-4 text-muted-foreground">Loading database schema...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen container mx-auto">
      {/* Chat header */}
      <header className="border-b dark:border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Chat with DB</h1>
        </div>
        <Badge variant="outline" className="px-2 py-1">
          {schema ? Object.keys(schema).length : 0} Tables
        </Badge>
      </header>

      {/* Collapsible schema panel */}
      <SchemaViewer schema={schema} schemaCollapsed={schemaCollapsed} toggleSchema={toggleSchema} />

      {/* Messages container */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input area */}
      <MessageInput input={input} setInput={setInput} handleSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
