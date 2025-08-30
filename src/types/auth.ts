import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    userId?: string
    waitlistStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    userId?: string
    waitlistStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null
  }
}