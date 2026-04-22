"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Pencil, Save, ClipboardList, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { journalService } from "@/services/journal-service"
import { toast } from "sonner"

export default function PlanPage() {
  const [content, setContent] = React.useState("")
  const [draftContent, setDraftContent] = React.useState("")
  const [isEditing, setIsEditing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const loadPlan = async () => {
      try {
        const plan = await journalService.getPlan()
        setContent(plan)
      } catch (e) {
        console.error("Failed to load plan:", e)
      } finally {
        setIsLoading(false)
      }
    }
    loadPlan()
  }, [])

  const handleEdit = () => {
    setDraftContent(content)
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
      setContent(draftContent)
      setIsEditing(false)
      toast.success("Plan saved.")
    } catch (e) {
      console.error("Failed to save plan:", e)
      toast.error("Failed to save plan")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan</h1>
          <p className="mt-2 text-muted-foreground">
            Your trading plan and strategy notes
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <Card>
          <CardContent className="p-4">
            <textarea
              id="plan-editor"
              className="min-h-[60vh] w-full resize-y rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write your trading plan using Markdown...&#10;&#10;# My Trading Plan&#10;&#10;## Rules&#10;- Rule 1&#10;- Rule 2&#10;&#10;## Strategy&#10;Describe your strategy here..."
              autoFocus
            />
          </CardContent>
        </Card>
      ) : content ? (
        <Card>
          <CardContent className="p-6 lg:p-8">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              No plan yet
            </h2>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Create your trading plan to define your rules, strategy, and risk
              management guidelines. Supports Markdown formatting.
            </p>
            <Button onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
