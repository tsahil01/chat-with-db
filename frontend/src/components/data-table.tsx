"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Download } from "lucide-react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { DataVisualization } from "./data-visualization"

interface DataTableProps {
  data: any[]
}

export function DataTable({ data }: DataTableProps) {
  const [showVisualization, setShowVisualization] = useState(false)

  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No data to display</div>
  }

  // Get all unique keys from the data objects
  const allKeys = Array.from(new Set(data.flatMap((item) => Object.keys(item))))

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

  // Function to export data as JSON
  const exportData = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
    const link = document.createElement("a")
    link.href = jsonString
    link.download = "query-results.json"
    link.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {/* <h3 className="text-sm font-medium">Query Results</h3> */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVisualization(!showVisualization)}
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{showVisualization ? "Hide" : "Visualize"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {showVisualization && (
        <div className="bg-muted/20 p-4 rounded-md border">
          <DataVisualization data={data} />
        </div>
      )}

      <div className="rounded-md border overflow-hidden bg-background shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {allKeys.map((key) => (
                  <TableHead key={key} className="font-medium text-xs uppercase tracking-wider py-3">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/30 transition-colors">
                  {allKeys.map((key) => (
                    <TableCell key={`${rowIndex}-${key}`} className="py-2.5">
                      {typeof row[key] === "boolean" ? (
                        <Badge variant={row[key] ? "success" : "secondary"} className="font-normal">
                          {row[key] ? "Yes" : "No"}
                        </Badge>
                      ) : typeof row[key] === "string" && isMarkdown(row[key]) ? (
                        <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{row[key]}</ReactMarkdown>
                        </div>
                      ) : row[key] !== undefined ? (
                        String(row[key])
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
