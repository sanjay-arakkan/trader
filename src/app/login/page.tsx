"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, AlertCircle } from "lucide-react"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "access_denied"
      ? "Your email is not authorized to access this application."
      : null
  )

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const passwordsMatch = registerPassword === confirmPassword && registerPassword.length > 0
  const registerFormValid =
    firstName.trim() &&
    lastName.trim() &&
    registerEmail.trim() &&
    registerPassword.length >= 6 &&
    passwordsMatch

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      setError(error.message)
      toast.error("Login failed", {
        description: error.message,
      })
      setIsLoading(false)
    } else {
      toast.success("Welcome back!", {
        description: "You have been signed in successfully.",
      })
      router.push("/journal")
      router.refresh()
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) {
      setError(error.message)
      toast.error("Registration failed", {
        description: error.message,
      })
      setIsLoading(false)
    } else if (data?.user?.identities?.length === 0) {
      // User already exists
      setError("An account with this email already exists.")
      toast.error("Account exists", {
        description: "An account with this email already exists. Please login instead.",
      })
      setIsLoading(false)
    } else {
      toast.success("Account created!", {
        description: `Welcome ${firstName}! Your account has been created successfully.`,
      })
      router.push("/journal")
      router.refresh()
    }
  }

  return (
    <Card className="ios-shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-[20px]">Welcome</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-[10px] bg-[var(--ios-system-red)]/10 p-3.5 text-[14px] text-[var(--ios-system-red)]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={
                    confirmPassword && !passwordsMatch
                      ? "border-[var(--ios-system-red)] focus:ring-[var(--ios-system-red)]/30"
                      : ""
                  }
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[12px] text-[var(--ios-system-red)]">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !registerFormValid}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-primary ios-shadow">
            <Activity className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-[28px] font-bold text-foreground tracking-[-0.02em]">Trader</h1>
          <p className="text-[15px] text-muted-foreground">Track your trading journey</p>
        </div>

        <Suspense fallback={
          <Card className="ios-shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-[20px]">Loading...</CardTitle>
            </CardHeader>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
