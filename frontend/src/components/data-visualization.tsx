"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DataVisualizationProps {
  data: any[]
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const [chartType, setChartType] = useState("bar")
  const [xAxis, setXAxis] = useState<string>("")
  const [yAxis, setYAxis] = useState<string>("")

  // Get all possible fields for visualization
  const fields = useMemo(() => {
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }, [data])

  // Set default axes when fields are available
  useMemo(() => {
    if (fields.length > 0) {
      // Try to find string fields for x-axis
      const stringField = fields.find(
        (field) => typeof data[0][field] === "string" && !data[0][field].includes("{") && !data[0][field].includes("["),
      )

      // Try to find numeric fields for y-axis
      const numericField = fields.find((field) => typeof data[0][field] === "number" || !isNaN(Number(data[0][field])))

      if (stringField && !xAxis) setXAxis(stringField)
      if (numericField && !yAxis) setYAxis(numericField)

      // If no numeric field, use the first field that's not the x-axis
      if (!numericField && !yAxis && fields.length > 1) {
        const firstNonXField = fields.find((field) => field !== xAxis)
        if (firstNonXField) setYAxis(firstNonXField)
      }
    }
  }, [fields, data, xAxis, yAxis])

  // Prepare data for visualization
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis || !data || data.length === 0) return []

    // For bar chart, use the data directly
    if (chartType === "bar") {
      return data.map((item) => ({
        name: String(item[xAxis]),
        value: typeof item[yAxis] === "number" ? item[yAxis] : Number(item[yAxis]) || 0,
      }))
    }

    // For pie chart, aggregate data by x-axis value
    if (chartType === "pie") {
      const aggregated: Record<string, number> = {}

      data.forEach((item) => {
        const key = String(item[xAxis])
        const value = typeof item[yAxis] === "number" ? item[yAxis] : Number(item[yAxis]) || 0

        if (aggregated[key]) {
          aggregated[key] += value
        } else {
          aggregated[key] = value
        }
      })

      return Object.entries(aggregated).map(([name, value]) => ({ name, value }))
    }

    return []
  }, [data, xAxis, yAxis, chartType])

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No data available for visualization</div>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Data Visualization</CardTitle>
        <CardDescription>Visualize your query results in different chart formats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Chart Type</label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {chartType === "pie" && "Category"}
              {chartType === "bar" && "X-Axis"}
            </label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              {chartType === "pie" && "Value"}
              {chartType === "bar" && "Y-Axis"}
            </label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-[300px] mt-6">
          {chartData.length > 0 ? (
            chartType === "bar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}`, yAxis]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "6px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select fields to visualize data
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
