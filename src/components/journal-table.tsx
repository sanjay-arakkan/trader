"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addMonths, isAfter, getISOWeek, isSameDay, startOfDay, addDays, subMonths } from "date-fns"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Pencil, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { journalService, type JournalEntryData, type WeeklyNoteData } from "@/services/journal-service"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface JournalEntry {
  date: Date
  capital: string
  status: string
  profit: string
  brokerage: string
}

interface Config {
  initialCapital: number
  startDate: Date | null
}

export function JournalTable() {
  const [entries, setEntries] = React.useState<Record<string, JournalEntry>>({})
  const [weekNotes, setWeekNotes] = React.useState<Record<string, string>>({})
  const [config, setConfig] = React.useState<Config>({ initialCapital: 0, startDate: null })
  const [editingRow, setEditingRow] = React.useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [isLoading, setIsLoading] = React.useState(false)

  // Load config
  React.useEffect(() => {
    const savedConfig = localStorage.getItem("trader_config")
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      setConfig({
        initialCapital: parseFloat(parsed.initialCapital) || 0,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null
      })
    }
  }, [])

  // Generate days
  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end }).filter(day => {
      if (isWeekend(day)) return false
      // Only show days from or after the start date
      if (config.startDate && startOfDay(day) < startOfDay(config.startDate)) return false
      return true
    })
  }, [currentMonth, config.startDate])

  // Fetch Data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!days.length) return
      const start = days[0]
      const end = days[days.length - 1]
      
      setIsLoading(true)
      try {
        const dbEntries = await journalService.getEntries(start, end)
        const newEntries: Record<string, JournalEntry> = {}
        dbEntries.forEach((e: JournalEntryData) => {
          newEntries[e.date] = {
            date: new Date(e.date),
            capital: e.capital?.toString() || "",
            status: e.status || "",
            profit: e.profit?.toString() || "",
            brokerage: e.brokerage?.toString() || ""
          }
        })
        setEntries(prev => ({ ...prev, ...newEntries }))
      } catch (e) { 
        console.error(e)
        toast.error("Failed to fetch journal entries")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [days])

  const weeks = React.useMemo(() => {
    const groups: Record<string, Date[]> = {}
    days.forEach(day => {
      const weekNum = `${format(day, "yyyy")}-W${getISOWeek(day)}`
      if (!groups[weekNum]) groups[weekNum] = []
      groups[weekNum].push(day)
    })
    return Object.entries(groups).sort((a, b) => a[1][0].getTime() - b[1][0].getTime())
  }, [days])
  
  React.useEffect(() => {
    const fetchNotes = async () => {
      const keys = weeks.map(([k]) => k)
      if (keys.length === 0) return
      try {
        const notesData = await journalService.getWeeklyNotes(keys)
        const notesMap: Record<string, string> = {}
        notesData.forEach((n: WeeklyNoteData) => notesMap[n.week_key] = n.note)
        setWeekNotes(prev => ({...prev, ...notesMap}))
      } catch (e) {
        console.error(e)
      }
    }
    fetchNotes()
  }, [weeks])

  const monthlyTotals = React.useMemo(() => {
    let profit = 0
    let brokerage = 0
    days.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd")
      const entry = entries[dateKey]
      if (entry) {
        profit += parseFloat(entry.profit) || 0
        brokerage += parseFloat(entry.brokerage) || 0
      }
    })
    return { realizedProfit: profit - brokerage, totalBrokerage: brokerage }
  }, [days, entries])


  const calculateValues = (day: Date, entry: JournalEntry | undefined) => {
    let projectedCapital = config.initialCapital
    if (config.startDate && config.initialCapital > 0) {
        let tradingDayIndex = 0
        let current = startOfDay(config.startDate)
        const target = startOfDay(day)
        if (!isAfter(current, target)) { 
             while (isAfter(target, current)) {
                if (!isWeekend(current)) tradingDayIndex++
                current = addDays(current, 1)
             }
             projectedCapital = config.initialCapital * Math.pow(1.01, tradingDayIndex)
        }
    }
    const cap1 = projectedCapital 
    const rawCapital = entry ? parseFloat(entry.capital) : 0
    const rawProfit = entry ? parseFloat(entry.profit) : 0
    const rawBrokerage = entry ? parseFloat(entry.brokerage) : 0
    const manualCapital = isNaN(rawCapital) ? 0 : rawCapital
    const profit = isNaN(rawProfit) ? 0 : rawProfit
    const brokerage = isNaN(rawBrokerage) ? 0 : rawBrokerage
    const target = manualCapital > 0 ? manualCapital * 0.01 : 0
    const maxSL = manualCapital > 0 ? manualCapital * 0.02 : 0
    const maxBrokerage = manualCapital > 0 ? manualCapital * 0.002 : 0
    const netProfit = profit - brokerage
    const profitPercent = manualCapital > 0 ? (netProfit / manualCapital) * 100 : 0
    const brokPercent = profit !== 0 ? (brokerage / profit) * 100 : 0

    return {
      cap1: cap1 > 0 ? cap1.toFixed(0) : "",
      target: target > 0 ? target.toFixed(0) : "",
      maxSL: maxSL > 0 ? maxSL.toFixed(0) : "",
      maxBrokerage: maxBrokerage > 0 ? maxBrokerage.toFixed(0) : "",
      brokPercent: profit !== 0 ? brokPercent.toFixed(2) + "%" : "", 
      profitPercent: manualCapital > 0 ? profitPercent.toFixed(2) + "%" : ""
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "losing": return "bg-red-500"
      case "target_failed": return "bg-orange-500"
      case "market_holiday":
      case "special_occasion": return "bg-gray-500"
      case "target_achieved": return "bg-green-500"
      default: return "bg-transparent"
    }
  }
  
  const getStatusLabel = (status: string) => {
       switch (status) {
      case "losing": return "Losing Day"
      case "target_failed": return "Target Failed"
      case "market_holiday": return "Market Holiday"
      case "special_occasion": return "Special Occasion"
      case "target_achieved": return "Target Achieved"
      default: return ""
    }
  }

  const getWeeklyTotals = (weekDays: Date[]) => {
    let totalProfit = 0
    let totalBrokerage = 0
    weekDays.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd")
      const entry = entries[dateStr]
      if (entry) {
        totalProfit += parseFloat(entry.profit) || 0
        totalBrokerage += parseFloat(entry.brokerage) || 0
      }
    })
    const realizedProfit = totalProfit - totalBrokerage
    return { realizedProfit, totalBrokerage }
  }

  const handleInputChange = (dateStr: string, field: keyof JournalEntry, value: string) => {
    setEntries(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value,
        date: new Date(dateStr) 
      }
    }))
  }

  const toggleEdit = async (dateStr: string) => {
    if (editingRow === dateStr) {
      setIsLoading(true)
      try {
        const entry = entries[dateStr]
        if (entry) {
          const payload: JournalEntryData = {
            date: dateStr,
            capital: entry.capital ? parseFloat(entry.capital) : null,
            status: entry.status || null,
            profit: entry.profit ? parseFloat(entry.profit) : null,
            brokerage: entry.brokerage ? parseFloat(entry.brokerage) : null
          }
          await journalService.upsertEntry(payload)
          toast.success("Row saved")
        }
        setEditingRow(null)
      } catch (e) {
        console.error("Failed to save row", e)
        toast.error("Failed to save row")
      } finally {
        setIsLoading(false)
      }
    } else {
      setEditingRow(dateStr)
    }
  }

  const handlePrevMonth = () => {
    setIsLoading(true)
    if (config.startDate) {
      // Don't allow going to a month entirely before the start date
      const prevMonthStart = startOfMonth(subMonths(currentMonth, 1))
      const configMonthStart = startOfMonth(config.startDate)
      if (prevMonthStart < configMonthStart) {
        setIsLoading(false)
        return
      }
    }
    setCurrentMonth(prev => subMonths(prev, 1))
  }
  const handleNextMonth = () => {
    setIsLoading(true)
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handlePrevMonth}
                    disabled={config.startDate ? startOfMonth(currentMonth) <= startOfMonth(config.startDate) : false}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold w-40 text-center">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="flex gap-8 px-4">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Realized Profit</span>
                    <span className={cn(
                        "text-2xl font-bold",
                        monthlyTotals.realizedProfit > 0 ? "text-green-600" : monthlyTotals.realizedProfit < 0 ? "text-red-600" : ""
                    )}>
                        {monthlyTotals.realizedProfit.toFixed(0)}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Brokerage</span>
                     <span className="text-2xl font-bold">
                        {monthlyTotals.totalBrokerage.toFixed(0)}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="rounded-md border max-h-[75vh] overflow-y-auto relative bg-background">
        <table className="w-full caption-bottom text-sm text-left">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
              <TableHead className="w-[120px] pl-4 font-semibold text-muted-foreground h-10">Day</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Capital</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Capital 1%</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Target</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Max Brokerage</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Max Stoploss</TableHead>
              <TableHead className="w-[180px] font-semibold text-muted-foreground h-10">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Profit</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Brokerage</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Brokerage %</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-10">Profit %</TableHead>
              <TableHead className="w-[50px] font-semibold text-muted-foreground h-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b">
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-24" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-32" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"><Skeleton className="h-4 w-16" /></TableCell>
                   <TableCell className="h-12 py-1"></TableCell>
                </TableRow>
              ))
            ) : (
             weeks.map(([weekKey, weekDays]) => {
              const totals = getWeeklyTotals(weekDays)
              
              return (
              <React.Fragment key={weekKey}>
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const entry = entries[dateStr] || { date: day, capital: "", status: "", profit: "", brokerage: "" }
                  const calculated = calculateValues(day, entry) 
                  const statusColor = getStatusColor(entry.status || "")
                  const isEditing = editingRow === dateStr
                  const isTodayDate = isSameDay(day, new Date())

                  return (
                    <TableRow key={dateStr} className={cn("relative group border-b transition-colors data-[state=selected]:bg-muted", isTodayDate ? "bg-blue-100 dark:bg-blue-900/40" : "hover:bg-muted/50")}>
                      <TableCell className="font-medium whitespace-nowrap pl-4 relative h-12 py-1">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", statusColor)} />
                        {format(day, "EEE, dd MMM")}
                      </TableCell>
                      <TableCell className="h-12 py-1">
                        {isEditing ? (
                            <Input 
                              type="number" 
                              value={entry.capital || ""}
                              onChange={(e) => handleInputChange(dateStr, 'capital', e.target.value)}
                              className="w-24 h-8"
                            />
                        ) : (
                            <span className="text-foreground">{entry.capital}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground h-12 py-1">{calculated.cap1}</TableCell>
                      <TableCell className="text-muted-foreground h-12 py-1">{calculated.target}</TableCell>
                      <TableCell className="text-muted-foreground h-12 py-1">{calculated.maxBrokerage}</TableCell>
                      <TableCell className="text-muted-foreground h-12 py-1">{calculated.maxSL}</TableCell>
                      <TableCell className="h-12 py-1">
                        {isEditing ? (
                            <Select 
                              value={entry.status || ""} 
                              onValueChange={(val) => handleInputChange(dateStr, 'status', val)}
                            >
                              <SelectTrigger className="w-[160px] h-8">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="losing">Losing Day</SelectItem>
                                <SelectItem value="target_achieved">Target Achieved</SelectItem>
                                <SelectItem value="target_failed">Target Failed</SelectItem>
                                <SelectItem value="market_holiday">Market Holiday</SelectItem>
                                <SelectItem value="special_occasion">Special Occasion</SelectItem>
                              </SelectContent>
                            </Select>
                        ) : (
                            <span className="text-foreground">{getStatusLabel(entry.status)}</span>
                        )}
                      </TableCell>
                      <TableCell className="h-12 py-1">
                         {isEditing ? (
                            <Input 
                              type="number" 
                              value={entry.profit || ""}
                              onChange={(e) => handleInputChange(dateStr, 'profit', e.target.value)}
                              className="w-24 h-8"
                            />
                         ) : (
                            <span className="text-foreground">{entry.profit}</span>
                         )}
                      </TableCell>
                      <TableCell className="h-12 py-1">
                        {isEditing ? (
                            <Input 
                              type="number" 
                              value={entry.brokerage || ""}
                              onChange={(e) => handleInputChange(dateStr, 'brokerage', e.target.value)}
                              className="w-24 h-8"
                            />
                        ) : (
                            <span className="text-foreground">{entry.brokerage}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground h-12 py-1">{calculated.brokPercent}</TableCell>
                      <TableCell className={cn(
                        "font-medium h-12 py-1",
                        parseFloat(entry.profit) - parseFloat(entry.brokerage) > 0 ? "text-green-600" : parseFloat(entry.profit) - parseFloat(entry.brokerage) < 0 ? "text-red-600" : ""
                      )}>
                        {calculated.profitPercent}
                      </TableCell>
                      <TableCell className="h-12 py-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-6 w-6 opacity-0 group-hover:opacity-100 transition-none",
                              isLoading && "opacity-0 pointer-events-none"
                            )}
                            onClick={() => toggleEdit(dateStr)}
                            disabled={isLoading}
                        >
                            {isEditing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={12} className="p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-6 text-sm">
                         <div className="flex items-center gap-2">
                           <span className="text-muted-foreground font-medium">Realized Profit:</span>
                           <span className={cn(
                             "font-bold",
                             totals.realizedProfit > 0 ? "text-green-600" : totals.realizedProfit < 0 ? "text-red-600" : ""
                           )}>
                             {totals.realizedProfit.toFixed(0)}
                           </span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-muted-foreground font-medium">Brokerage:</span>
                           <span className="font-bold text-foreground">
                             {totals.totalBrokerage.toFixed(0)}
                           </span>
                         </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                          Weekly Notes & Lessons ({format(weekDays[0], "MMM dd")} - {format(weekDays[weekDays.length - 1], "MMM dd")})
                        </span>
                        <Textarea 
                          placeholder="Write your consolidated notes, emotions, and lessons for this week..." 
                          className="min-h-[80px] resize-y bg-background"
                          value={weekNotes[weekKey] || ""}
                          onChange={(e) => setWeekNotes(prev => ({...prev, [weekKey]: e.target.value}))}
                          onBlur={(e) => journalService.saveWeeklyNote(weekKey, weekDays[0], e.target.value)}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="h-4 bg-transparent border-none hover:bg-transparent pointer-events-none"><TableCell colSpan={12}></TableCell></TableRow>
              </React.Fragment>
            )
            }))}
          </TableBody>
        </table>
      </div>
    </div>
  )
}
