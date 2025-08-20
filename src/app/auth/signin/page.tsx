"use client"

import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function SignIn() {
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push("/chat")
      }
    })
  }, [router])

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/chat" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-muted">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-accent/10 transition-all duration-200"
            onClick={() => window.open("https://github.com/heyhexadecimal/nimbu-ai", "_blank")}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div className="space-y-2">

            <h1 className="text-5xl font-bold tracking-tight text-foreground">Nimbu AI</h1>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto">
              Your intelligent workspace assistant
            </p>
          </div>

        </div>

        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 space-y-2">
            <CardTitle className="text-xl font-semibold">Get Started</CardTitle>
            <CardDescription className="text-base">Connect with Google to unlock your AI assistant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleSignIn}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              size="lg"
            >
              <Image
                src='https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png'
                width={32}
                height={32}
                alt="Google Logo"

              />
              Continue with Google
            </Button>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Open Source</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Free</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed px-4">
                By continuing, you agree to our Terms of Service and Privacy Policy. Your data stays secure and private.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-foreground">Try saying:</p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground italic">
            "Hey Nimbu, schedule a meeting with John tomorrow at 3 PM and send him the invite"
          </div>
        </div>
      </div>
    </div>
  )
}
