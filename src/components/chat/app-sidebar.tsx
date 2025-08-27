import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar, Video, Loader2, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type AppStatus = 'connected' | 'disconnected' | 'connecting'
import { toast } from "sonner"
import ConfirmDialog from "@/components/confirm-dialog"

type GoogleApp = {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    status: AppStatus
    permissions: string[]
    isConnected: boolean
    connectedAt?: Date
    lastUsedAt?: Date
}

export default function EnhancedAppsSidebar({ isOpen = true }: { isOpen?: boolean }) {
    const queryClient = useQueryClient()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [connectingAppId, setConnectingAppId] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDisconnectAppId, setPendingDisconnectAppId] = useState<string | null>(null)

    const appIcons = {
        gmail: <Mail className="w-5 h-5" />,
        calendar: <Calendar className="w-5 h-5" />,
        meet: <Video className="w-5 h-5" />,
        docs: <FileText className="w-5 h-5" />
    }

    const appDescriptions = {
        gmail: 'Send, read and manage your emails',
        calendar: 'Schedule meetings and manage your calendar',
        meet: 'Create and join video meetings'
    }

    const appPermissions = {
        gmail: ['Read emails', 'Send emails', 'Manage inbox'],
        calendar: ['Read events', 'Create events', 'Send invitations'],
        meet: ['Create meetings', 'Cancel meetings', 'Schedule Meetings'],
        docs: ['Read, create, edit, and manage documents', 'Access document content and formatting', 'Share and collaborate on documents']
    }

    const { data: apps = [], isLoading } = useQuery<GoogleApp[]>({
        queryKey: ['apps'],
        queryFn: async () => {
            const response = await fetch('/api/apps')
            if (!response.ok) throw new Error('Failed to fetch apps')
            const { apps: apiApps } = await response.json()
            return apiApps.map((app: any) => ({
                id: app.id,
                name: app.name,
                description: appDescriptions[app.id as keyof typeof appDescriptions] || '',
                icon: appIcons[app.id as keyof typeof appIcons],
                status: app.isConnected ? 'connected' : 'disconnected',
                permissions: appPermissions[app.id as keyof typeof appPermissions] || [],
                isConnected: app.isConnected,
                connectedAt: app.connectedAt ? new Date(app.connectedAt) : undefined,
                lastUsedAt: app.lastUsedAt ? new Date(app.lastUsedAt) : undefined
            })) as GoogleApp[]
        },
        staleTime: 30_000,
    })

    const connectMutation = useMutation({
        mutationFn: async (appId: string) => {
            const response = await fetch('/api/apps/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId })
            })
            if (!response.ok) throw new Error('Failed to generate connect URL')
            return response.json() as Promise<{ authUrl: string }>
        },
        onMutate: (appId: string) => {
            setConnectingAppId(appId)
        },
        onError: () => {
            setConnectingAppId(null)
            toast.error("Failed to connect app. Please try again.")
        },
        onSuccess: ({ authUrl }) => {
            window.location.href = authUrl
        }
    })

    const handleConnect = (appId: string) => {
        connectMutation.mutate(appId)
    }

    const disconnectMutation = useMutation({
        mutationFn: async (appId: string) => {
            const response = await fetch('/api/apps/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appId })
            })
            if (!response.ok) throw new Error('Failed to disconnect app')
            return true
        },
        onSuccess: async () => {
            toast.success("App has been disconnected successfully.")
            await queryClient.invalidateQueries({ queryKey: ['apps'] })
        },
        onError: () => {
            toast.error("Failed to disconnect app. Please try again.")
        }
    })

    const handleDisconnectRequest = (appId: string) => {
        setPendingDisconnectAppId(appId)
        setConfirmOpen(true)
    }

    const handleConfirmDisconnect = () => {
        if (pendingDisconnectAppId) {
            disconnectMutation.mutate(pendingDisconnectAppId)
        }
        setConfirmOpen(false)
        setPendingDisconnectAppId(null)
    }

    const handleCancelDisconnect = () => {
        setConfirmOpen(false)
        setPendingDisconnectAppId(null)
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const connected = urlParams.get('connected')
        const error = urlParams.get('error')

        if (connected) {
            toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} has been connected to your account.`)
            window.history.replaceState({}, '', '/chat')
            queryClient.invalidateQueries({ queryKey: ['apps'] })
        }

        if (error) {
            const errorMessages = {
                access_denied: "Access was denied. Please try connecting again.",
                invalid_request: "Invalid connection request. Please try again.",
                token_error: "Failed to obtain access tokens. Please try again.",
                callback_error: "Connection failed. Please try again."
            }

            toast.error(errorMessages[error as keyof typeof errorMessages] || "An error occurred during connection.")
            window.history.replaceState({}, '', '/chat')
        }
    }, [])


    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    const connectedApps = apps.filter(app => app.status === 'connected').length

    if (!isOpen) return null

    if (isLoading) {
        return (
            <div className={cn(
                "w-60 h-screen bg-sidebar border-l border-sidebar-border transition-all duration-300 z-30"
            )}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            " bg-sidebar h-screen  border-l border-sidebar-border transition-all duration-300 z-30 flex flex-col",
            isCollapsed ? "w-20" : "w-60"
        )}>
            <div className="flex flex-col h-full">

                <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center justify-between">
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-sidebar-foreground truncate">Google Apps</h2>
                                <p className="text-sm text-muted-foreground truncate">
                                    {connectedApps} of {apps.length} connected
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="text-sidebar-foreground hover:bg-sidebar-accent"
                            >
                                <X className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-45")} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!isCollapsed ? (
                        <>
                            {apps.map((app) => {
                                const isThisConnecting = connectingAppId === app.id
                                const status: AppStatus = isThisConnecting ? 'connecting' : app.status
                                return (
                                    <Card key={app.id} className="bg-card border-border hover:shadow-md transition-shadow">
                                        <CardHeader >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2 rounded-lg",
                                                        status === 'connected'
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {app.icon}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base text-card-foreground">{app.name}</CardTitle>
                                                    </div>
                                                </div>
                                             
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-0">
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                                        Permissions
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {app.permissions.map((permission, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                                                {permission}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {app.lastUsedAt && status === 'connected' && (
                                                    <div>
                                                        <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                                                            Last Used
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(app.lastUsedAt)}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="pt-2">
                                                    {status === 'connected' ? (
                                                        <div className="space-y-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                                                                onClick={() => handleDisconnectRequest(app.id)}
                                                            >
                                                                Disconnect
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                                            onClick={() => handleConnect(app.id)}
                                                            disabled={status === 'connecting'}
                                                        >
                                                            {status === 'connecting' ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                                    Connecting...
                                                                </>
                                                            ) : (
                                                                'Connect'
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}

                            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                                <h3 className="text-sm font-medium text-foreground mb-2">
                                    💡 Getting Started
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Connect your Google apps to enable AI assistance with tasks like scheduling meetings,
                                    managing emails, and creating calendar events through natural language commands.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3 ">
                            {apps.map((app) => (
                                <div
                                    key={app.id}
                                    className={cn(
                                        "relative flex items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer transition-colors",
                                        app.status === 'connected' && "ring-2 ring-primary/20"
                                    )}
                                    title={`${app.name} - ${app.status}`}
                                    onClick={() => setIsCollapsed(false)}
                                >
                                    <div className={cn(
                                        app.status === 'connected'
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    )}>
                                        {app.icon}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="p-4 border-t border-sidebar-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Secure OAuth 2.0</span>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                <span>Protected</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Disconnect app?"
                message={
                    pendingDisconnectAppId
                        ? `Are you sure you want to disconnect ${apps.find(a => a.id === pendingDisconnectAppId)?.name || 'this app'}? This will revoke its access.`
                        : "Are you sure you want to disconnect this app? This will revoke its access."
                }
                confirmText={disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                onConfirm={handleConfirmDisconnect}
                onCancel={handleCancelDisconnect}
            />
        </div>
    )

}