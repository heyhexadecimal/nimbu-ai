interface MessageCounter {
    userMessageCount: number,
    maxUserMessagesPerChat: number,
    isMessageLimitReached: boolean
}

export function MessageCounter({ userMessageCount, maxUserMessagesPerChat, isMessageLimitReached }: MessageCounter) {
    return (
        <div className="flex items-center gap-1 ml-auto">
            <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${isMessageLimitReached
                    ? 'bg-amber-900/30 text-amber-300'
                    : userMessageCount >= Math.floor(maxUserMessagesPerChat * 0.8)
                        ? 'bg-blue-900/30 text-blue-300'
                        : userMessageCount >= Math.floor(maxUserMessagesPerChat / 2)
                            ? 'bg-yellow-900/30 text-yellow-300'
                            : 'bg-muted text-muted-foreground'
                    }`}
                title={
                    isMessageLimitReached
                        ? `Message limit reached. Start a new chat to continue.`
                        : userMessageCount >= Math.floor(maxUserMessagesPerChat * 0.8)
                            ? `${maxUserMessagesPerChat - userMessageCount} message${maxUserMessagesPerChat - userMessageCount !== 1 ? 's' : ''} remaining`
                            : userMessageCount >= Math.floor(maxUserMessagesPerChat / 2)
                                ? `${maxUserMessagesPerChat - userMessageCount} message${maxUserMessagesPerChat - userMessageCount !== 1 ? 's' : ''} remaining`
                                : `${maxUserMessagesPerChat - userMessageCount} message${maxUserMessagesPerChat - userMessageCount !== 1 ? 's' : ''} remaining`
                }
            >
                <span>{userMessageCount}/{maxUserMessagesPerChat}</span>
                {isMessageLimitReached && (
                    <span className="text-amber-400">•</span>
                )}
                {userMessageCount >= Math.floor(maxUserMessagesPerChat * 0.8) && !isMessageLimitReached && (
                    <span className="text-blue-400">!</span>
                )}
                {userMessageCount >= Math.floor(maxUserMessagesPerChat / 2) && userMessageCount < Math.floor(maxUserMessagesPerChat * 0.8) && (
                    <span className="text-yellow-400">•</span>
                )}
            </div>
        </div>
    )
}