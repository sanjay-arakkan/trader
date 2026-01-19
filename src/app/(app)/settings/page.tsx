"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Settings, Sun, Moon, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { journalService } from "@/services/journal-service"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
    
    // Sync theme with database if possible
    const syncTheme = async () => {
        const settings = await journalService.getSettings()
        if (settings?.theme) {
            setTheme(settings.theme)
        }
    }
    syncTheme()
  }, [setTheme])

  const handleThemeChange = async (newTheme: string) => {
      setTheme(newTheme)
      try {
          await journalService.updateSettings({ theme: newTheme })
      } catch (e) {
          console.error("Failed to sync theme to DB", e)
      }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Customize your trading dashboard experience
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Trading Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Trading Configuration</CardTitle>
                <CardDescription>
                  Set your initial capital and starting date for projections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ConfigurationForm />
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>
                  Customize how the app looks on your device
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-sm font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex h-auto flex-col items-center gap-2 py-4"
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex h-auto flex-col items-center gap-2 py-4"
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex h-auto flex-col items-center gap-2 py-4"
                  onClick={() => handleThemeChange("system")}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select your preferred theme. System will match your device settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { toast } from "sonner"

function ConfigurationForm() {
  const [initialCapital, setInitialCapital] = React.useState("")
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [savedConfig, setSavedConfig] = React.useState<{ initialCapital: string, startDate: string }>({ initialCapital: "", startDate: "" })

  React.useEffect(() => {
    const loadConfig = async () => {
        // Try DB first
        const settings = await journalService.getSettings()
        if (settings) {
            const initialCapital = settings.initial_capital?.toString() || ""
            const startDateStr = settings.start_date || ""
            setInitialCapital(initialCapital)
            if (startDateStr) setStartDate(new Date(startDateStr))
            setSavedConfig({ initialCapital, startDate: startDateStr })
            // Back-fill localStorage
            localStorage.setItem("trader_config", JSON.stringify({ initialCapital, startDate: startDateStr }))
            return
        }

        // Fallback to localStorage
        const configStr = localStorage.getItem("trader_config")
        if (configStr) {
          const config = JSON.parse(configStr)
          const initialCapital = config.initialCapital || ""
          const startDateStr = config.startDate || ""
          setInitialCapital(initialCapital)
          if (startDateStr) {
              setStartDate(new Date(startDateStr))
          }
          setSavedConfig({ initialCapital, startDate: startDateStr })
        }
    }
    loadConfig()
  }, [])

  const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : ""
  const hasChanges = initialCapital !== savedConfig.initialCapital || startDateStr !== savedConfig.startDate

  const handleSave = async () => {
    const newConfig = { initialCapital, startDate: startDateStr }
    
    try {
        // Persist to DB
        await journalService.updateSettings({
            initial_capital: parseFloat(initialCapital) || 0,
            start_date: startDateStr
        })
        
        // Update local state
        localStorage.setItem("trader_config", JSON.stringify(newConfig))
        setSavedConfig(newConfig)
        toast.success("Configuration saved and synced!")
    } catch (e) {
        console.error("Failed to save settings", e)
        toast.error("Failed to sync settings to database")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capital">Initial Capital</Label>
          <Input 
            id="capital"
            type="number" 
            placeholder="e.g. 100000" 
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-date">Starting Date</Label>
          <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Button 
        onClick={handleSave} 
        disabled={!hasChanges}
        className="w-full md:w-auto"
      >
        Save Configuration
      </Button>
    </div>
  )
}
