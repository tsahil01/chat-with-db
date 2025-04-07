"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ChevronDown, ChevronUp, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { BACKEND_URL } from "./lib/constant"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  ignoreUI?: boolean
}

type SchemaColumn = {
  column_name: string
  data_type: string
}

type DatabaseSchema = {
  [tableName: string]: SchemaColumn[]
}

const DB_URL = "postgresql://postgres:postgres@localhost:5432/postgres"

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [schema, setSchema] = useState<DatabaseSchema | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaCollapsed, setSchemaCollapsed] = useState(false)
  const [runningSQL, setRunningSQL] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch schema data first
  useEffect(() => {
    async function getSchema() {
      try {
        setSchemaLoading(true)
        const response = await fetch(`${BACKEND_URL}/schema`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ DB_URL }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch schema")
        }
        const data = await response.json()
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
          content: "Hello! I can help you query the database. The database schema has been loaded.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, welcomeMessage])
      } catch (err) {
        console.error("Error fetching schema:", err)
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Hello! I had trouble loading the database schema. Please check your connection to the database.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setSchemaLoading(false)
      }
    }

    getSchema()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function getDataFromDB(sql: string) {
    const res = await fetch(`${BACKEND_URL}/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, DB_URL }),
    })
    const data = await res.json()
    return data
  }

  async function sendMessage(prompt: string) {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, messages: messages.map((m) => ({ role: m.role, content: m.content })) }),
    })
    const data = await res.json()
    console.log("Response from backend:", data)

    if (data.generatedSQL) {
      setRunningSQL(true)
      const sql = data.generatedSQL
      const sqlMessage: Message = {
        id: Date.now().toString(),
        content: `Running SQL Query:\n\n ${sql}`,
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, sqlMessage])

      try {
        const output = await getDataFromDB(sql)
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
          content: `Error executing SQL: ${error.message}`,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setRunningSQL(false)
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
      const visualization = data.visualization
      // TODO: Handle the visualization
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

    await sendMessage(input)
  }

  const toggleSchema = () => {
    setSchemaCollapsed((prev) => !prev)
  }
  const renderSchema = () => {
    if (!schema) return null

    return (
      <div className="border-b dark:border-gray-800">
        <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50" onClick={toggleSchema}>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <h3 className="text-sm font-medium">Database Schema</h3>
          </div>
          {schemaCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>

        {!schemaCollapsed && (
          <div className="p-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(schema).map(([tableName, columns]) => (
                <div key={tableName} className="border rounded-md p-3 bg-background">
                  <h4 className="font-medium text-sm mb-1">{tableName}</h4>
                  <div className="text-xs space-y-1">
                    {columns.map((col, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-primary">{col.column_name}</span>
                        <span className="text-muted-foreground">{col.data_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
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
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <header className="border-b dark:border-gray-800 p-4">
        <h1 className="text-xl font-semibold">Chat Interface</h1>
      </header>

      {/* Collapsible schema panel */}
      {renderSchema()}

      {/* Messages container */}
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
                  <p className="whitespace-pre-wrap">{message.content}</p>
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

      {/* Input area */}
      <div className="border-t dark:border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

