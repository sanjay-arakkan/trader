"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Settings, Sun, Moon, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

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
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex h-auto flex-col items-center gap-2 py-4"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex h-auto flex-col items-center gap-2 py-4"
                  onClick={() => setTheme("system")}
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
  const [startDate, setStartDate] = React.useState("")
  const [savedConfig, setSavedConfig] = React.useState({ initialCapital: "", startDate: "" })

  React.useEffect(() => {
    const configStr = localStorage.getItem("trader_config")
    if (configStr) {
      const config = JSON.parse(configStr)
      const initialCapital = config.initialCapital || ""
      const startDate = config.startDate || ""
      setInitialCapital(initialCapital)
      setStartDate(startDate)
      setSavedConfig({ initialCapital, startDate })
    }
  }, [])

  const hasChanges = initialCapital !== savedConfig.initialCapital || startDate !== savedConfig.startDate

  const handleSave = () => {
    const newConfig = { initialCapital, startDate }
    localStorage.setItem("trader_config", JSON.stringify(newConfig))
    setSavedConfig(newConfig)
    toast.success("Configuration saved successfully!")
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
          <Input 
            id="start-date"
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
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
