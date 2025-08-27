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
        await appPermissionService.disconnectApp(session.userId, appId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error disconnecting app:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

