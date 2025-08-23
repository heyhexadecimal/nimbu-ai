

import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { APP_CONFIGURATIONS } from '@/lib/auth'

export interface AppPermission {
    id: string
    userId: string
    appId: string
    appName: string
    scopes: string[]
    isConnected: boolean
    connectedAt: Date
    lastUsedAt?: Date
}

export class AppPermissionService {

    async getUserAppPermissions(userId: string): Promise<AppPermission[]> {
        const permissions = await prisma.userAppPermission.findMany({
            where: { userId },
            orderBy: { connectedAt: 'desc' }
        })

        return permissions.map(p => ({
            id: p.id,
            userId: p.userId,
            appId: p.appId,
            appName: p.appName,
            scopes: p.scopes,
            isConnected: p.isConnected,
            connectedAt: p.connectedAt,
            lastUsedAt: p.lastUsedAt || undefined
        }))
    }

    async hasAppPermission(userId: string, appId: string): Promise<boolean> {
        const permission = await prisma.userAppPermission.findUnique({
            where: { userId_appId: { userId, appId } }
        })

        return permission?.isConnected || false
    }

    async getAppAccessToken(userId: string, appId: string): Promise<string | null> {
        const permission = await prisma.userAppPermission.findUnique({
            where: { userId_appId: { userId, appId } }
        })

        if (!permission?.isConnected || !permission.accessToken) {
            return null
        }

        if (permission.expiresAt && permission.expiresAt.getTime() < Date.now() + 60000) {
            if (permission.refreshToken) {
                try {
                    const oauth2Client = new google.auth.OAuth2(
                        process.env.GOOGLE_CLIENT_ID!,
                        process.env.GOOGLE_CLIENT_SECRET!
                    )

                    oauth2Client.setCredentials({
                        refresh_token: permission.refreshToken
                    })

                    const { credentials } = await oauth2Client.refreshAccessToken()

                    await prisma.userAppPermission.update({
                        where: { id: permission.id },
                        data: {
                            accessToken: credentials.access_token!,
                            expiresAt: new Date(credentials.expiry_date!),
                            lastUsedAt: new Date()
                        }
                    })

                    return credentials.access_token!
                } catch (error) {
                    console.error('Failed to refresh app token:', error)
                    await this.disconnectApp(userId, appId)
                    return null
                }
            }
            return null
        }

        await prisma.userAppPermission.update({
            where: { id: permission.id },
            data: { lastUsedAt: new Date() }
        })

        return permission.accessToken
    }

    async storeAppPermission(
        userId: string,
        appId: string,
        accessToken: string,
        refreshToken: string,
        expiresAt: number,
        scopes: string[]
    ): Promise<void> {
        const appConfig = APP_CONFIGURATIONS[appId as keyof typeof APP_CONFIGURATIONS]
        const expiryDate = new Date(expiresAt)

        await prisma.userAppPermission.upsert({
            where: { userId_appId: { userId, appId } },
            update: {
                accessToken,
                refreshToken,
                expiresAt: expiryDate,
                scopes,
                isConnected: true,
                connectedAt: new Date(),
                lastUsedAt: new Date()
            },
            create: {
                userId,
                appId,
                appName: appConfig.name,
                accessToken,
                refreshToken,
                expiresAt: expiryDate,
                scopes,
                isConnected: true,
                connectedAt: new Date(),
                lastUsedAt: new Date()
            }
        })
    }

    async disconnectApp(userId: string, appId: string): Promise<void> {
        await prisma.userAppPermission.update({
            where: { userId_appId: { userId, appId } },
            data: {
                isConnected: false,
                accessToken: null,
                refreshToken: null,
                expiresAt: null
            }
        })
    }

    generateAppOAuthUrl(appId: string, userId: string, redirectUri: string, email: string): string {
        const appConfig = APP_CONFIGURATIONS[appId as keyof typeof APP_CONFIGURATIONS]

        if (!appConfig) {
            throw new Error(`Unknown app: ${appId}`)
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            redirectUri
        )

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: appConfig.scopes,
            prompt: 'consent',
            state: JSON.stringify({ appId, userId }),
            login_hint: email
        })

        return authUrl
    }

    async getAvailableApps(userId: string) {
        const userPermissions = await this.getUserAppPermissions(userId)
        const permissionMap = new Map(userPermissions.map(p => [p.appId, p]))

        return Object.entries(APP_CONFIGURATIONS).map(([appId, config]) => {
            const permission = permissionMap.get(appId)

            return {
                id: appId,
                name: config.name,
                scopes: config.scopes,
                isConnected: permission?.isConnected || false,
                connectedAt: permission?.connectedAt,
                lastUsedAt: permission?.lastUsedAt
            }
        })
    }
}