import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to refresh access token
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

// Check if token is expired or will expire soon
export function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return true
  // Consider token expired if it expires in the next 5 minutes
  return Date.now() > expiresAt - 300000
}
