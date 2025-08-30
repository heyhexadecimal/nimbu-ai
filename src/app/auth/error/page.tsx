"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, ArrowLeft } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorDetails = () => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have access to this application.',
          message: 'This tool is currently in limited access mode. You need to be approved on our waitlist to use it.',
          icon: '🔒',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'WaitlistRequired':
        return {
          title: 'Waitlist Access Required',
          description: 'You need to be approved on our waitlist.',
          message: 'This application is currently in beta and requires waitlist approval before access.',
          icon: '⏳',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        }
      case 'Configuration':
        return {
          title: 'Configuration Error',
          description: 'There is a problem with the server configuration.',
          message: 'Please contact support if this problem persists.',
          icon: '⚙️',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          message: 'Please contact an administrator if you believe this is an error.',
          icon: '🚫',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          title: 'Authentication Error',
          description: 'An error occurred during authentication.',
          message: 'Please try again or contact support if the problem persists.',
          icon: '❌',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const errorDetails = getErrorDetails()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">{errorDetails.icon}</span>
          </div>
          <CardTitle className={`text-2xl font-bold ${errorDetails.color}`}>
            {errorDetails.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {errorDetails.message}
          </p>
          
          <div className="space-y-3">
            {error === 'AccessDenied' || error === 'WaitlistRequired' ? (
              <>
                <Button asChild className="w-full" size="lg">
                  <Link href="https://nimbuai.com" target="_blank" rel="noopener noreferrer">
                    Request Early Access
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/signin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/signin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            )}
          </div>
          
          {error === 'AccessDenied' || error === 'WaitlistRequired' && (
            <p className="text-xs text-center text-muted-foreground">
              Already requested access? Check your email for approval status.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
