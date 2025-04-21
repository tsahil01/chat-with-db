"use client"
import { Database, ChevronDown, ChevronUp, Search } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type SchemaColumn = {
  column_name: string
  data_type: string
}

type DatabaseSchema = {
  [tableName: string]: SchemaColumn[]
}

interface SchemaViewerProps {
  schema: DatabaseSchema | null
  schemaCollapsed: boolean
  toggleSchema: () => void
}

export function SchemaViewer({ schema, schemaCollapsed, toggleSchema }: SchemaViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({})

  if (!schema) return null

  // Filter tables and columns based on search term
  const filteredSchema = Object.entries(schema).reduce((acc, [tableName, columns]) => {
    // If search term is empty, include all tables
    if (!searchTerm) {
      acc[tableName] = columns
      return acc
    }

    // Check if table name matches search
    const tableNameMatches = tableName.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter columns that match search
    const matchingColumns = columns.filter(
      (col) =>
        col.column_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.data_type.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Include table if its name matches or it has matching columns
    if (tableNameMatches || matchingColumns.length > 0) {
      acc[tableName] = matchingColumns.length > 0 ? matchingColumns : columns
    }

    return acc
  }, {} as DatabaseSchema)

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }))
  }

  return (
    <div className="border-b dark:border-gray-800">
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={toggleSchema}
      >
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <h3 className="text-sm font-medium">Database Schema</h3>
          <Badge variant="outline" className="ml-2">
            {Object.keys(schema).length} tables
          </Badge>
        </div>
        {schemaCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>

      {!schemaCollapsed && (
        <div className="bg-muted/30">
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables and columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 bg-background"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(filteredSchema).map(([tableName, columns]) => (
                <div key={tableName} className="border rounded-md bg-background overflow-hidden">
                  <div
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors border-b"
                    onClick={() => toggleTable(tableName)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{tableName}</h4>
                      <Badge variant="outline" size="sm" className="text-xs">
                        {columns.length}
                      </Badge>
                    </div>
                    {expandedTables[tableName] ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {expandedTables[tableName] && (
                    <div className="p-2">
                      <div className="text-xs space-y-1.5">
                        {columns.map((col, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-primary font-medium">{col.column_name}</span>
                            <span className="text-muted-foreground">{col.data_type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {Object.keys(filteredSchema).length === 0 && (
                <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
                  No tables or columns match your search
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
