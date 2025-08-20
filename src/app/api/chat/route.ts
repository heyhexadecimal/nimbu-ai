
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChatService } from '@/services/chat.service'
import { ConversationService } from '@/services/conversation.service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, threadId, model } = await req.json()
    if (!Array.isArray(messages)) {
      return new Response('Invalid message format', { status: 400 })
    }

    const apiKey = req.headers.get("x-model-api-key") as string

    const conversationService = new ConversationService()
    const chatService = new ChatService({ name: session?.user?.name as string, email: session?.user?.email })

    try {
      await conversationService.ensureConversation(threadId, session.userId as string, messages, model, apiKey)
    } catch (error: any) {
      if (error?.code === 'DELETED' || error?.message === 'CONVERSATION_DELETED') {
        return new Response('Conversation not found', { status: 404 })
      }
      throw error
    }

    await conversationService.saveUserMessage(threadId, messages[messages.length - 1]?.content || '')
    await conversationService.bringConversationToTop(threadId);

    const stream = await chatService.processChat({
      messages,
      threadId,
      model,
      apiKey,
      accessToken: session.accessToken as string,
      organizer: {
        email: session.user.email as string,
        displayName: session.user.name as string
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

