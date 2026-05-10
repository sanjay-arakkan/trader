import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's name from metadata
  const firstName = user.user_metadata?.first_name || ""
  const lastName = user.user_metadata?.last_name || ""
  const userName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : user.email || "User"

  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar userName={userName} />
      <main className="flex-1 bg-background px-4 md:px-8">
        {children}
      </main>
    </div>
  )
}
