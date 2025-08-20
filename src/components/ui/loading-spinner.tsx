import { Loader2 } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )
}