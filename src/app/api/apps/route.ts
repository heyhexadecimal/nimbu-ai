import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AppPermissionService } from '@/services/app-permission.service'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const appPermissionService = new AppPermissionService()
        const apps = await appPermissionService.getAvailableApps(session.userId)

        return NextResponse.json({ apps })
    } catch (error) {
        console.error('Error fetching apps:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}