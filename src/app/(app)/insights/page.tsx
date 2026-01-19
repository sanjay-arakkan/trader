import { Lightbulb, BarChart3, Target, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InsightsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Insights</h1>
        <p className="mt-2 text-muted-foreground">
          Analyze your performance with charts and statistics
        </p>
      </div>

      {/* Placeholder content */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Insights Dashboard Coming Soon</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            This page will display comprehensive analytics including win-rate charts,
            profit distribution, and performance metrics over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <BarChart3 className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Win Rate Charts</p>
                <p className="text-xs text-muted-foreground">Success tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Equity Curve</p>
                <p className="text-xs text-muted-foreground">Growth over time</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Goal Tracking</p>
                <p className="text-xs text-muted-foreground">Hit your targets</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
