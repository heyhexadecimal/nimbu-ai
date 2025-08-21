"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import MarkdownRenderer from "./markdown-renderer"
import { useParams } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAPIKeys } from "@/hooks/use-api-keys"
import { KeysManager } from "@/components/keys-manager"
import { getProviderForModel } from "@/lib/models"
import PromptSuggestions from "./prompt-suggestions"
import { Composer } from "./composer"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}


export default function ChatInterface({ threadId }: { threadId?: string }) {
    const [model, setModel] = useState("gemini-2.5-flash")
    const [input, setInput] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { hasKeys, isModalOpen, openModal, closeModal, refreshKeys, keys } = useAPIKeys()

    const router = useRouter()
    const params = useParams()

    const currentThreadId = params?.threadId

    const { data: configData } = useQuery({
        queryKey: ['config'],
        queryFn: () => fetch('/api/config').then(res => res.json()),
        placeholderData: { maxUserMessagesPerChat: 10 }
    })

    const maxUserMessagesPerChat = configData?.maxUserMessagesPerChat || 10

    const userMessageCount = useMemo(() => {
        return messages.filter(msg => msg.role === 'user').length;
    }, [messages]);

    const isMessageLimitReached = userMessageCount >= maxUserMessagesPerChat;

    const { data: messagesData } = useQuery({
        queryKey: ['messages', currentThreadId],
        queryFn: () => currentThreadId ? fetch(`/api/chat/${currentThreadId}`).then(res => res.json()?.then(data => data.messages)) : Promise.resolve([]),
        placeholderData: keepPreviousData,
        enabled: !!currentThreadId
    })

    useEffect(() => {
        if (currentThreadId && messagesData) {
            setMessages(messagesData || [])
        } else if (!currentThreadId) {
            setMessages([])
        }
    }, [currentThreadId, messagesData])


    useEffect(() => {
        if (currentThreadId && messagesData && messagesData.length > 0) {
            if (input.trim() === '') {
                setInput('')
            }
        }
    }, [currentThreadId, messagesData, input])

    const viewportRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    function scrollToBottom(behavior: ScrollBehavior = "smooth") {
        bottomRef.current?.scrollIntoView({ behavior, block: "end" })
    }

    useEffect(() => {
        if (messages.length === 0) return
        scrollToBottom("smooth")
    }, [messages.length])

    const handleSubmit = async (userMessage: string) => {
        if (!hasKeys) {
            openModal()
            return
        }

        if (isMessageLimitReached) {
            return
        }

        if (!userMessage.trim()) {
            return
        }

        try {
            const threadId = currentThreadId || crypto?.randomUUID() as string;
            setIsLoading(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "user",
                    content: userMessage,
                    timestamp: new Date(),
                }
            ])
            const message = userMessage;
            setInput("");

            const provider = getProviderForModel(model);
            if (!provider) {
                throw new Error(`Unknown model: ${model}`);
            }

            const apiKey = keys[provider]?.key;
            if (!apiKey) {
                throw new Error(`No API key available for ${model}`);
            }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-model-api-key": apiKey,
                },
                body: JSON.stringify({
                    messages: [...messages, {
                        role: "user",
                        content: message,
                        timestamp: new Date(),
                    }],
                    threadId: threadId,
                    model: model,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const respId = crypto.randomUUID();
            setIsLoading(false);


            setMessages((prev) => [
                ...prev,
                {
                    id: respId,
                    role: "assistant",
                    content: ' ',
                    timestamp: new Date(),
                }
            ])

            if (!response.body) {
                throw new Error('Response body is null');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';


            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("Stream finished.");
                    break;
                }
                const chunk = decoder.decode(value);
                fullResponse += chunk;
                console.log(chunk);
                setMessages((prev) => {
                    return [
                        ...prev.slice(0, -1),
                        {
                            id: respId,
                            role: "assistant",
                            content: fullResponse,
                            timestamp: new Date(),
                        }
                    ]
                })
            }

            if (!currentThreadId) {
                router.push(`/chat/${threadId}`)
            }

        } catch (error) {
            console.error("API call failed:", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (keys.gemini?.key) {
            setModel("gemini-2.5-flash")
        } else if (keys.openai?.key) {
            setModel("gpt-4o")
        }
    }, [keys.gemini?.key, keys.openai?.key])

    return (
        <div className="relative mx-auto max-w-4xl px-6 min-h-[100dvh]">
            <div
                className="flex min-h-[100dvh] flex-col"
            >
                <div
                    ref={viewportRef}
                    className="flex-1 overflow-y-auto max-h-[80vh] pr-2 -mr-2 py-12"
                    aria-label="Messages"
                >
                    {
                        messages?.length === 0
                            ? <PromptSuggestions onSuggestionClick={handleSubmit} /> : (
                                <div className="mt-2 space-y-6">
                                    {messages.map((m) => (
                                        <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                                            <div
                                                className={cn(
                                                    " prose prose-sm prose-neutral rounded-2xl px-4 py-3 text-sm leading-relaxed prose-a:text-primary-foreground  hover:prose-a:underline",
                                                    m.role === "user"
                                                        ? "bg-primary max-w-[70%] text-primary-foreground shadow-primary/20"
                                                        : "prose-invert max-w-[85%] prose-a:text-primary",
                                                )}
                                            >
                                                <MarkdownRenderer content={m.content} />
                                            </div>
                                        </div>
                                    ))}
                                    {
                                        isLoading && <div className="flex gap-4 justify-start">
                                            <div className="bg-muted rounded-2xl px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    }

                                    {isMessageLimitReached && (
                                        <div className="flex gap-4 justify-center">
                                            <div className="bg-amber-950/20 border border-amber-800 rounded-2xl px-6 py-4 max-w-2xl">
                                                <div className="flex items-center gap-3 text-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-amber-900/30 rounded-full flex items-center justify-center">
                                                            <span className="text-amber-400 text-sm font-semibold">{maxUserMessagesPerChat}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-amber-200 mb-1">
                                                            Message Limit Reached
                                                        </h3>
                                                        <p className="text-sm text-amber-300">
                                                            You've reached the maximum of {maxUserMessagesPerChat} messages in this chat.
                                                            <br />
                                                            <span className="font-medium">Please start a new conversation to continue.</span>
                                                        </p>
                                                        <div className="mt-3">
                                                            <Button
                                                                onClick={() => router.push('/chat')}
                                                                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                                            >
                                                                Start New Chat
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                    <div ref={bottomRef} className="h-1" />
                </div>

                <KeysManager
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSave={() => {
                        refreshKeys()
                        setModel(prevModel => prevModel)
                    }}
                />

                <Composer
                    input={input}
                    inputRef={inputRef}
                    isLoading={isLoading}
                    isMessageLimitReached={isMessageLimitReached}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    maxUserMessagesPerChat={maxUserMessagesPerChat}
                    model={model}
                    setModel={setModel}
                    keys={keys}
                    openModal={openModal}
                    userMessageCount={userMessageCount}
                />
            </div>
        </div >
    )
}



