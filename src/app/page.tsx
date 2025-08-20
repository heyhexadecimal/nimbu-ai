"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (session) {
      router.push("/chat")
    } else {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <LoadingSpinner />
    </div>
  )
}