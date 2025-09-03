import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token

    if (process.env.NODE_ENV !== 'development' && token?.waitlistStatus !== 'APPROVED') {
      const response = NextResponse.redirect(new URL('/auth/signin?error=WaitlistRequired', req.url))
      response.cookies.delete('next-auth.session-token')
      response.cookies.delete('__Secure-next-auth.session-token')
      response.cookies.delete('next-auth.csrf-token')
      response.cookies.delete('__Host-next-auth.csrf-token')
      return response
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: ["/chat/:path*"]
}