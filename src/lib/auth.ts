import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

// Function to refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    )

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date!,
      refreshToken: refreshToken, // Keep the same refresh token
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw new Error('Failed to refresh access token')
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly"

          ].join(" "),
          access_type: "offline",
          prompt: "consent"

        }
      },
      httpOptions: {
        timeout: 30000
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, trigger, user }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.userId = user?.id
        return token
      }

      // Ensure userId is preserved in subsequent calls
      if (!token.userId && user?.id) {
        token.userId = user.id
      }

      // Check if access token has expired
      if (token.expiresAt && typeof token.expiresAt === 'number' && Date.now() > token.expiresAt - 60000) { // Refresh 1 minute before expiry
        try {
          if (token.refreshToken) {
            const refreshedTokens = await refreshAccessToken(token.refreshToken as string)
            token.accessToken = refreshedTokens.accessToken
            token.expiresAt = refreshedTokens.expiresAt
            token.refreshToken = refreshedTokens.refreshToken
          }
        } catch (error) {
          console.error('Failed to refresh token:', error)
          // Clear expired tokens
          token.accessToken = undefined
          token.refreshToken = undefined
          token.expiresAt = undefined
        }
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.expiresAt = token.expiresAt as number
      session.userId = token.userId as string
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt"
  }
}