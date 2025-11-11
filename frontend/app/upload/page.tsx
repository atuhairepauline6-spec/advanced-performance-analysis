"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Papa from "papaparse"
import { Download, Upload, AlertCircle, CheckCircle } from "lucide-react"
import { uploadScores } from "@/lib/spi";

interface StudentRecord {
  name: string
  [subject: string]: string | number
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<StudentRecord[]>([])
  const [message, setMessage] = useState({ type: "", text: "" })
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Download template CSV
  const downloadTemplate = () => {
    const headers = ["student_name", "math", "science", "english", "history"]
    const sampleData = [
      ["John Doe", "85", "88", "82", "90"],
      ["Jane Smith", "92", "94", "91", "89"],
    ]

    const csv = [headers, ...sampleData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "student_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setIsLoading(true)

    Papa.parse(uploadedFile, {
      complete: (results: { data: string[][] }) => {
        try {
          const rows = results.data as string[][]
          if (rows.length < 2) {
            setMessage({ type: "error", text: "CSV file must contain at least headers and one data row" })
            setIsLoading(false)
            return
          }

          const headers = rows[0]
          const studentRecords: StudentRecord[] = rows
            .slice(1)
            .filter((row) => row[0])
            .map((row) => {
              const record: StudentRecord = { name: row[0] }
              headers.forEach((header, idx) => {
                if (idx > 0 && idx < row.length) {
                  record[header] = isNaN(Number(row[idx])) ? row[idx] : Number(row[idx])
                }
              })
              return record
            })

          setData(studentRecords)
          setMessage({ type: "success", text: `Successfully loaded ${studentRecords.length} students` })

          localStorage.setItem(
            "uploadedData",
            JSON.stringify({
              timestamp: new Date().toISOString(),
              fileName: uploadedFile.name,
              students: studentRecords,
            }),
          )
          // Connect to backend: upload CSV to FastAPI
          uploadScores(uploadedFile)
              .then(() => {
                  setMessage({
                      type: "success",
                      text: `Uploaded to backend and parsed: ${uploadedFile.name}`,
                  })
              })
              .catch((err) => {
                  setMessage({
                      type: "error",
                      text: `Backend upload failed: ${err.message}`,
                  })
              })
        } catch (error) {
          setMessage({ type: "error", text: "Error parsing CSV file" })
        }
        setIsLoading(false)
      },
      error: () => {
        setMessage({ type: "error", text: "Error reading file" })
        setIsLoading(false)
      },
    })
  }

  // Generate report and save to history
  const generateReport = () => {
    if (data.length === 0) {
      setMessage({ type: "error", text: "No data loaded. Please upload a CSV file first." })
      return
    }

    // Calculate statistics
    const subjects = Object.keys(data[0]).filter((k) => k !== "name")
    const statistics: Record<string, any> = {}

    subjects.forEach((subject) => {
      const scores = data.map((s) => s[subject] as number).filter((s) => typeof s === "number")
      const sorted = [...scores].sort((a, b) => a - b)
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length
      const median = sorted[Math.floor(sorted.length / 2)]
      const variance = scores.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / scores.length
      const stdDev = Math.sqrt(variance)

      statistics[subject] = {
        mean: mean.toFixed(2),
        median,
        stdDev: stdDev.toFixed(2),
        min: Math.min(...scores),
        max: Math.max(...scores),
      }
    })

    // Save to history
    const report = {
      id: Date.now(),
      fileName: file?.name || "analysis",
      uploadDate: new Date().toISOString(),
      studentCount: data.length,
      subjects,
      statistics,
      students: data,
    }

    const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]")
    history.unshift(report)
    localStorage.setItem("analysisHistory", JSON.stringify(history.slice(0, 50)))

    setMessage({ type: "success", text: "Report generated and saved to history!" })

    // Redirect to view the report (we'll create a view page)
    setTimeout(() => {
      window.location.href = `/report/${report.id}`
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <h1 className="text-4xl font-bold text-foreground">Upload Dataset</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Download template, fill in marks, and upload to generate analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
          {/* Left Column - Template & Upload */}
          <div className="space-y-6">
            {/* Download Template */}
            <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Step 1: Download Template
                </CardTitle>
                <CardDescription>Get a pre-formatted CSV template to fill in</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The template includes columns for student name and subjects (Math, Science, English, History).
                </p>
                <Button
                  onClick={downloadTemplate}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>

            {/* Upload CSV */}
            <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-accent" />
                  Step 2: Upload Completed CSV
                </CardTitle>
                <CardDescription>Upload your filled CSV file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-primary/60" />
                    <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">CSV files only</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: <span className="font-semibold text-primary">{file.name}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Generate */}
          <div className="space-y-6">
            {/* Messages */}
            {message.text && (
              <Alert
                className={message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview */}
            {data.length > 0 && (
              <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10">
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>{data.length} students loaded</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {Object.keys(data[0]).map((key) => (
                            <th key={key} className="text-left py-2 px-2 font-semibold text-primary">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50">
                            {Object.values(row).map((val, idx) => (
                              <td key={idx} className="py-2 px-2 text-muted-foreground">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-2">+{data.length - 3} more students...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Report */}
            <Button
              onClick={generateReport}
              disabled={data.length === 0 || isLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 text-base font-semibold disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Generate Report & Analyze"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
