export type Message = {
    id: string
    content: string
    role: "user" | "assistant"
    timestamp: Date
    ignoreUI?: boolean
  }
  
  export type SchemaColumn = {
    column_name: string
    data_type: string
  }
  
  export type DatabaseSchema = {
    [tableName: string]: SchemaColumn[]
  }
  