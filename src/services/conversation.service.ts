
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'


export class ConversationService {
    async ensureConversation(threadId: string, userId: string, messages: any[], model: string, apiKey: string) {
        let conversation = await prisma.conversation.findUnique({
            where: { threadId }
        })

        const title = conversation?.title || await this._generateTitle(messages[messages.length - 1]?.content, model, apiKey)

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { threadId, title, userId }
            })
        }

        const convAny: any = conversation as any
        if (convAny?.isDeleted || convAny?.deletedAt) {
            const error = new Error('CONVERSATION_DELETED')
                ; (error as any).code = 'DELETED'
            throw error
        }

        if (!conversation.title) {
            await prisma.conversation.update({
                where: { threadId },
                data: { title }
            })
        }

        return conversation
    }

    async checkMessageLimit(threadId: string): Promise<Response | null> {
        const existingUserMessages = await prisma.message.count({
            where: { threadId, role: 'user' }
        })

        if (existingUserMessages >= config.maxUserMessagesPerChat) {
            const limitMessage = `You have reached the maximum limit of ${config.maxUserMessagesPerChat} messages in this chat. Please start a new conversation to continue.`

            await this.saveAssistantMessage(threadId, limitMessage)
            return new Response(limitMessage, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
        }

        return null
    }

    async saveUserMessage(threadId: string, content: string) {
        await prisma.message.create({
            data: {
                threadId,
                content,
                role: 'user',
                timestamp: new Date().toISOString()
            }
        })
    }

    async saveAssistantMessage(threadId: string, content: string) {
        await prisma.message.create({
            data: {
                threadId,
                content,
                role: 'assistant',
                timestamp: new Date().toISOString()
            }
        })
    }

    private async _generateTitle(firstMessage: string, model: string, apiKey: string): Promise<string> {
        // const titleSchema = z.object({
        //     title: z.string().describe('The title of the conversation')
        // })
        // const resullt = await generateObject({
        //     model: getAiModel(apiKey, model) as LanguageModel,
        //     system: getTitleGenerationPrompt(firstMessage),
        //     schema: titleSchema,
        //     messages: [{
        //         role: 'user',
        //         content: firstMessage
        //     }]

        // })
        return firstMessage;
        // const title = resullt.object.title || firstMessage?.length > 50 ? firstMessage.slice(0, 50).trim() : firstMessage

    }

    async getUserConversations(userId: string, search?: string) {
        const conversations = await prisma.conversation.findMany({
            where: {
                userId,
                isDeleted: false,
                title: { contains: search?.trim(), mode: 'insensitive' }
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                threadId: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { messages: true } },
            },
        })

        return conversations.map(conv => ({
            threadId: conv.threadId ?? "",
            title: conv.title || "Untitled Chat",
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            messagesCount: conv._count.messages,
        }))
    }

    async softDeleteConversation(userId: string, threadId: string) {
        const existing = await prisma.conversation.findFirst({
            where: { userId, threadId }
        })

        if (!existing) {
            const error = new Error('Conversation not found')
                ; (error as any).code = 'NOT_FOUND'
            throw error
        }

        await prisma.conversation.update({
            where: { threadId },
            data: { isDeleted: true, deletedAt: new Date() }
        })

        return { success: true }
    }

    async bringConversationToTop(threadId: string) {
        await prisma.conversation.update({
            where: { threadId },
            data: { updatedAt: new Date() }
        })
    }
}