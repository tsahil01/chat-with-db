import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "./ui/badge"


interface DataTableProps {
  data: any[]
}

export function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No data to display</div>
  }

  // Get all unique keys from the data objects
  const allKeys = Array.from(new Set(data.flatMap((item) => Object.keys(item))))

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {allKeys.map((key) => (
              <TableHead key={key} className="font-medium">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {allKeys.map((key) => (
                <TableCell key={`${rowIndex}-${key}`}>
                  {typeof row[key] === "boolean" ? (
                    <Badge variant={row[key] ? "success" : "secondary"}>{row[key] ? "Yes" : "No"}</Badge>
                  ) : row[key] !== undefined ? (
                    String(row[key])
                  ) : (
                    "-"
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
