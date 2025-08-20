import { config } from '@/lib/config'

export async function GET() {
  // Only expose safe configuration values to the client
  const clientConfig = {
    maxUserMessagesPerChat: config.maxUserMessagesPerChat,
  }

  return Response.json(clientConfig)
} 