"use client"

import * as React from "react"
import { format, parseISO, getISOWeek, startOfWeek, getISOWeekYear } from "date-fns"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { journalService, type JournalEntryData, type WeeklyNoteData } from "@/services/journal-service"
import { TrendingUp, TrendingDown, Target, Percent, Calendar, Trophy, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

type ChartEntry = {
  date: string
  displayDate: string
  capital: number
  profit: number
  cappedProfit: number
  brokerage: number
  cappedBrokerage: number
  netProfit: number
  cappedNetProfit: number
  status: string
}

type MonthlySummary = {
  month: string
  monthLabel: string
  profit: number
  brokerage: number
  netProfit: number
  cappedNetProfit: number
}

type WeeklySummary = {
  week: string
  weekLabel: string
  profit: number
  brokerage: number
  netProfit: number
  cappedNetProfit: number
}

// Reusable Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "", colorClass = "text-foreground", valueKey }: {
  active?: boolean
  payload?: readonly any[]
  label?: string | number
  prefix?: string
  suffix?: string
  colorClass?: string
  valueKey?: string
}) => {
  if (active && payload && payload.length) {
    const displayValue = valueKey && payload[0].payload[valueKey] !== undefined 
      ? payload[0].payload[valueKey] 
      : payload[0].value;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg ring-1 ring-black/5">
        <div className="mb-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <div className={cn("text-lg font-bold tabular-nums", colorClass)}>
          {prefix}{new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
          }).format(displayValue)}{suffix}
        </div>
      </div>
    )
  }
  return null
}

export default function InsightsPage() {
  const [entries, setEntries] = React.useState<JournalEntryData[]>([])
  const [weeklyNotes, setWeeklyNotes] = React.useState<WeeklyNoteData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [data, notes] = await Promise.all([
          journalService.getAllEntries(),
          journalService.getAllWeeklyNotes()
        ]);
        setEntries(data || [])
        setWeeklyNotes(notes || [])
      } catch (e) {
        console.error("Failed to fetch entries", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Transform data for charts
  const chartData: ChartEntry[] = React.useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return entries
      .filter(e => e.date <= todayStr)
      .map(e => {
        const profit = e.profit || 0;
        const brokerage = e.brokerage || 0;
        const netProfit = profit - brokerage;
        return {
          date: e.date,
          displayDate: format(parseISO(e.date), "MMM dd"),
          capital: e.capital || 0,
          profit,
          cappedProfit: Math.max(-200000, Math.min(200000, profit)),
          brokerage,
          cappedBrokerage: Math.max(0, Math.min(10000, brokerage)),
          netProfit,
          cappedNetProfit: Math.max(-200000, Math.min(200000, netProfit)),
          status: e.status || ""
        }
      })
  }, [entries])

  // Cumulative profit data
  const cumulativeData = React.useMemo(() => {
    let cumulative = 0
    return chartData.map(d => {
      cumulative += d.netProfit
      return { ...d, cumulativeProfit: cumulative }
    })
  }, [chartData])

  // Monthly summary
  const monthlySummary: MonthlySummary[] = React.useMemo(() => {
    const monthMap: Record<string, MonthlySummary> = {}
    const thisMonthStr = format(new Date(), "yyyy-MM");
    entries.forEach(e => {
      const monthKey = e.date.substring(0, 7) // YYYY-MM
      if (monthKey > thisMonthStr) return; // Filter future months
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          monthLabel: format(parseISO(monthKey + "-01"), "MMM yyyy"),
          profit: 0,
          brokerage: 0,
          netProfit: 0,
          cappedNetProfit: 0
        }
      }
      monthMap[monthKey].profit += e.profit || 0
      monthMap[monthKey].brokerage += e.brokerage || 0
      monthMap[monthKey].netProfit += (e.profit || 0) - (e.brokerage || 0)
    })
    return Object.values(monthMap).map(m => ({
      ...m,
      cappedNetProfit: Math.max(-500000, Math.min(500000, m.netProfit))
    })).sort((a, b) => a.month.localeCompare(b.month))
  }, [entries])

  // Weekly summary
  const weeklySummary: WeeklySummary[] = React.useMemo(() => {
    const weekMap: Record<string, WeeklySummary> = {}
    const today = new Date();
    const currentWeekKey = `${getISOWeekYear(today)}-W${getISOWeek(today).toString().padStart(2, '0')}`;
    entries.forEach(e => {
      const date = parseISO(e.date)
      const weekKey = `${getISOWeekYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`
      if (weekKey > currentWeekKey) return; // Filter future weeks
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          week: weekKey,
          weekLabel: format(startOfWeek(date, { weekStartsOn: 1 }), "MMM dd"),
          profit: 0,
          brokerage: 0,
          netProfit: 0,
          cappedNetProfit: 0
        }
      }
      weekMap[weekKey].profit += e.profit || 0
      weekMap[weekKey].brokerage += e.brokerage || 0
      weekMap[weekKey].netProfit += (e.profit || 0) - (e.brokerage || 0)
    })
    return Object.values(weekMap).map(w => ({
      ...w,
      cappedNetProfit: Math.max(-300000, Math.min(300000, w.netProfit))
    })).sort((a, b) => a.week.localeCompare(b.week))
  }, [entries])

  // Weekly funds summary
  const weeklyFundsSummary = React.useMemo(() => {
    return weeklyNotes
      .filter(n => n.add_withdraw_funds != null)
      .map(n => {
        let label = n.week_key;
        if (n.id) {
          const parts = n.id.split('_');
          const dateStr = parts[parts.length - 1];
          if (dateStr && dateStr.length === 8) {
             const parsed = parseISO(`${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`);
             label = format(startOfWeek(parsed, { weekStartsOn: 1 }), "MMM dd");
          }
        }
        const funds = n.add_withdraw_funds || 0;
        return {
          week: n.week_key,
          weekLabel: label,
          funds,
          cappedFunds: Math.max(0, Math.min(150000, funds))
        };
      }).sort((a, b) => a.week.localeCompare(b.week));
  }, [weeklyNotes])

  // Stats calculations
  const stats = React.useMemo(() => {
    const totalProfit = entries.reduce((sum, e) => sum + (e.profit || 0), 0)
    const totalBrokerage = entries.reduce((sum, e) => sum + (e.brokerage || 0), 0)
    const realizedProfit = totalProfit - totalBrokerage
    
    const winDays = entries.filter(e => 
      e.status?.toLowerCase().includes("target_achieved") || 
      e.status?.toLowerCase().includes("target achieved")
    ).length
    const tradingDays = entries.filter(e => 
      e.status && 
      !e.status.toLowerCase().includes("holiday") && 
      !e.status.toLowerCase().includes("no_trade") &&
      !e.status.toLowerCase().includes("no trade") &&
      !e.status.toLowerCase().includes("special")
    ).length
    const winRate = tradingDays > 0 ? (winDays / tradingDays) * 100 : 0
    
    const avgDailyProfit = tradingDays > 0 ? realizedProfit / tradingDays : 0
    
    const netProfits = entries.map(e => (e.profit || 0) - (e.brokerage || 0))
    const bestDayProfit = netProfits.length > 0 ? Math.max(...netProfits) : 0
    const worstDayProfit = netProfits.length > 0 ? Math.min(...netProfits) : 0
    const bestDayIndex = netProfits.indexOf(bestDayProfit)
    const worstDayIndex = netProfits.indexOf(worstDayProfit)
    const bestDay = entries[bestDayIndex]?.date || ""
    const worstDay = entries[worstDayIndex]?.date || ""

    const entryDetails = entries.map(e => ({
        date: e.date,
        netProfit: (e.profit || 0) - (e.brokerage || 0),
        status: e.status
    })).filter(e => {
        const s = e.status?.toLowerCase() || ""
        return !(s.includes("holiday") || s.includes("no_trade") || s.includes("no trade") || s.includes("special"))
    })

    const topWins = [...entryDetails]
        .sort((a, b) => b.netProfit - a.netProfit)
        .slice(0, 5)

    const topLosses = [...entryDetails]
        .sort((a, b) => a.netProfit - b.netProfit)
        .slice(0, 5)

    return { 
      realizedProfit, 
      totalBrokerage, 
      winRate, 
      avgDailyProfit, 
      bestDayProfit, 
      worstDayProfit,
      bestDay,
      worstDay,
      tradingDays,
      topWins,
      topLosses
    }
  }, [entries])

  // Win/Loss streaks
  const streaks = React.useMemo(() => {
    let currentWinStreak = 0
    let currentWinStart = ""
    let currentWinEnd = ""
    let maxWinStreak = 0
    let maxWinStart = ""
    let maxWinEnd = ""

    let currentLossStreak = 0
    let currentLossStart = ""
    let currentLossEnd = ""
    let maxLossStreak = 0
    let maxLossStart = ""
    let maxLossEnd = ""

    let lastStatus: 'win' | 'loss' | null = null

    entries.forEach(e => {
      const status = e.status?.toLowerCase() || ""
      if (status.includes("holiday") || status.includes("no_trade") || status.includes("no trade") || status.includes("special")) {
        return // Skip non-trading days
      }

      const isWin = status.includes("target_achieved") || status.includes("target achieved")
      const isLoss = status.includes("losing") || status.includes("loss")
      
      if (isWin) {
        if (lastStatus === 'win') {
          currentWinStreak++
          currentWinEnd = e.date
        } else {
          currentWinStreak = 1
          currentWinStart = e.date
          currentWinEnd = e.date
          
          currentLossStreak = 0
        }
        lastStatus = 'win'
        
        if (currentWinStreak >= maxWinStreak) {
          maxWinStreak = currentWinStreak
          maxWinStart = currentWinStart
          maxWinEnd = currentWinEnd
        }
      } else if (isLoss) {
        if (lastStatus === 'loss') {
          currentLossStreak++
          currentLossEnd = e.date
        } else {
          currentLossStreak = 1
          currentLossStart = e.date
          currentLossEnd = e.date
          
          currentWinStreak = 0
        }
        lastStatus = 'loss'

        if (currentLossStreak >= maxLossStreak) {
          maxLossStreak = currentLossStreak
          maxLossStart = currentLossStart
          maxLossEnd = currentLossEnd
        }
      }
    })

    return { 
      currentWinStreak, currentLossStreak, 
      maxWinStreak, maxLossStreak, 
      lastStatus,
      maxWinStart, maxWinEnd,
      maxLossStart, maxLossEnd
    }
  }, [entries])

  const formatCurrency = (value: unknown) => {
    if (value === undefined || value === null) return ''
    if (Array.isArray(value)) return ''
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(num)
  }

  if (isLoading) {
    return (
      <div className="px-5 py-6 lg:px-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground text-[15px]">Loading insights...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="px-5 py-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-[34px] font-bold text-foreground tracking-[-0.02em]">Insights</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            No journal entries yet. Add entries in the Journal page to see insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 lg:px-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-[34px] font-bold text-foreground tracking-[-0.02em]">Insights</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Analyze your trading performance with charts and statistics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Realized Profit</CardTitle>
            {stats.realizedProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.realizedProfit >= 0 ? "text-[var(--ios-system-green)]" : "text-[var(--ios-system-red)]"
            )}>
              {formatCurrency(stats.realizedProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.tradingDays} trading days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <Percent className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ios-system-red)]">
              {formatCurrency(stats.totalBrokerage)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total charges & fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Target achieved days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Profit</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.avgDailyProfit >= 0 ? "text-[var(--ios-system-green)]" : "text-[var(--ios-system-red)]"
            )}>
              {formatCurrency(stats.avgDailyProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per trading day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Win Streak & Top Days */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Win Streak Card */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Streak Tracker</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <div className="flex items-center gap-2">
                  {streaks.lastStatus === 'win' ? (
                    <>
                      <Trophy className="h-5 w-5 text-green-500" />
                      <span className="text-xl font-bold text-[var(--ios-system-green)]">{streaks.currentWinStreak} wins</span>
                    </>
                  ) : streaks.lastStatus === 'loss' ? (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      <span className="text-xl font-bold text-red-600">{streaks.currentLossStreak} losses</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Best Streaks</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1">
                        <span className="text-sm text-muted-foreground">Longest winning streak</span>
                        {streaks.maxWinStreak > 0 && (
                          <span className="text-xs text-muted-foreground">
                             ({format(parseISO(streaks.maxWinStart), "MMM dd")} - {format(parseISO(streaks.maxWinEnd), "MMM dd")})
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[var(--ios-system-green)] text-nowrap">{streaks.maxWinStreak} wins</span>
                    </div>
                  </div>
                  <div className="flex flex-col border-b pb-2">
                    <div className="flex justify-between items-center">
                       <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1">
                        <span className="text-sm text-muted-foreground">Longest losing streak</span>
                        {streaks.maxLossStreak > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({format(parseISO(streaks.maxLossStart), "MMM dd")} - {format(parseISO(streaks.maxLossEnd), "MMM dd")})
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[var(--ios-system-red)] text-nowrap">{streaks.maxLossStreak} losses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Days Card */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing Days</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top 5 Wins</p>
                <div className="space-y-2">
                  {stats.topWins.map((win, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{format(parseISO(win.date), "MMM dd")}</span>
                      <span className="font-bold text-[var(--ios-system-green)]">{formatCurrency(win.netProfit)}</span>
                    </div>
                  ))}
                  {stats.topWins.length === 0 && <span className="text-sm text-muted-foreground">-</span>}
                </div>
              </div>
              <div className="space-y-3">
                 <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top 5 Losses</p>
                <div className="space-y-2">
                  {stats.topLosses.map((loss, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{format(parseISO(loss.date), "MMM dd")}</span>
                      <span className="font-bold text-[var(--ios-system-red)]">{formatCurrency(loss.netProfit)}</span>
                    </div>
                  ))}
                  {stats.topLosses.length === 0 && <span className="text-sm text-muted-foreground">-</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capital Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Capital Over Time</CardTitle>
          <CardDescription>Track your capital growth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 70%, 50%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }} position={{ y: 0 }} />
                <Area 
                  type="natural" 
                  dataKey="capital" 
                  stroke="hsl(142, 70%, 50%)" 
                  strokeWidth={2}
                  fill="url(#capitalGradient)" 
                  activeDot={{ r: 4, strokeWidth: 2, className: "fill-background stroke-emerald-500" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Profit Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Profit</CardTitle>
          <CardDescription>Profit per trading day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }}
                  domain={[-200000, 200000]}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  position={{ y: 0 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const isPositive = Number(payload[0].payload.profit) >= 0
                      return (
                        <CustomTooltip 
                          active={active} 
                          payload={payload} 
                          label={label} 
                          valueKey="profit"
                          colorClass={isPositive ? "text-green-600" : "text-red-600"}
                        />
                      )
                    }
                    return null
                  }}
                />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                <Bar dataKey="cappedProfit" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.cappedProfit >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"}
                      stroke={entry.cappedProfit >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"}
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Brokerage Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Charges</CardTitle>
          <CardDescription>Charges costs per trading day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }}
                  domain={[0, 10000]}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  position={{ y: 0 }}
                  content={<CustomTooltip colorClass="text-primary" valueKey="brokerage" />}
                />
                <Bar 
                  dataKey="cappedBrokerage" 
                  fill="hsl(25, 95%, 45%)"
                  stroke="hsl(25, 95%, 45%)"
                  strokeWidth={1}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Profit Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Profit</CardTitle>
          <CardDescription>Running total of realized profit over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <defs>
                   <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  className="text-xs font-medium" 
                  tick={{ fill: 'var(--muted-foreground)' }}
                  tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip 
                  content={<CustomTooltip colorClass="text-green-600" />}
                  cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  position={{ y: 0 }}
                />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                <Area 
                  type="natural" 
                  dataKey="cumulativeProfit" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  fill="url(#cumulativeGradient)" 
                  activeDot={{ r: 4, strokeWidth: 2, className: "fill-background stroke-green-600" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Summary Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Net profit by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySummary}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="weekLabel" 
                    className="text-xs font-medium" 
                    tick={{ fill: 'var(--muted-foreground)' }} 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    className="text-xs font-medium" 
                    tick={{ fill: 'var(--muted-foreground)' }}
                    domain={[-300000, 300000]}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    position={{ y: 0 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                         const isPositive = Number(payload[0].payload.netProfit) >= 0
                         return (
                          <CustomTooltip 
                            active={active} 
                            payload={payload} 
                            label={label}
                            valueKey="netProfit"
                            colorClass={isPositive ? "text-green-600" : "text-red-600"} 
                           />
                         )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                  <Bar 
                    dataKey="cappedNetProfit" 
                    radius={[2, 2, 0, 0]}
                  >
                    {weeklySummary.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cappedNetProfit >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"}
                        stroke={entry.cappedNetProfit >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>Net profit by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySummary}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="monthLabel" 
                    className="text-xs font-medium" 
                    tick={{ fill: 'var(--muted-foreground)' }} 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    className="text-xs font-medium" 
                    tick={{ fill: 'var(--muted-foreground)' }}
                    domain={[-500000, 500000]}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    position={{ y: 0 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                         const isPositive = Number(payload[0].payload.netProfit) >= 0
                         return (
                          <CustomTooltip 
                            active={active} 
                            payload={payload} 
                            label={label}
                            valueKey="netProfit"
                            colorClass={isPositive ? "text-green-600" : "text-red-600"} 
                           />
                         )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                  <Bar 
                    dataKey="cappedNetProfit" 
                    radius={[2, 2, 0, 0]}
                  >
                    {monthlySummary.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cappedNetProfit >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"}
                        stroke={entry.cappedNetProfit >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 40%)"}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Funds Bar Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Add/Withdraw Funds</CardTitle>
            <CardDescription>Capital added or withdrawn by week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyFundsSummary}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="weekLabel" 
                    className="text-xs font-medium" 
                    tick={{ fill: 'var(--muted-foreground)' }} 
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    className="text-xs font-medium" 
                    tick={{ fill: 'var(--muted-foreground)' }}
                    domain={[0, 150000]}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    position={{ y: 0 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                         const isPositive = Number(payload[0].payload.funds) >= 0
                         return (
                          <CustomTooltip 
                            active={active} 
                            payload={payload} 
                            label={label}
                            valueKey="funds"
                            colorClass={isPositive ? "text-green-600" : "text-red-600"} 
                           />
                         )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
                  <Bar 
                    dataKey="cappedFunds" 
                    radius={[2, 2, 0, 0]}
                  >
                    {weeklyFundsSummary.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cappedFunds >= 0 ? "hsl(217, 91%, 60%)" : "hsl(0, 84%, 40%)"}
                        stroke={entry.cappedFunds >= 0 ? "hsl(217, 91%, 60%)" : "hsl(0, 84%, 40%)"}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
