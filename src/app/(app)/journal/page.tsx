"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Pencil, Save, ClipboardList, X, TrendingUp, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { journalService } from "@/services/journal-service"
import { toast } from "sonner"
import { JournalTable } from "@/components/journal-table"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isAfter,
  startOfDay,
} from "date-fns"

// ─── Tooltip — same style as insights page ────────────────────────────────────

const ChartTooltip = ({
  active,
  payload,
  label,
  isPositive,
}: {
  active?: boolean
  payload?: readonly { value: number }[]
  label?: string | number
  isPositive?: boolean
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5">
        <div className="mb-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <div
          className={`text-lg font-bold tabular-nums ${
            isPositive
              ? "text-[var(--ios-system-green)]"
              : "text-[var(--ios-system-red)]"
          }`}
        >
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          }).format(payload[0].value)}
        </div>
      </div>
    )
  }
  return null
}

// ─── Cumulative MTD P&L Card ──────────────────────────────────────────────────

interface ChartPoint {
  displayDate: string
  cumulativeProfit: number
}

function CumulativePnLCard({ selectedMonth }: { selectedMonth: Date }) {
  const [chartData, setChartData] = React.useState<ChartPoint[]>([])
  const [totalPnL, setTotalPnL] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        const today = startOfDay(new Date())
        const start = startOfMonth(selectedMonth)
        const end = endOfMonth(selectedMonth)
        // For past months show all data; for current month only up to today
        const isCurrentMonth =
          format(selectedMonth, "yyyy-MM") === format(today, "yyyy-MM")
        const entries = await journalService.getEntries(start, end)

        const filtered = (entries ?? [])
          .filter((e) => !isCurrentMonth || !isAfter(parseISO(e.date), today))
          .sort((a, b) => a.date.localeCompare(b.date))

        let running = 0
        const points: ChartPoint[] = filtered.map((e) => {
          running += (e.profit ?? 0) - (e.brokerage ?? 0)
          return {
            displayDate: format(parseISO(e.date), "MMM dd"),
            cumulativeProfit: parseFloat(running.toFixed(2)),
          }
        })

        setChartData(points)
        setTotalPnL(running)
      } catch (err) {
        console.error("Failed to load chart data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [selectedMonth])

  const isPositive = totalPnL >= 0
  const strokeColor = isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"
  const gradientColor = isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(v)

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden rounded-[16px] ios-shadow-lg"
      style={{
        background: isPositive
          ? "url('/images/green.avif') center/cover no-repeat"
          : "linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)",
      }}
    >
      <Card
        className="relative flex h-full flex-1 flex-col overflow-hidden rounded-[16px] border border-white/20 bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-md text-white"
      >
        <CardContent className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Monthly Cumulative P&amp;L
            </p>
            <div className="mt-1 h-8">
              {isLoading ? (
                <div className="h-8 w-32 animate-pulse rounded-md bg-white/20"></div>
              ) : (
                <p className="text-[26px] font-bold tracking-tight leading-none text-white">
                  {`${isPositive ? "+" : ""}${formatCurrency(totalPnL)}`}
                </p>
              )}
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              {format(selectedMonth, "MMMM yyyy")} ·{" "}
              {format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")
                ? "up to today"
                : "full month"}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-[160px]">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-[8px] bg-white/10" />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-[13px] text-white/60">No data for this month yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="mtdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gradientColor} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.15)"
                />
                <XAxis
                  dataKey="displayDate"
                  className="text-xs font-medium"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  className="text-xs font-medium"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={44}
                />
                <Tooltip
                  content={<ChartTooltip isPositive={isPositive} />}
                  cursor={{
                    stroke: "rgba(255,255,255,0.4)",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                  position={{ y: 0 }}
                />
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.3)"
                  strokeDasharray="3 3"
                />
                <Area
                  type="natural"
                  dataKey="cumulativeProfit"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill="url(#mtdGradient)"
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "#fff",
                    stroke: strokeColor,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Journal Page ──────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [planContent, setPlanContent] = React.useState("")
  const [draftContent, setDraftContent] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)
  const [isPlanLoading, setIsPlanLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  React.useEffect(() => {
    const loadPlan = async () => {
      try {
        const plan = await journalService.getPlan()
        setPlanContent(plan)
      } catch (e) {
        console.error("Failed to load plan:", e)
      } finally {
        setIsPlanLoading(false)
      }
    }
    loadPlan()
  }, [])

  const handleEdit = () => {
    setDraftContent(planContent)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setDraftContent("")
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await journalService.savePlan(draftContent)
      setPlanContent(draftContent)
      setIsEditing(false)
      toast.success("Plan saved.")
    } catch (e) {
      console.error("Failed to save plan:", e)
      toast.error("Failed to save plan")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-5 py-6 lg:px-8">
      {/* iOS Large Title */}
      <div className="mb-6">
        <h1 className="text-[34px] font-bold text-foreground tracking-[-0.02em]">Journal</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Your trading plan, daily trades, and weekly lessons.
        </p>
      </div>

      {/* Top Row: Plan card + P&L chart side-by-side */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">

        {/* Plan Card — 50% on desktop */}
        <div className="flex h-[320px] w-full flex-col md:w-1/2">
          {isPlanLoading ? (
            <div
              className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[16px] ios-shadow-lg"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect x='60' y='60' width='40' height='60' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Crect x='70' y='40' width='30' height='20' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Crect x='40' y='80' width='20' height='40' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='2'/%3E%3Crect x='100' y='70' width='20' height='50' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='2'/%3E%3Crect x='80' y='80' width='10' height='10' fill='rgba(255,255,255,0.2)'/%3E%3Crect x='50' y='90' width='10' height='10' fill='rgba(255,255,255,0.15)'/%3E%3Crect x='110' y='90' width='10' height='10' fill='rgba(255,255,255,0.15)'/%3E%3C/svg%3E"), linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)`,
                backgroundPosition: "bottom right, center",
                backgroundRepeat: "no-repeat, no-repeat",
              }}
            >
              <Card className="relative z-10 flex h-full flex-1 flex-col overflow-hidden rounded-[16px] border border-white/20 bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-md">
                <CardContent className="flex flex-1 flex-col justify-center space-y-4 p-5 lg:p-6">
                  <div className="h-6 w-3/4 animate-pulse rounded-md bg-white/20"></div>
                  <div className="h-4 w-full animate-pulse rounded-md bg-white/20"></div>
                  <div className="h-4 w-5/6 animate-pulse rounded-md bg-white/20"></div>
                  <div className="h-4 w-2/3 animate-pulse rounded-md bg-white/20"></div>
                </CardContent>
              </Card>
            </div>
          ) : isEditing ? (
            <div
              className="relative flex h-full flex-col overflow-hidden rounded-[16px] ios-shadow-lg"
              style={{
                backgroundImage: `linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)`,
              }}
            >
              <Card className="relative flex h-full flex-col overflow-hidden rounded-[16px] border border-white/20 bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-md">
              <button
                onClick={draftContent !== planContent ? handleSave : handleCancel}
                disabled={isSaving}
                className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all duration-200 hover:bg-secondary/80 disabled:opacity-50"
                aria-label={draftContent !== planContent ? "Save plan" : "Cancel edit"}
              >
                {draftContent !== planContent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
              <CardContent className="flex h-full flex-1 flex-col p-0">
                <textarea
                  id="plan-editor"
                  className="w-full flex-1 resize-none border-none bg-transparent p-5 pt-14 font-mono text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder={"Write your trading plan using Markdown...\n\n# My Trading Plan\n\n## Rules\n- Rule 1\n- Rule 2\n\n## Strategy\nDescribe your strategy here..."}
                  autoFocus
                />
              </CardContent>
              </Card>
            </div>
          ) : (
            <div
              className="group relative flex h-full flex-col overflow-hidden rounded-[16px] ios-shadow-lg"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect x='60' y='60' width='40' height='60' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Crect x='70' y='40' width='30' height='20' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Crect x='40' y='80' width='20' height='40' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='2'/%3E%3Crect x='100' y='70' width='20' height='50' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='2'/%3E%3Crect x='80' y='80' width='10' height='10' fill='rgba(255,255,255,0.2)'/%3E%3Crect x='50' y='90' width='10' height='10' fill='rgba(255,255,255,0.15)'/%3E%3Crect x='110' y='90' width='10' height='10' fill='rgba(255,255,255,0.15)'/%3E%3C/svg%3E"), linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)`,
                backgroundPosition: "bottom right, center",
                backgroundRepeat: "no-repeat, no-repeat",
              }}
            >
              <Card
                className="relative flex h-full flex-col overflow-hidden rounded-[16px] border border-white/20 bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-md text-white"
              >
              <button
                onClick={handleEdit}
                className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-all duration-200 hover:bg-white/30 group-hover:opacity-100"
                aria-label="Edit plan"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <CardContent className="relative z-10 flex flex-1 flex-col overflow-y-auto p-5 lg:p-6">
                {planContent ? (
                  <div className="prose prose-invert max-w-none [&_*]:border-white/20 [&_*]:text-white">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{planContent}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center text-white/80">
                    <ClipboardList className="mb-2 h-8 w-8 opacity-50" />
                    <p className="mb-4 text-[15px] font-medium">No trading plan yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      onClick={handleEdit}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Create Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* P&L Chart Card — 50% on desktop */}
        <div className="flex h-[320px] w-full flex-col md:w-1/2">
          <CumulativePnLCard selectedMonth={currentMonth} />
        </div>
      </div>

      {/* Journal Table */}
      <JournalTable currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
    </div>
  )
}
