import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { ConversationService } from '@/services/conversation.service'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.email) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { threadId } = await params

  const conversationService = new ConversationService()
  try {
    const result = await conversationService.softDeleteConversation(session.userId as string, threadId)
    return Response.json(result)
  } catch (error: any) {
    if (error?.code === 'NOT_FOUND') {
      return new Response('Conversation not found', { status: 404 })
    }
    console.error('Delete conversation error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}


