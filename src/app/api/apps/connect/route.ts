import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AppPermissionService } from '@/services/app-permission.service'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { appId } = await req.json()
        if (!appId) {
            return NextResponse.json({ error: 'App ID is required' }, { status: 400 })
        }

        const appPermissionService = new AppPermissionService()
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google-app`

        const authUrl = appPermissionService.generateAppOAuthUrl(
            appId,
            session.userId,
            redirectUri
        )

        return NextResponse.json({ authUrl })
    } catch (error) {
        console.error('Error generating connect URL:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}