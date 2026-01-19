import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

export type JournalEntryData = {
  id?: string // YYYYMMDD
  date: string // ISO date string YYYY-MM-DD
  capital: number | null
  status: string | null
  profit: number | null
  brokerage: number | null
}

export type WeeklyNoteData = {
  id?: string // YYYYMMDD (Monday)
  week_key: string
  note: string
}

const supabase = createClient()

export const journalService = {
  async getEntries(startDate: Date, endDate: Date) {
    const startStr = format(startDate, "yyyy-MM-dd")
    const endStr = format(endDate, "yyyy-MM-dd")
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr)

    if (error) {
      console.error('Error fetching entries:', error)
      return []
    }
    return data
  },

  async upsertEntry(entry: JournalEntryData) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // ID is date without dashes: 2026-01-19 -> 20260119
    const id = entry.date.replace(/-/g, '')

    const payload = {
      ...entry,
      id,
      user_id: user.id,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('Error saving entry:', error)
      throw error
    }
    return data
  },

  async getWeeklyNotes(weekKeys: string[]) {
    if (weekKeys.length === 0) return []
    
    const { data, error } = await supabase
      .from('weekly_journal_notes')
      .select('*')
      .in('week_key', weekKeys)

    if (error) {
      console.error('Error fetching notes:', error)
      return []
    }
    return data
  },

  async saveWeeklyNote(weekKey: string, mondayDate: Date, note: string) {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return null

     const id = format(mondayDate, "yyyyMMdd")

     const payload = {
         id,
         week_key: weekKey,
         note,
         user_id: user.id,
         updated_at: new Date().toISOString()
     }

     const { data, error } = await supabase
       .from('weekly_journal_notes')
       .upsert(payload, { onConflict: 'id' })
       .select()
       .single()
    
    if (error) {
      console.error('Error saving note:', error)
      throw error
    }
    return data
  }
}
