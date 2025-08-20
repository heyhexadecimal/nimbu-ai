import { authOptions } from "@/lib/auth"
import { ChatService } from "@/services/chat.service";
import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {

    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { threadId } = await params;

    const chatService = new ChatService({ name: session?.user?.name as string, email: session?.user?.email as string })

    try {
        const messages = await chatService.fetchChatMessages({
            threadId,
            userId: session.userId as string,
        })
        return Response.json({
            success: true,
            messages
        })
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND' || error?.message === 'CONVERSATION_NOT_FOUND_OR_DELETED') {
            return new Response('Conversation not found', { status: 404 })
        }
        console.error('Fetch messages error:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}