"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  getSubjectStats,
  getStudentStats,
  getTopPerformer,
  type SubjectStat,
  type StudentStat,
  type TopPerformer,
  SubjectExtremes,
  getSubjectExtremes,
} from "@/lib/spi"

// Sample student data (fallback if API fails)
const sampleStudentData = [
  { name: "Alex Johnson", math: 92, science: 88, english: 85, history: 90 },
  { name: "Sarah Chen", math: 95, science: 93, english: 91, history: 94 },
  { name: "Marcus Williams", math: 78, science: 82, english: 88, history: 85 },
  { name: "Emma Davis", math: 88, science: 90, english: 92, history: 89 },
  { name: "James Brown", math: 85, science: 87, english: 84, history: 82 },
  { name: "Olivia Wilson", math: 91, science: 89, english: 93, history: 91 },
]

const SUBJECTS = ["math", "science", "english", "history"]

export default function AcademicDashboard() {
  // Live data from backend
  const [subjects, setSubjects] = useState<SubjectStat[]>([])
  const [students, setStudents] = useState<StudentStat[]>([])
  const [top, setTop] = useState<TopPerformer | null>(null)
  const [extremes, setExtremes] = useState<SubjectExtremes | null>(null) // <-- add
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const [subStats, stuStats, tp, ext] = await Promise.all([
          getSubjectStats(),
          getStudentStats(),
          getTopPerformer().catch(() => null),
          getSubjectExtremes().catch(() => null),   // <-- add
        ])
        if (!isMounted) return
        setSubjects(subStats)
        setStudents(stuStats)
        setTop(tp)
        setExtremes(ext)                            // <-- add
      } catch (e: any) {
        if (!isMounted) return
        setError(e?.message ?? "Failed to load stats")
        // Fallback to sample data
        setSubjects(calculateSampleSubjectStats())
        setStudents(calculateSampleStudentStats())
        setTop(calculateSampleTopPerformer())
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  // ✅ Fixed version — includes min, max, count
  const calculateSampleSubjectStats = (): SubjectStat[] => {
  return SUBJECTS.map(subject => {
    const scores = sampleStudentData.map(s => s[subject as keyof typeof sampleStudentData[0]] as number)
    const sorted = [...scores].sort((a, b) => a - b)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const variance = scores.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / scores.length
    const stddev = Math.sqrt(variance)

    return {
      subject,
      mean: Number(mean.toFixed(2)),   // ✅ ensure it's numeric
      median,
      stddev: Number(stddev.toFixed(2)), // ✅ ensure it's numeric
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: scores.length,
    }
  })
}


  const calculateSampleStudentStats = (): StudentStat[] => {
  return sampleStudentData.map(student => {
    const scores = Object.values(student).slice(1) as number[]
    const sorted = [...scores].sort((a, b) => a - b)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const variance = scores.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / scores.length
    const stddev = Math.sqrt(variance)

    return {
      student: student.name,
      mean: Number(mean.toFixed(2)),
      median,
      stddev: Number(stddev.toFixed(2)),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      count: scores.length,
    }
  })
}


  const calculateSampleTopPerformer = (): TopPerformer => {
    const studentAverages = sampleStudentData.map(student => {
      const scores = Object.values(student).slice(1) as number[]
      const average = scores.reduce((a, b) => a + b, 0) / scores.length
      return { name: student.name, average }
    }).sort((a, b) => b.average - a.average)

    return {
      student: studentAverages[0].name,
      average: studentAverages[0].average,
    }
  }

  // Chart-only shape (subset of SubjectStat)
  type SubjectChartDatum = {
    subject: string
    mean: number
    median: number
    stddev: number
  }

  const subjectStatsChart: SubjectChartDatum[] = useMemo(
    () =>
      subjects.map((s) => ({
        subject: s.subject.charAt(0).toUpperCase() + s.subject.slice(1),
        mean: typeof s.mean === "number" ? s.mean : Number(s.mean),
        median: s.median,
        stddev: typeof s.stddev === "number" ? s.stddev : Number(s.stddev),
      })),
    [subjects]
  )

  // Safely compute highest/lowest performing subject (fallback if extremes is null)
  const bestSubject = useMemo<SubjectChartDatum | null>(() => {
    if (!subjectStatsChart.length) return null
    return subjectStatsChart.reduce((prev, curr) => (prev.mean > curr.mean ? prev : curr))
  }, [subjectStatsChart])

  const worstSubject = useMemo<SubjectChartDatum | null>(() => {
    if (!subjectStatsChart.length) return null
    return subjectStatsChart.reduce((prev, curr) => (prev.mean < curr.mean ? prev : curr))
  }, [subjectStatsChart])

  const highestSubjectName = extremes?.highest_subject?.subject ?? bestSubject?.subject ?? "—"
  const lowestSubjectName = extremes?.lowest_subject?.subject ?? worstSubject?.subject ?? "—"

  const studentAverages = useMemo(
    () =>
      students
        .map((s) => ({ name: s.student, average: Number(s.mean) }))
        .sort((a, b) => b.average - a.average),
    [students]
  )

  const classAverage = useMemo(
    () =>
      studentAverages.length
        ? studentAverages.reduce((a, s) => a + s.average, 0) / studentAverages.length
        : 0,
    [studentAverages]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-destructive">Error: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pt-6">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <h1 className="text-4xl font-bold text-foreground">Academic Performance Analysis</h1>
          </div>
          <p className="text-muted-foreground text-lg">Comprehensive student performance insights and statistics</p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{students.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{subjects.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Class Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{classAverage.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary/60 bg-gradient-to-br from-card to-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-primary truncate">{top?.student ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Avg: {top ? top.average.toFixed(1) : "—"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Subject Statistics
            </TabsTrigger>
            <TabsTrigger
              value="rankings"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Top Students
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Cards */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Subject Metrics</h3>
                {subjects.map((s) => (
                  <Card key={s.subject} className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base capitalize flex items-center gap-2">
                        <div className="w-2 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                        {s.subject}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Mean</span>
                        <span className="font-semibold text-primary">{Number(s.mean).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Median</span>
                        <span className="font-semibold text-secondary">{s.median}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Std Dev</span>
                        <span className="font-semibold text-accent">{Number(s.stddev).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bar Chart */}
              <Card className="bg-card border-primary/10">
                <CardHeader>
                  <CardTitle>Mean Scores by Subject</CardTitle>
                  <CardDescription>Average performance across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectStatsChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                      />
                      <Bar dataKey="mean" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 Students */}
              <Card className="bg-card border-primary/10">
                <CardHeader>
                  <CardTitle>Top 5 Students</CardTitle>
                  <CardDescription>Ranked by overall average</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentAverages.slice(0, 5).map((student, idx) => (
                      <div
                        key={student.name}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-foreground">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{student.name}</p>
                          </div>
                        </div>
                        <span className="font-bold text-primary text-lg">{student.average.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ranking Chart */}
              <Card className="bg-card border-primary/10">
                <CardHeader>
                  <CardTitle>Student Rankings</CardTitle>
                  <CardDescription>Overall performance distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentAverages} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" stroke="var(--color-muted-foreground)" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        stroke="var(--color-muted-foreground)"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                      />
                      <Bar dataKey="average" fill="var(--color-secondary)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Comparison */}
              <Card className="bg-card border-primary/10">
                <CardHeader>
                  <CardTitle>Subject Difficulty</CardTitle>
                  <CardDescription>Mean vs Standard Deviation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={subjectStatsChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="subject" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mean"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-primary)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="stdDev"
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-accent)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-card border-primary/10">
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key insights and findings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                    {/* Highest Performing Subject */}
                    <p className="text-sm font-semibold text-foreground mb-1">Highest Performing Subject</p>
                    <p className="text-lg font-bold text-primary">
                      {highestSubjectName}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg border border-secondary/20">
                    <p className="text-sm font-semibold text-foreground mb-1">Class Average</p>
                    <p className="text-lg font-bold text-secondary">{classAverage.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
                    <p className="text-sm font-semibold text-foreground mb-1">Top Performer</p>
                    <p className="text-sm text-accent font-semibold">{studentAverages[0]?.name || "—"}</p>
                    <p className="text-lg font-bold text-accent">{studentAverages[0]?.average.toFixed(2) || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}