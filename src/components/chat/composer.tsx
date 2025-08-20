import { ArrowUp, Key } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Input } from "../ui/input"
import { ModelSelector } from "./model-selector"
import { PillButton } from "../pill-button"
import { MessageCounter } from "./message-counter"

interface Composer {
    input: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isMessageLimitReached: boolean,
    setInput: (value: string) => void,
    handleSubmit: (value: string) => void,
    maxUserMessagesPerChat: number,
    model: string,
    setModel: (value: string) => void,
    keys: any,
    openModal: () => void,
    userMessageCount: number
}

export function Composer({ input, inputRef, isMessageLimitReached, setInput, handleSubmit, maxUserMessagesPerChat, model, setModel, keys, openModal, userMessageCount }: Composer) {
    return (
        <div className="sticky bottom-0 z-10  backdrop-blur  pt-3 pb-[env(safe-area-inset-bottom)]">
            <Card className="w-full rounded-2xl border border-border bg-card p-3 shadow-md">
                <div className="flex items-center gap-2 rounded-xl bg-muted p-2 ring-1 ring-border">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            if (!isMessageLimitReached) {
                                setInput(e.target.value)
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(input)
                            }
                        }}
                        placeholder={isMessageLimitReached ? `Message limit reached (${maxUserMessagesPerChat}/${maxUserMessagesPerChat}) - start a new chat` : "Type your message here..."}
                        aria-label="Message"
                        disabled={isMessageLimitReached}
                        className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Button
                        aria-label="Send message"
                        onClick={() => handleSubmit(input)}
                        disabled={isMessageLimitReached}
                        className="flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
                    <ModelSelector
                        model={model}
                        onChange={setModel}
                        keys={keys}
                    />

                    <PillButton
                        active={true}
                        onClick={openModal}
                        icon={Key}
                        label="Keys"
                    />


                    <MessageCounter
                        userMessageCount={userMessageCount}
                        maxUserMessagesPerChat={maxUserMessagesPerChat}
                        isMessageLimitReached={isMessageLimitReached}
                    />

                    <span className="text-[11px] text-muted-foreground">{"Press Enter to send"}</span>
                </div>
            </Card>
        </div>
    )
}