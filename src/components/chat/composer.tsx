import { ArrowUp, Key, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Textarea } from "../ui/textarea"
import { ModelSelector } from "./model-selector"
import { PillButton } from "../pill-button"
import { MessageCounter } from "./message-counter"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface Composer {
    input: string,
    inputRef: React.RefObject<HTMLTextAreaElement | null>,
    isMessageLimitReached: boolean,
    isLoading?: boolean, 
    setInput: (value: string) => void,
    handleSubmit: (value: string) => void,
    maxUserMessagesPerChat: number,
    model: string,
    setModel: (value: string) => void,
    keys: any,
    openModal: () => void,
    userMessageCount: number
}

export function Composer({ 
    input, 
    inputRef, 
    isMessageLimitReached, 
    isLoading = false,
    setInput, 
    handleSubmit, 
    maxUserMessagesPerChat, 
    model, 
    setModel, 
    keys, 
    openModal, 
    userMessageCount 
}: Composer) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current || inputRef?.current
        if (textarea) {
            textarea.style.height = 'auto'
            const scrollHeight = textarea.scrollHeight
            const maxHeight = 144
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
        }
    }

    useEffect(() => {
        adjustTextareaHeight()
    }, [input])

    useEffect(() => {
        if (inputRef && textareaRef.current) {
            inputRef.current = textareaRef.current
        }
    }, [inputRef])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (!isLoading && !isMessageLimitReached && input.trim()) {
                handleSubmit(input)
            }
        }
    }

    const handleSend = () => {
        if (!isLoading && !isMessageLimitReached && input.trim()) {
            handleSubmit(input)
        }
    }

    const isDisabled = isMessageLimitReached || isLoading

    return (
        <div className="sticky bottom-0 z-10 backdrop-blur pt-3 pb-[env(safe-area-inset-bottom)]">
            <Card className="w-full rounded-2xl border border-border bg-card p-3 shadow-md">
                <div className="flex items-end gap-2 rounded-xl bg-muted p-2 ring-1 ring-border">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            if (!isDisabled) {
                                setInput(e.target.value)
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isMessageLimitReached 
                                ? `Message limit reached (${maxUserMessagesPerChat}/${maxUserMessagesPerChat}) - start a new chat`
                                : isLoading
                                    ? "Processing your message..."
                                    : "Type your message here..."
                        }
                        aria-label="Message"
                        disabled={isDisabled}
                        className={cn(
                            "flex-1 min-h-[40px] resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed",
                            "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                        )}
                        style={{ 
                            height: '40px', 
                            maxHeight: '144px', 
                            overflowY: input.split('\n').length > 6 ? 'auto' : 'hidden'
                        }}
                    />
                    <Button
                        aria-label="Send message"
                        onClick={handleSend}
                        disabled={isDisabled || !input.trim()}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                            (isLoading || !input.trim()) && "opacity-50"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
                    <ModelSelector
                        model={model}
                        onChange={setModel}
                        keys={keys}
                        disabled={isLoading} 
                    />

                    <PillButton
                        active={true}
                        onClick={openModal}
                        icon={Key}
                        label="Keys"
                        disabled={isLoading} 
                    />

                    <MessageCounter
                        userMessageCount={userMessageCount}
                        maxUserMessagesPerChat={maxUserMessagesPerChat}
                        isMessageLimitReached={isMessageLimitReached}
                    />

                    <span className="text-[11px] text-muted-foreground">
                        {isLoading 
                            ? "Processing..." 
                            : "Press Enter to send, Shift+Enter for new line"
                        }
                    </span>
                </div>
            </Card>
        </div>
    )
}