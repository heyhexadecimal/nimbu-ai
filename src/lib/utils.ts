import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function refreshClientToken(): Promise<{ success: boolean; userId?: string; accessToken?: string; expiresAt?: number }> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error refreshing client token:', error)
    return { success: false }
  }
}

export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true
  return Date.now() > expiresAt - 300000
}
