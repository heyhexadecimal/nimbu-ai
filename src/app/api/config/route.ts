import { config } from '@/lib/config'

export async function GET() {
  const clientConfig = {
    maxUserMessagesPerChat: config.maxUserMessagesPerChat,
  }

  return Response.json(clientConfig)
} 