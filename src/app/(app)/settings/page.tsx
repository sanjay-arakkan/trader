"use client"

import { useTheme } from "next-themes"
import { Settings, Sun, Moon, Monitor } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Customize your trading dashboard experience
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
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

        {/* Account Info - Future placeholder */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Account Settings</CardTitle>
            <CardDescription>
              Additional account settings will be available here soon
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
