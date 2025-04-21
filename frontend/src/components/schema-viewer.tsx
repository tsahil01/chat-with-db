"use client"
import { Database, ChevronDown, ChevronUp } from "lucide-react"

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
