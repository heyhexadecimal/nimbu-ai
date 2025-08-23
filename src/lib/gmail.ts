import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions, refreshAccessToken } from '@/lib/auth'

export interface EmailMessage {
  id: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  body: string
  isUnread: boolean
  hasAttachments: boolean
}

export interface EmailSearchParams {
  query?: string
  maxResults?: number
  sender?: string
  subject?: string
  isUnread?: boolean
  hasAttachment?: boolean
  dateAfter?: string
  dateBefore?: string
}


export async function getValidGmailClient() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    throw new Error('No access token available')
  }

  if (session.expiresAt && Date.now() > session.expiresAt - 60000) {
    if (session.refreshToken) {
      try {
        const refreshedTokens = await refreshAccessToken(session.refreshToken)
        const auth = new google.auth.OAuth2()
        auth.setCredentials({ access_token: refreshedTokens.accessToken })
        return google.gmail({ version: 'v1', auth })
      } catch (error) {
        throw new Error('Failed to refresh access token')
      }
    } else {
      throw new Error('Access token expired and no refresh token available')
    }
  }

  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: session.accessToken })
  return google.gmail({ version: 'v1', auth })
}


function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth })
}


export async function readEmailsWithRefresh(
  params: EmailSearchParams = {}
): Promise<EmailMessage[]> {
  try {
    const gmail = await getValidGmailClient()

    let query = 'in:inbox'
    if (params.sender) query += ` from:${params.sender}`
    if (params.subject) query += ` subject:"${params.subject}"`
    if (params.isUnread) query += ' is:unread'
    if (params.hasAttachment) query += ' has:attachment'
    if (params.dateAfter) query += ` after:${params.dateAfter}`
    if (params.dateBefore) query += ` before:${params.dateBefore}`
    if (params.query) query += ` ${params.query}`

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: params.maxResults || 10
    })

    if (!response.data.messages) {
      return []
    }

    const emailPromises = response.data.messages.map(async (msg) => {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full'
      })

      return parseEmailMessage(details.data)
    })

    const emails = await Promise.all(emailPromises)
    return emails.filter(email => email !== null) as EmailMessage[]
  } catch (error) {
    console.error('Error reading emails:', error)
    throw new Error('Failed to read emails from Gmail')
  }
}

export async function readEmails(
  accessToken: string,
  params: EmailSearchParams = {}
): Promise<EmailMessage[]> {
  try {
    const gmail = getGmailClient(accessToken)

    let query = 'in:inbox'
    if (params.sender) query += ` from:${params.sender}`
    if (params.subject) query += ` subject:"${params.subject}"`
    if (params.isUnread) query += ' is:unread'
    if (params.hasAttachment) query += ' has:attachment'
    if (params.dateAfter) query += ` after:${params.dateAfter}`
    if (params.dateBefore) query += ` before:${params.dateBefore}`
    if (params.query) query += ` ${params.query}`

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: params.maxResults || 10
    })

    if (!response.data.messages) {
      return []
    }

    const emailPromises = response.data.messages.map(async (msg) => {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full'
      })

      return parseEmailMessage(details.data)
    })

    const emails = await Promise.all(emailPromises)
    return emails.filter(email => email !== null) as EmailMessage[]
  } catch (error) {
    console.error('Error reading emails:', error)

    if (error instanceof Error) {
      if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
        throw new Error('Authentication failed: Invalid or expired Gmail credentials. Please relogin to continue.');
      }
      throw new Error(`Failed to read emails from Gmail: ${error.message}`);
    } else {
      throw new Error('Failed to read emails from Gmail: Unknown error');
    }
  }
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  replyToMessageId?: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const gmail = getGmailClient(accessToken)

    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0'
    ]

    if (replyToMessageId) {
      const originalMessage = await gmail.users.messages.get({
        userId: 'me',
        id: replyToMessageId,
        format: 'metadata',
        metadataHeaders: ['Message-ID', 'References', 'In-Reply-To']
      })

      const messageId = getHeaderValue(originalMessage.data, 'Message-ID')
      const references = getHeaderValue(originalMessage.data, 'References')

      if (messageId) {
        headers.push(`In-Reply-To: ${messageId}`)
        headers.push(`References: ${references || ''} ${messageId}`)
      }
    }

    const message = [
      ...headers,
      '',
      body
    ].join('\n')

    const encodedMessage = Buffer.from(message).toString('base64url')

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: replyToMessageId ? undefined : undefined
      }
    })

    return {
      success: true,
      messageId: result.data.id || undefined
    }
  } catch (error) {
    console.error('Error sending email:', error)

    if (error instanceof Error) {
      if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
        throw new Error('Authentication failed: Invalid or expired Gmail credentials. Please relogin to continue.');
      }
      throw new Error(`Failed to send email: ${error.message}`);
    } else {
      throw new Error('Failed to send email: Unknown error');
    }
  }
}

export async function searchEmails(
  accessToken: string,
  searchQuery: string,
  maxResults: number = 20
): Promise<EmailMessage[]> {
  return readEmails(accessToken, {
    query: searchQuery,
    maxResults
  })
}

export async function markEmailsAsRead(
  accessToken: string,
  messageIds: string[],
  markAsRead: boolean = true
): Promise<{ success: boolean }> {
  try {
    const gmail = getGmailClient(accessToken)

    const operation = markAsRead ? 'removeLabelIds' : 'addLabelIds'

    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        [operation]: ['UNREAD']
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking emails:', error)

    if (error instanceof Error) {
      if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
        throw new Error('Authentication failed: Invalid or expired Gmail credentials. Please relogin to continue.');
      }
      throw new Error(`Failed to mark emails: ${error.message}`);
    } else {
      throw new Error('Failed to mark emails: Unknown error');
    }
  }
}

export async function getEmailThread(
  accessToken: string,
  threadId: string
): Promise<EmailMessage[]> {
  try {
    const gmail = getGmailClient(accessToken)

    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    })

    if (!thread.data.messages) {
      return []
    }

    return thread.data.messages
      .map(msg => parseEmailMessage(msg))
      .filter(email => email !== null) as EmailMessage[]
  } catch (error) {
    console.error('Error getting email thread:', error)

    if (error instanceof Error) {
      if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
        throw new Error('Authentication failed: Invalid or expired Gmail credentials. Please relogin to continue.');
      }
      throw new Error(`Failed to get email thread: ${error.message}`);
    } else {
      throw new Error('Failed to get email thread: Unknown error');
    }
  }
}

function parseEmailMessage(messageData: any): EmailMessage | null {
  try {
    const headers = messageData.payload?.headers || []

    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    let body = ''
    if (messageData.payload?.body?.data) {
      body = Buffer.from(messageData.payload.body.data, 'base64').toString()
    } else if (messageData.payload?.parts) {
      const textPart = findTextPart(messageData.payload.parts)
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString()
      }
    }


    body = stripHtmlTags(body)

    return {
      id: messageData.id || '',
      subject: getHeader('Subject') || '(No Subject)',
      from: getHeader('From') || '',
      to: getHeader('To') || '',
      date: getHeader('Date') || '',
      snippet: messageData.snippet || '',
      body: body.slice(0, 1000),
      isUnread: messageData.labelIds?.includes('UNREAD') || false,
      hasAttachments: hasAttachments(messageData.payload)
    }
  } catch (error) {
    console.error('Error parsing email message:', error)
    return null
  }
}


function getHeaderValue(messageData: any, headerName: string): string {
  const headers = messageData.payload?.headers || []
  return headers.find((h: any) => h.name === headerName)?.value || ''
}

function findTextPart(parts: any[]): any {
  for (const part of parts) {
    if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
      return part
    }
    if (part.parts) {
      const found = findTextPart(part.parts)
      if (found) return found
    }
  }
  return null
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function hasAttachments(payload: any): boolean {
  if (!payload.parts) return false
  return payload.parts.some((part: any) =>
    part.filename && part.filename.length > 0
  )
}