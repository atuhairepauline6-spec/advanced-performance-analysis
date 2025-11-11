"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, ArrowLeft, AlertCircle } from "lucide-react"
import { chartSubjectsMeanUrl } from "@/lib/spi"

interface AnalysisReport {
  id: number
  fileName: string
  uploadDate: string
  studentCount: number
  subjects: string[]
  statistics: Record<string, any>
  students: any[]
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("analysisHistory")
    if (stored) {
      try {
        const history = JSON.parse(stored)
        const found = history.find((h: AnalysisReport) => h.id === Number(reportId))
        setReport(found || null)
      } catch {
        setReport(null)
      }
    }
    setLoading(false)
  }, [reportId])

  // Calculate subject statistics for charts
  const chartData = useMemo(() => {
    if (!report) return []
    return report.subjects.map((subject) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      mean: Number(report.statistics[subject].mean),
      median: report.statistics[subject].median,
      stdDev: Number(report.statistics[subject].stdDev),
      min: report.statistics[subject].min,
      max: report.statistics[subject].max,
    }))
  }, [report])

  // Calculate student rankings
  const studentRankings = useMemo(() => {
    if (!report) return []
    return report.students
      .map((student) => {
        const subjectScores = report.subjects.map((s) => student[s] as number).filter((s) => typeof s === "number")
        const average = subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length
        return { name: student.name, average }
      })
      .sort((a, b) => b.average - a.average)
  }, [report])

  const exportAsCSV = () => {
    if (!report) return

    let csv = "Academic Performance Analysis Report\n"
    csv += `Generated: ${new Date(report.uploadDate).toLocaleString()}\n`
    csv += `File: ${report.fileName}\n`
    csv += `Students: ${report.studentCount}\n\n`

    // Statistics section
    csv += "Subject Statistics\n"
    csv += "Subject,Mean,Median,Std Dev,Min,Max\n"
    report.subjects.forEach((subject) => {
      const stats = report.statistics[subject]
      csv += `${subject},${stats.mean},${stats.median},${stats.stdDev},${stats.min},${stats.max}\n`
    })

    csv += "\nStudent Data\n"
    csv += ["Name", ...report.subjects].join(",") + "\n"
    report.students.forEach((student) => {
      csv += [student.name, ...report.subjects.map((s) => student[s])].join(",") + "\n"
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report_${report.id}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportAsJSON = () => {
    if (!report) return

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report_${report.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
        <div className="container mx-auto px-4 py-12">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Report not found. It may have been deleted from history.
            </AlertDescription>
          </Alert>
          <Link href="/history" className="block mt-4">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
      <div className="container mx-auto px-4 py-12">
        {/* Header with Export */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <Link href="/history">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to History
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button onClick={exportAsCSV} variant="outline" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button onClick={exportAsJSON} className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">{report.fileName}</h1>
              <p className="text-muted-foreground text-sm">
                Generated on {new Date(report.uploadDate).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{report.studentCount}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{report.subjects.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {(studentRankings.reduce((a, s) => a + s.average, 0) / studentRankings.length).toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary/60 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-primary truncate">{studentRankings[0]?.name}</div>
              <div className="text-xs text-muted-foreground">Avg: {studentRankings[0]?.average.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Tabs */}
        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Statistics
            </TabsTrigger>
            <TabsTrigger
              value="rankings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Rankings
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Details
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Cards */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Subject Metrics</h3>
                {report.subjects.map((subject) => (
                  <Card key={subject} className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base capitalize flex items-center gap-2">
                        <div className="w-2 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                        {subject}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Mean</span>
                        <span className="font-semibold text-primary">{report.statistics[subject].mean}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Median</span>
                        <span className="font-semibold text-secondary">{report.statistics[subject].median}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Std Dev</span>
                        <span className="font-semibold text-accent">{report.statistics[subject].stdDev}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Range</span>
                        <span className="font-semibold text-primary/80">
                          {report.statistics[subject].min} - {report.statistics[subject].max}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="space-y-6">
                <Card className="bg-card border-primary/10">
                  <CardHeader>
                    <CardTitle>Mean Scores by Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                          }}
                        />
                        <Bar dataKey="mean" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card border-primary/10">
                  <CardHeader>
                    <CardTitle>Subject Difficulty</CardTitle>
                    <CardDescription>Mean vs Standard Deviation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="mean" stroke="var(--color-primary)" strokeWidth={2} />
                        <Line type="monotone" dataKey="stdDev" stroke="var(--color-accent)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="mt-6">
            <Card className="bg-card border-primary/10">
              <CardHeader>
                <CardTitle>Student Rankings</CardTitle>
                <CardDescription>Ranked by overall average across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentRankings.map((student, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">{idx + 1}</span>
                        </div>
                        <span className="font-semibold text-foreground">{student.name}</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{student.average.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <Card className="bg-card border-primary/10">
              <CardHeader>
                <CardTitle>Student Scores</CardTitle>
                <CardDescription>Complete scores for all students and subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-primary/20">
                        <th className="text-left py-3 px-2 font-semibold text-primary">Student</th>
                        {report.subjects.map((subject) => (
                          <th key={subject} className="text-center py-3 px-2 font-semibold text-accent">
                            {subject.charAt(0).toUpperCase() + subject.slice(1)}
                          </th>
                        ))}
                        <th className="text-center py-3 px-2 font-semibold text-secondary">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((student, idx) => {
                        const scores = report.subjects.map((s) => student[s] as number)
                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
                        return (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium text-foreground">{student.name}</td>
                            {scores.map((score, sidx) => (
                              <td key={sidx} className="text-center py-3 px-2 text-muted-foreground">
                                {score}
                              </td>
                            ))}
                            <td className="text-center py-3 px-2 font-semibold text-secondary">{avg.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
