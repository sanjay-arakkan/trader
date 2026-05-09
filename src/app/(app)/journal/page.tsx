"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Pencil, Save, ClipboardList, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { journalService } from "@/services/journal-service"
import { toast } from "sonner"
import { JournalTable } from "@/components/journal-table"

export default function JournalPage() {
  const [planContent, setPlanContent] = React.useState("")
  const [draftContent, setDraftContent] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)
  const [isPlanLoading, setIsPlanLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

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

      {/* Plan Section */}
      <div className="mb-6 w-full md:w-1/2">
        {isPlanLoading ? (
          <div className="h-28 animate-pulse rounded-[14px] bg-[var(--ios-fill-tertiary)]" />
        ) : isEditing ? (
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
              <textarea
                id="plan-editor"
                className="min-h-[40vh] w-full resize-y rounded-[10px] border border-border bg-background p-4 font-mono text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder={"Write your trading plan using Markdown...\n\n# My Trading Plan\n\n## Rules\n- Rule 1\n- Rule 2\n\n## Strategy\nDescribe your strategy here..."}
                autoFocus
              />
            </CardContent>
          </Card>
        ) : planContent ? (
          <Card 
            className="group relative overflow-hidden border-none text-white shadow-lg ios-shadow-lg"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect x='60' y='60' width='40' height='60' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Crect x='70' y='40' width='30' height='20' fill='none' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Crect x='40' y='80' width='20' height='40' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='2'/%3E%3Crect x='100' y='70' width='20' height='50' fill='none' stroke='rgba(255,255,255,0.15)' stroke-width='2'/%3E%3Crect x='80' y='80' width='10' height='10' fill='rgba(255,255,255,0.2)'/%3E%3Crect x='50' y='90' width='10' height='10' fill='rgba(255,255,255,0.15)'/%3E%3Crect x='110' y='90' width='10' height='10' fill='rgba(255,255,255,0.15)'/%3E%3C/svg%3E"), linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)`,
              backgroundPosition: 'bottom right, center',
              backgroundRepeat: 'no-repeat, no-repeat',
            }}
          >
            <button
              onClick={handleEdit}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-all duration-200 hover:bg-white/30 group-hover:opacity-100"
              aria-label="Edit plan"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <CardContent className="p-5 lg:p-6 relative z-10">
              <div className="prose prose-invert max-w-none [&_*]:text-white [&_*]:border-white/20">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {planContent}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-[var(--ios-separator-opaque)]">
            <CardContent className="flex flex-col items-center justify-center py-14">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary/10">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mb-1.5 text-[17px] font-semibold text-foreground">
                No plan yet
              </h2>
              <p className="mb-5 max-w-md text-center text-[14px] text-muted-foreground">
                Create your trading plan to define your rules, strategy, and risk
                management guidelines. Supports Markdown formatting.
              </p>
              <Button onClick={handleEdit}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Create Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Journal Table */}
      <JournalTable />
    </div>
  )
}
