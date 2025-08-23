
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { AppPermissionService } from '@/services/app-permission.service'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/apps?error=access_denied`)
        }

        if (!code || !state) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/apps?error=invalid_request`)
        }

        const { appId, userId } = JSON.parse(state)

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            `${process.env.NEXTAUTH_URL}/api/auth/callback/google-app`
        )

        const { tokens } = await oauth2Client.getToken(code)

        if (!tokens.access_token || !tokens.refresh_token) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/apps?error=token_error`)
        }

        const appPermissionService = new AppPermissionService()
        await appPermissionService.storeAppPermission(
            userId,
            appId,
            tokens.access_token,
            tokens.refresh_token,
            tokens.expiry_date || 0,
            tokens.scope?.split(' ') || []
        )

        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/chat?connected=${appId}`)
    } catch (error) {
        console.error('Error handling Google app callback:', error)
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/chat?error=callback_error`)
    }
}