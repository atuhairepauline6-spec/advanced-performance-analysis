"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Trash2, Eye } from "lucide-react"

interface AnalysisReport {
  id: number
  fileName: string
  uploadDate: string
  studentCount: number
  subjects: string[]
  statistics: Record<string, any>
  students: any[]
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("analysisHistory")
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch {
        setHistory([])
      }
    }
    setLoading(false)
  }, [])

  // Delete a report from history
  const deleteReport = (id: number) => {
    const updated = history.filter((h) => h.id !== id)
    setHistory(updated)
    localStorage.setItem("analysisHistory", JSON.stringify(updated))
  }

  // Clear all history
  const clearAllHistory = () => {
    if (confirm("Are you sure you want to delete all analysis history? This cannot be undone.")) {
      setHistory([])
      localStorage.setItem("analysisHistory", "[]")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              <h1 className="text-4xl font-bold text-foreground">Analysis History</h1>
            </div>
            {history.length > 0 && (
              <Button
                onClick={clearAllHistory}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              >
                Clear All
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-lg">View and revisit your previous analyses</p>
        </div>

        {/* Empty State */}
        {history.length === 0 && (
          <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/10">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <History className="w-16 h-16 mx-auto mb-4 text-primary/30" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No analysis history yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload a dataset to analyze and it will appear here for future reference.
                </p>
                <Link href="/upload">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">Go to Upload</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Grid */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((report) => {
              const uploadDate = new Date(report.uploadDate)
              const formattedDate = uploadDate.toLocaleDateString()
              const formattedTime = uploadDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

              return (
                <Card
                  key={report.id}
                  className="bg-gradient-to-br from-card to-muted/30 border-primary/10 hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2 text-foreground">{report.fileName}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {formattedDate} at {formattedTime}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Students</p>
                        <p className="text-lg font-bold text-primary">{report.studentCount}</p>
                      </div>
                      <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                        <p className="text-xs text-muted-foreground mb-1">Subjects</p>
                        <p className="text-lg font-bold text-accent">{report.subjects.length}</p>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Subjects Analyzed:</p>
                      <div className="flex flex-wrap gap-2">
                        {report.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-1 bg-gradient-to-r from-primary/10 to-accent/10 text-xs font-medium text-primary rounded border border-primary/20"
                          >
                            {subject.charAt(0).toUpperCase() + subject.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/report/${report.id}`} className="flex-1">
                        <Button
                          variant="default"
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Report
                        </Button>
                      </Link>
                      <Button
                        onClick={() => deleteReport(report.id)}
                        variant="outline"
                        className="px-3 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
