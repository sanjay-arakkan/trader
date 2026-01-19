import { JournalTable } from "@/components/journal-table"

export default function JournalPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Journal</h1>
        <p className="mt-2 text-muted-foreground">
          Track your daily trades, manage capital, and record your weekly lessons.
        </p>
      </div>

      <JournalTable />
    </div>
  )
}
