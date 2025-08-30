"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { format } from "timeago.js"
import {
  Plus,
  LogOut,
  Search,
  Menu,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"
import Image from "next/image"

interface Conversation {
  threadId: string
  title: string
  createdAt: Date
}

interface ChatSidebarProps {
  onConversationsChange?: () => void
  conversations?: Conversation[]
  isOpen: boolean
  onToggle: () => void
}

export function ChatSidebar({
  onToggle
}: ChatSidebarProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const debounced = useDebounce(searchQuery, 300);
  const params = useParams()
  const router = useRouter()

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations', params.threadId, debounced],
    queryFn: () => fetch(`/api/conversations?q=${searchQuery}`).then(res => res.json()),
    placeholderData: keepPreviousData,
  })

  const handleNewChat = () => {
    router.push(`/chat`)
  }

  const truncateTitle = (title: string, maxLength: number = 25) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }


  return (
    <div className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex-shrink-0 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Image src="/logo.png" alt="Nimbu AI" width={32} height={32} />
            <span className="text-lg font-semibold text-foreground">Nimbu AI</span>
          </div>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full justify-center cursor-pointer gap-2 h-10 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-muted border-border focus:bg-background focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1 pb-4">
          {
            conversations?.map((conversation: any) => (
              <div
                key={conversation.threadId}
                className={cn(
                  "group relative flex items-center p-3 rounded-lg transition-colors cursor-pointer mx-2",
                  params.threadId === conversation.threadId
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted"
                )}
                onClick={() => router.push(`/chat/${conversation.threadId}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize text-foreground truncate">
                        {truncateTitle(conversation.title)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {conversation.messagesCount} messages
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {format(conversation.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* <div className="opacity-0 group-hover:opacity-100 transition-opacity  flex items-center gap-1 ml-2">

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 cursor-pointer text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()

                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div> */}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}