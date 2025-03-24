"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Database, Send, Settings, Code } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import ReactMarkdown from "react-markdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Message {
  role: "user" | "assistant"
  content: string
  type?: "text" | "json" | "sql" | "sql-result" | "markdown"
}

interface SchemaItem {
  column_name: string
  data_type: string
}

type Schema = Record<string, SchemaItem[]>

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSqlLoading, setIsSqlLoading] = useState(false)
  const [dbUrl, setDbUrl] = useState("")
  const [schema, setSchema] = useState<Schema | null>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input, type: "text" }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Handle different response types
      let content = ""
      let type: Message["type"] = "text"

      if (typeof data === "string") {
        content = data

        // Check if it's a SQL response
        if (content.includes("Generated SQL:")) {
          const sqlQuery = content.replace("Generated SQL:", "").trim()
          type = "sql"

          // Add a message showing the SQL query
          const sqlMessage: Message = {
            role: "assistant",
            content: sqlQuery,
            type: "sql",
          }
          setMessages((prev) => [...prev, sqlMessage])

          // Execute the SQL query
          await executeSqlQuery(sqlQuery)
          return
        } else {
          // Check if it might contain markdown
          if (content.includes("#") || content.includes("*") || content.includes("```") || content.includes("|")) {
            type = "markdown"
          }
        }
      } else if (typeof data === "object") {
        content = JSON.stringify(data, null, 2)
        type = "json"
      }

      const assistantMessage: Message = { role: "assistant", content, type }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        type: "text",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const executeSqlQuery = async (sqlQuery: string) => {
    if (!dbUrl) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Database connection is not configured. Please set up your database connection first.",
        type: "text",
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    setIsSqlLoading(true)
    const loadingMessage: Message = {
      role: "assistant",
      content: "Running SQL query...",
      type: "text",
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      const response = await fetch("http://localhost:3000/sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: sqlQuery,
          DB_URL: dbUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute SQL query")
      }

      const data = await response.json()

      // Remove the loading message
      setMessages((prev) => prev.slice(0, -1))

      // Add the result message
      const resultMessage: Message = {
        role: "assistant",
        content: JSON.stringify(data, null, 2),
        type: "sql-result",
      }
      setMessages((prev) => [...prev, resultMessage])
    } catch (error) {
      console.error("Error executing SQL query:", error)

      // Remove the loading message
      setMessages((prev) => prev.slice(0, -1))

      const errorMessage: Message = {
        role: "assistant",
        content: "Error executing SQL query. Please check your syntax and try again.",
        type: "text",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSqlLoading(false)
    }
  }

  const fetchSchema = async () => {
    if (!dbUrl) return

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:3000/schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          DB_URL: dbUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch schema")
      }

      const data = await response.json()
      setSchema(data)

      // Add schema information to messages
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Schema loaded successfully. You can now query your database.`,
          type: "text",
        },
      ])

      // Add detailed schema information as a system message
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Here is the schema information: ${JSON.stringify(data)}`,
          type: "json",
        },
      ])

      setActiveTab("chat")
    } catch (error) {
      console.error("Error fetching schema:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderSqlResultTable = (content: string) => {
    try {
      const data = JSON.parse(content)
      if (!Array.isArray(data) || data.length === 0) {
        return <pre className="text-sm">No results returned</pre>
      }

      // Extract column headers from the first result
      const columns = Object.keys(data[0])

      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className="font-medium">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {typeof row[column] === "object" ? JSON.stringify(row[column]) : String(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-2 text-xs text-gray-500">
            {data.length} {data.length === 1 ? "row" : "rows"} returned
          </div>
        </div>
      )
    } catch (e) {
      return <pre className="text-sm text-red-500">Error parsing results: {String(e)}</pre>
    }
  }

  const renderMessageContent = (message: Message) => {
    const { content, type } = message

    switch (type) {
      case "json":
        try {
          const jsonData = JSON.parse(content)
          return (
            <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          )
        } catch (e) {
          return <p>{content}</p>
        }

      case "sql":
        return (
          <div>
            <p className="mb-2 font-medium">SQL Query:</p>
            <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm">{content}</pre>
          </div>
        )

      case "sql-result":
        return (
          <div>
            <p className="mb-2 font-medium">Query Results:</p>
            {renderSqlResultTable(content)}
          </div>
        )

      case "markdown":
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )

      case "text":
      default:
        return <p>{content}</p>
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Database Chat</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Database Connection</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="db-url">Database URL</Label>
                <Input
                  id="db-url"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  placeholder="postgresql://username:password@host:port/database"
                />
              </div>
              <Button onClick={fetchSchema} disabled={!dbUrl || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="schema" disabled={!schema}>
            Schema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Chat with your Database</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 my-8">
                    <Database className="mx-auto h-12 w-12 mb-2" />
                    <p>Start chatting with your database</p>
                    <p className="text-sm mt-2">
                      {schema
                        ? "Schema loaded! Ask questions about your data."
                        : "Connect to your database to get started."}
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your data..."
                  disabled={isLoading || isSqlLoading || !schema}
                />
                <Button type="submit" disabled={isLoading || isSqlLoading || !schema || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSqlLoading ? (
                    <Code className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="flex-1">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {schema && (
                <div className="space-y-6">
                  {Object.entries(schema).map(([tableName, columns]) => (
                    <div key={tableName} className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">{tableName}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Column
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {columns.map((column, i) => (
                              <tr key={i}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {column.column_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {column.data_type}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

