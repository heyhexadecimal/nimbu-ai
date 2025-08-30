"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import ChatInterface from "@/components/chat/ChatInterface"
import { Button } from "@/components/ui/button"
import {
    Menu,
} from "lucide-react"
import { twMerge } from "tailwind-merge"

import { AnimatePresence, motion } from "motion/react"
import AppsSidebar from "@/components/chat/app-sidebar"

export default function Layout() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin")
        }
    }, [status, session, router])



    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    if (!session) {
        return null
    }
    return (
        <div className="h-screen relative flex bg-sidebar overflow-hidden">
            <AnimatePresence initial={false}>
                {(sidebarOpen || true) && ( 
                    <motion.div
                        key="sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ width: { duration: 0.3 }, opacity: { duration: 0.2 } }}
                        className=" overflow-hidden flex-shrink-0"
                        style={{ minWidth: 0 }}
                    >
                        <ChatSidebar
                            isOpen={sidebarOpen}
                            onToggle={toggleSidebar}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={twMerge("h-8 w-8 absolute left-4 z-50 top-4 text-muted-foreground", sidebarOpen ? "" : "bg-primary/10 hover:bg-primary/20")}
            >
                <Menu className="h-4 w-4" />
            </Button>

            <div className="flex-1 w-full">
                <ChatInterface
                    threadId={params?.threadId as string}
                />
            </div>

            <AppsSidebar />

        </div>
    )
}