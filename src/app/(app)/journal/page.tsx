import { BookOpen, PenLine, Calendar, Heart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function JournalPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Journal</h1>
        <p className="mt-2 text-muted-foreground">
          Document your trading emotions and lessons learned
        </p>
      </div>

      {/* Placeholder content */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Trading Journal Coming Soon</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            This page will feature a rich text editor for recording your thoughts,
            emotions, and lessons learned from each trading session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <PenLine className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Rich Text Editor</p>
                <p className="text-xs text-muted-foreground">Format your notes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Emotional Tracking</p>
                <p className="text-xs text-muted-foreground">Mood indicators</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <Calendar className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Date Organization</p>
                <p className="text-xs text-muted-foreground">Daily entries</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
