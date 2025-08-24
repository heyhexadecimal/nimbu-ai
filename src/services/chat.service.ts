
import { streamText, generateObject, smoothStream } from 'ai'
import { getAiModel } from '@/lib/ai'
import { sendEmail, readEmails, searchEmails } from '@/lib/gmail'
import { parseAIError, formatErrorMessage } from '@/lib/error-handler'
import { ConversationService } from './conversation.service'
import z from 'zod'
import { prisma } from '@/lib/prisma'
import { scheduleMeeting, getUpcomingEvents, findFreeTimeSlots, searchEvents as searchCalendarEvents, getCalendarList, createRecurringEvent, checkEventConflicts } from '@/lib/meet'
import { getConfirmationPrompt, getMarkdownSummaryPrompt, getSystemPrompt, getToolCallPrompt } from '@/lib/prompt'
import { AppPermissionService } from './app-permission.service'


// Add these imports to your existing chat.service.ts
import {
    searchDocuments,
    getDocumentContent,
    createDocument,
    updateDocumentContent,
    getDocumentPermissions,
    addDocumentPermission,
    removeDocumentPermission,
    updateDocumentTitle,
    getRecentDocuments,
    type DocSearchResult,
    type DocContent
} from '@/lib/docs'

// Update the ToolRoutingSchema to include Google Docs tools
export const ToolRoutingSchema = z.object({
    requiresGmailAgent: z.boolean().describe('Whether this request requires google apps (gmail,calendar,meet,docs) functionality'),
    userConfirmAgent: z.boolean().describe('Whether the user has confirmed the agent'),
    toolName: z.enum([
        // Existing tools
        'sendEmail',
        'readRecentEmails',
        'searchEmails',
        'markAsRead',
        'getEmailDetails',
        'scheduleMeeting',
        'getUpcomingEvents',
        'findFreeTimeSlots',
        'searchEvents',
        'getCalendarList',
        'createRecurringEvent',
        'checkEventConflicts',
        // NEW: Google Docs tools
        'searchDocuments',
        'getDocumentContent',
        'createDocument',
        'updateDocumentContent',
        'getDocumentPermissions',
        'addDocumentPermission',
        'removeDocumentPermission',
        'updateDocumentTitle',
        'getRecentDocuments',
        'none'
    ]).describe('The specific Gmail/Calendar/Docs tool to use'),
    parameters: z.object({
        // Existing parameters...
        to: z.string().describe('Recipient email address'),
        subject: z.string().describe('Email subject line'),
        body: z.string().describe('Email content in markdown format'),
        count: z.number().describe('Number of emails to retrieve (default: 5)'),
        sender: z.string().describe('Filter by specific sender email'),
        unreadOnly: z.boolean().describe('Show only unread emails (boolean)'),
        searchQuery: z.string().describe('Search terms to find emails'),
        maxResults: z.number().describe('Maximum number of results (default: 10)'),
        markAsRead: z.boolean().describe('Whether to mark as read (true) or unread (false)'),
        meetTitle: z.string().describe('Meeting title'),
        meetDescription: z.string().describe('Meeting description'),
        meetStart: z.string().describe('Meeting start time'),
        meetEnd: z.string().describe('Meeting end time'),
        meetAttendees: z.array(z.string()).describe('Meeting attendees'),
        title: z.string().describe('Event title (for recurring events)'),
        description: z.string().describe('Event description'),
        start: z.string().describe('Event start time (ISO 8601)'),
        end: z.string().describe('Event end time (ISO 8601)'),
        timeMin: z.string().describe('Time window start (ISO 8601)'),
        timeMax: z.string().describe('Time window end (ISO 8601)'),
        startDate: z.string().describe('Free/busy search start (ISO 8601)'),
        endDate: z.string().describe('Free/busy search end (ISO 8601)'),
        durationMinutes: z.number().describe('Desired free slot duration in minutes'),
        attendees: z.array(z.string()).describe('Attendees for free/busy or event operations'),
        recurrence: z.array(z.string()).describe('Recurrence rules array'),
        excludeEventId: z.string().describe('Event ID to exclude from conflict check'),

        // NEW: Google Docs parameters
        documentTitle: z.string().describe('Document title to search for or create'),
        documentId: z.string().describe('Google Docs document ID'),
        content: z.string().describe('Content to add to document'),
        insertAtEnd: z.boolean().describe('Whether to insert content at end of document (true) or beginning (false)'),
        permissionType: z.enum(['user', 'group', 'domain', 'anyone']).describe('Type of permission to add'),
        permissionRole: z.enum(['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader']).describe('Permission role'),
        permissionEmail: z.string().describe('Email address for user/group permissions'),
        permissionDomain: z.string().describe('Domain for domain permissions'),
        permissionId: z.string().describe('Permission ID to remove'),
        sendNotificationEmail: z.boolean().describe('Whether to send notification email when adding permissions'),
        newTitle: z.string().describe('New title for document')
    }),
    reasoning: z.string().describe('Explanation of tool selection and parameter extraction')
})


interface ChatRequest {
    messages: any[]
    threadId: string
    model: string
    apiKey: string
    accessToken: string
    organizer: {
        email: string,
        displayName: string
    }
}

interface ChatFetchRequest {
    threadId: string
    userId: string
}

export class ChatService {
    private conversationService = new ConversationService()
    private appPermissionService = new AppPermissionService()
    private user: {
        name: string,
        email: string
        id: string
    }

    constructor(user: { name: string, email: string, id: string }) {
        this.user = user
    }

    private async _analyzeToolRouting(model: any, messages: any[]) {
        try {
            const result = await generateObject({
                model,
                system: getToolCallPrompt(this.user.name, this.user.email),
                messages,
                schema: ToolRoutingSchema,
            })
            return result.object
        } catch (error) {
            console.error('Tool routing error:', error)
            throw error
        }
    }


    async processChat(request: ChatRequest): Promise<ReadableStream> {
        const { messages, threadId, model, apiKey, accessToken } = request

        const selectedModel = getAiModel(apiKey, model)
        if (!selectedModel) {
            return this._createErrorStream('AI model not available', threadId)
        }

        return new ReadableStream({
            start: async (controller) => {
                const encoder = new TextEncoder()
                let completeResponse = ''

                try {
                    const toolRouting = await this._analyzeToolRouting(selectedModel, messages)
                    if (!toolRouting) {
                        const errorMsg = 'Failed to analyze your request'
                        await this._sendErrorAndClose(controller, encoder, errorMsg, threadId, completeResponse)
                        return
                    }

                    if (!toolRouting.requiresGmailAgent && !toolRouting.userConfirmAgent) {
                        await this._handleNormalChat(selectedModel, messages, threadId, controller, encoder, completeResponse)
                    } else if (toolRouting.requiresGmailAgent && !toolRouting.userConfirmAgent) {
                        await this._handleConfirmation(selectedModel, messages, threadId, controller, encoder, completeResponse)
                    } else {
                        await this._handleGmailAgent(selectedModel, toolRouting, threadId, controller, encoder, completeResponse, messages, request.organizer)
                    }

                } catch (error) {
                    console.error('Chat processing error:', error)
                    const errorDetails = parseAIError(error)
                    const errorMessage = formatErrorMessage(errorDetails)
                    await this._sendErrorAndClose(controller, encoder, errorMessage, threadId, completeResponse)
                }
            }
        })
    }


    private async _handleNormalChat(model: any, messages: any[], threadId: string, controller: any, encoder: TextEncoder, completeResponse: string) {
        const result = streamText({
            model,
            system: getSystemPrompt(this.user.name, this.user.email),
            experimental_transform: [smoothStream({ chunking: 'word' })],
            messages,
        })

        for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
            completeResponse += chunk
        }

        await this.conversationService.saveAssistantMessage(threadId, completeResponse)
        controller.close()
    }

    private async _handleConfirmation(model: any, messages: any[], threadId: string, controller: any, encoder: TextEncoder, completeResponse: string) {
        const result = streamText({
            model,
            system: getConfirmationPrompt(this.user.name, this.user.email),
            experimental_transform: [smoothStream({ chunking: 'word' })],
            messages,
        })

        for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
            completeResponse += chunk
        }

        await this.conversationService.saveAssistantMessage(threadId, completeResponse)
        controller.close()
    }

    private async _handleGmailAgent(model: any, toolRouting: any, threadId: string, controller: any, encoder: TextEncoder, completeResponse: string, messages: any[], organizer: { email: string, displayName: string }) {
        const calendarToolsSet = new Set([
            'scheduleMeeting',
            'getUpcomingEvents',
            'findFreeTimeSlots',
            'searchEvents',
            'getCalendarList',
            'createRecurringEvent',
            'checkEventConflicts'
        ])

        const docsToolsSet = new Set([
            'searchDocuments',
            'getDocumentContent',
            'createDocument',
            'updateDocumentContent',
            'getDocumentPermissions',
            'addDocumentPermission',
            'removeDocumentPermission',
            'updateDocumentTitle',
            'getRecentDocuments'
        ])


        let requiredApp = 'gmail' // default
        if (calendarToolsSet.has(toolRouting.toolName)) {
            requiredApp = 'calendar'
        } else if (docsToolsSet.has(toolRouting.toolName)) {
            requiredApp = 'docs'
        }

        const agentName = requiredApp === 'calendar' ? 'Calendar' :
            requiredApp === 'docs' ? 'Docs' : 'Gmail'

        const hasPermission = await this.appPermissionService.hasAppPermission(this.user.id, requiredApp)

        if (!hasPermission) {
            const errorMsg = `❌ **${agentName} Not Connected**\n\nTo use ${agentName} features, please connect your ${agentName} account first.`
            controller.enqueue(encoder.encode(errorMsg))
            completeResponse += errorMsg
            await this.conversationService.saveAssistantMessage(threadId, completeResponse)
            controller.close()
            return
        }

        const accessToken = await this.appPermissionService.getAppAccessToken(this.user.id, requiredApp)

        if (!accessToken) {
            const errorMsg = `❌ **${agentName} Authentication Error**\n\n${agentName} access token has expired. Please reconnect your account.\n\n[Go to Apps Settings](/apps) to reconnect ${agentName}.`
            controller.enqueue(encoder.encode(errorMsg))
            completeResponse += errorMsg
            await this.conversationService.saveAssistantMessage(threadId, completeResponse)
            controller.close()
            return
        }

        const agentResponse = this._getAgentResponse(toolRouting.toolName, toolRouting.parameters, organizer)
        controller.enqueue(encoder.encode(agentResponse.initial))
        completeResponse += agentResponse.initial
        await this._delay(500)

        controller.enqueue(encoder.encode(`\n\n**${agentName}** joined the chat\n\n`))
        completeResponse += `\n\n**${agentName}** joined the chat\n\n`
        await this._delay(300)

        controller.enqueue(encoder.encode(`${agentResponse.action}\n\n`))
        completeResponse += `${agentResponse.action}\n\n`
        controller.enqueue(encoder.encode(`**${agentName} (${toolRouting.toolName})**\n\n`))
        completeResponse += `**${agentName} (${toolRouting.toolName})**\n\n`
        await this._delay(500)

        try {
            const toolResult = await this._executeGmailTool(toolRouting.toolName, toolRouting.parameters, accessToken, organizer)

            if (toolResult) {
                const summaryResult = streamText({
                    model,
                    prompt: getMarkdownSummaryPrompt({
                        originalUserRequest: messages[messages.length - 1]?.content || '',
                        toolName: toolRouting.toolName,
                        toolParameters: toolRouting.parameters,
                        toolResultsPreview: toolResult,
                        username: this.user.name,
                        email: this.user.email
                    }),
                    experimental_transform: [smoothStream({ chunking: 'word' })],
                })

                for await (const chunk of summaryResult.textStream) {
                    controller.enqueue(encoder.encode(chunk))
                    completeResponse += chunk
                }
            } else {
                const errorMsg = '\n\nUnable to complete operation. Please try again.'
                controller.enqueue(encoder.encode(errorMsg))
                completeResponse += errorMsg
            }

        } catch (gmailError) {
            console.error('Operation error:', gmailError)
            const errorMessage = this._handleGmailError(gmailError)
            controller.enqueue(encoder.encode(`\n\n${errorMessage}\n\n`))
            completeResponse += `\n\n${errorMessage}\n\n`
        }

        await this.conversationService.saveAssistantMessage(threadId, completeResponse)
        controller.close()
    }

    private async _executeGmailTool(toolName: string, parameters: any, accessToken: string, organizer: { email: string, displayName: string }): Promise<string> {
        switch (toolName) {
            case 'scheduleMeeting':
                const { meetTitle, meetDescription, meetStart, meetEnd, meetAttendees } = parameters
                if (!meetTitle) throw new Error('No meeting title provided')

                const meetResult = await scheduleMeeting(accessToken, meetTitle, meetDescription, meetStart, meetEnd, meetAttendees, organizer)

                if (meetResult?.success) {
                    return `✅ Meeting scheduled successfully!\nTitle: ${meetTitle}\nDescription: ${meetDescription}\nStart: ${meetStart}\nEnd: ${meetEnd}\nAttendees: ${meetAttendees}\nStatus: Delivered  `
                } else {
                    throw new Error('Failed to schedule meeting')
                }

            case 'getUpcomingEvents': {
                const res = await getUpcomingEvents(accessToken, parameters.maxResults || 10, parameters.timeMin, parameters.timeMax)
                const events = res?.events || []
                if (events.length === 0) return 'No upcoming events found in the requested window.'
                const list = events.map((e: any, i: number) => `${i + 1}. ${e.summary || 'Untitled'} — ${e.start?.dateTime || e.start?.date} → ${e.end?.dateTime || e.end?.date}${e.hangoutLink ? ` (Meet: ${e.hangoutLink})` : ''}`).join('\n')
                return `📅 Upcoming events (${events.length}):\n${list}`
            }
            case 'findFreeTimeSlots': {
                if (!parameters.startDate || !parameters.endDate) throw new Error('startDate and endDate are required')
                const res = await findFreeTimeSlots(accessToken, parameters.startDate, parameters.endDate, parameters.durationMinutes || 60, parameters.attendees)
                const slots = res.freeSlots || []
                if (slots.length === 0) return 'No free time slots found for the given window.'
                const top = slots.slice(0, 5).map((s: any, i: number) => `${i + 1}. ${s.start} → ${s.end} (${s.duration}m)`).join('\n')
                return `✅ Found ${slots.length} free slot(s).\nHere are the first few:\n${top}`
            }
            case 'searchEvents': {
                if (!parameters.searchQuery && !parameters.query) throw new Error('No search query provided')
                const query = parameters.searchQuery || parameters.query
                const res = await searchCalendarEvents(accessToken, query, parameters.maxResults || 20, parameters.timeMin, parameters.timeMax)
                const events = res.events || []
                if (events.length === 0) return `No events found for "${query}".`
                const list = events.map((e: any, i: number) => `${i + 1}. ${e.summary || 'Untitled'} — ${e.start?.dateTime || e.start?.date}`).join('\n')
                return `🔎 Search results for "${query}" (${events.length}):\n${list}`
            }
            case 'getCalendarList': {
                const res = await getCalendarList(accessToken)
                const cals = res.calendars || []
                if (cals.length === 0) return 'No calendars found.'
                const list = cals.map((c: any, i: number) => `${i + 1}. ${c.summary} (${c.id})`).join('\n')
                return `📚 Calendars (${cals.length}):\n${list}`
            }
            case 'createRecurringEvent': {
                const { title, description, start, end, recurrence, attendees } = parameters
                if (!title || !start || !end || !recurrence || !Array.isArray(recurrence)) throw new Error('Missing required fields to create recurring event')
                const res = await createRecurringEvent(accessToken, title, description || '', start, end, recurrence, attendees || [], organizer)
                if (res?.success) return `✅ Recurring event created. ID: ${res.eventId}${res.meetLink ? `\nMeet: ${res.meetLink}` : ''}`
                throw new Error('Failed to create recurring event')
            }
            case 'checkEventConflicts': {
                const { start, end, excludeEventId } = parameters
                if (!start || !end) throw new Error('start and end are required')
                const res = await checkEventConflicts(accessToken, start, end, excludeEventId)
                if (res.hasConflicts) {
                    const list = res.conflicts.map((e: any, i: number) => `${i + 1}. ${e.summary || 'Untitled'} — ${e.start?.dateTime || e.start?.date}`).join('\n')
                    return `⚠️ Conflicts detected (${res.conflictCount}):\n${list}`
                }
                return '✅ No conflicts detected in the specified time window.'
            }

            case 'sendEmail':
                const { to, subject, body } = parameters
                if (!to) throw new Error('No recipient email address provided')

                const result = await sendEmail(accessToken, to, subject || 'Message from AI Assistant', body || 'Hello from your AI assistant!')

                if (result?.success) {
                    return `✅ Email sent successfully!\nRecipient: ${to}\nSubject: ${subject}\nMessage ID: ${result.messageId}\nStatus: Delivered`
                } else {
                    throw new Error('Failed to send email')
                }

            case 'readRecentEmails':
                const emails = await readEmails(accessToken, {
                    maxResults: parameters.count || 5,
                    sender: parameters.sender,
                    isUnread: parameters.unreadOnly || false
                })

                if (emails.length === 0) {
                    return 'No emails found matching your criteria.'
                }

                const emailList = emails.map((email, index) =>
                    `${index + 1}. Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\nStatus: ${email.isUnread ? 'Unread' : 'Read'}\nPreview: ${email.snippet}`
                ).join('\n\n')

                return `Retrieved ${emails.length} email(s):\n\n${emailList}\n\nSummary: ${emails.length} emails found, ${emails.filter(e => e.isUnread).length} unread.`

            case 'searchEmails':
                const { searchQuery, maxResults } = parameters
                if (!searchQuery) throw new Error('No search query provided')

                const searchResults = await searchEmails(accessToken, searchQuery, maxResults || 10)

                if (searchResults.length === 0) {
                    return `No emails found for search: "${searchQuery}"`
                }

                const results = searchResults.map((email, index) =>
                    `${index + 1}. Subject: ${email.subject}\nFrom: ${email.from}\nDate: ${email.date}\nPreview: ${email.snippet}`
                ).join('\n\n')

                return `Search results for "${searchQuery}" - ${searchResults.length} email(s) found:\n\n${results}`

            case 'searchDocuments': {
                if (!parameters.searchQuery && !parameters.documentTitle) {
                    throw new Error('No search query or document title provided')
                }
                const query = parameters.searchQuery || parameters.documentTitle
                const results = await searchDocuments(accessToken, query, parameters.maxResults || 20)

                if (results.length === 0) {
                    return `No documents found for "${query}".`
                }

                const list = results.slice(0, 10).map((doc: DocSearchResult, i: number) =>
                    `${i + 1}. "${doc.name}" - Modified: ${new Date(doc.modifiedTime).toLocaleDateString()}`
                ).join('\n')

                return `📄 Found ${results.length} document(s) for "${query}":\n${list}`
            }

            case 'getDocumentContent': {
                if (!parameters.documentId) {
                    // If no ID provided, try to search by title first
                    if (parameters.documentTitle) {
                        const searchResults = await searchDocuments(accessToken, parameters.documentTitle, 5)
                        if (searchResults.length === 0) {
                            throw new Error(`No document found with title "${parameters.documentTitle}"`)
                        }
                        parameters.documentId = searchResults[0].id
                    } else {
                        throw new Error('No document ID or title provided')
                    }
                }

                const docContent = await getDocumentContent(accessToken, parameters.documentId)
                const preview = docContent.content.slice(0, 500) + (docContent.content.length > 500 ? '...' : '')

                return `📖 Document: "${docContent.title}"\nWord Count: ${docContent.wordCount}\nContent Preview:\n${preview}`
            }

            case 'createDocument': {
                if (!parameters.documentTitle && !parameters.title) {
                    throw new Error('No document title provided')
                }

                const title = parameters.documentTitle || parameters.title
                const result = await createDocument(accessToken, title, parameters.content)

                return `✅ Document created successfully!\nTitle: "${title}"\nDocument ID: ${result.documentId}\nLink: ${result.webViewLink}`
            }

            case 'updateDocumentContent': {
                if (!parameters.documentId) {
                    // Try to find document by title
                    if (parameters.documentTitle) {
                        const searchResults = await searchDocuments(accessToken, parameters.documentTitle, 5)
                        if (searchResults.length === 0) {
                            throw new Error(`No document found with title "${parameters.documentTitle}"`)
                        }
                        parameters.documentId = searchResults[0].id
                    } else {
                        throw new Error('No document ID or title provided')
                    }
                }

                if (!parameters.content) {
                    throw new Error('No content provided to add to document')
                }

                await updateDocumentContent(accessToken, parameters.documentId, parameters.content, parameters.insertAtEnd !== false)

                return `✅ Document updated successfully!\nContent added to document.`
            }

            case 'getDocumentPermissions': {
                if (!parameters.documentId) {
                    // Try to find document by title
                    if (parameters.documentTitle) {
                        const searchResults = await searchDocuments(accessToken, parameters.documentTitle, 5)
                        if (searchResults.length === 0) {
                            throw new Error(`No document found with title "${parameters.documentTitle}"`)
                        }
                        parameters.documentId = searchResults[0].id
                    } else {
                        throw new Error('No document ID or title provided')
                    }
                }

                const permissions = await getDocumentPermissions(accessToken, parameters.documentId)

                if (permissions.length === 0) {
                    return 'No permissions found for this document.'
                }

                const permissionList = permissions.map((perm, i) =>
                    `${i + 1}. ${perm.type} - ${perm.role}${perm.emailAddress ? ` (${perm.emailAddress})` : ''}`
                ).join('\n')

                return `🔐 Document Permissions (${permissions.length}):\n${permissionList}`
            }

            case 'addDocumentPermission': {
                if (!parameters.documentId) {
                    // Try to find document by title
                    if (parameters.documentTitle) {
                        const searchResults = await searchDocuments(accessToken, parameters.documentTitle, 5)
                        if (searchResults.length === 0) {
                            throw new Error(`No document found with title "${parameters.documentTitle}"`)
                        }
                        parameters.documentId = searchResults[0].id
                    } else {
                        throw new Error('No document ID or title provided')
                    }
                }

                if (!parameters.permissionType || !parameters.permissionRole) {
                    throw new Error('Permission type and role are required')
                }

                const permission = {
                    type: parameters.permissionType,
                    role: parameters.permissionRole,
                    emailAddress: parameters.permissionEmail,
                    domain: parameters.permissionDomain
                }

                const result = await addDocumentPermission(
                    accessToken,
                    parameters.documentId,
                    permission,
                    parameters.sendNotificationEmail !== false
                )

                return `✅ Permission added successfully!\nPermission ID: ${result.permissionId}\nType: ${permission.type}\nRole: ${permission.role}`
            }

            case 'removeDocumentPermission': {
                if (!parameters.documentId || !parameters.permissionId) {
                    throw new Error('Document ID and permission ID are required')
                }

                await removeDocumentPermission(accessToken, parameters.documentId, parameters.permissionId)

                return `✅ Permission removed successfully!`
            }

            case 'updateDocumentTitle': {
                if (!parameters.documentId) {
                    // Try to find document by title
                    if (parameters.documentTitle) {
                        const searchResults = await searchDocuments(accessToken, parameters.documentTitle, 5)
                        if (searchResults.length === 0) {
                            throw new Error(`No document found with title "${parameters.documentTitle}"`)
                        }
                        parameters.documentId = searchResults[0].id
                    } else {
                        throw new Error('No document ID or title provided')
                    }
                }

                if (!parameters.newTitle) {
                    throw new Error('New title is required')
                }

                await updateDocumentTitle(accessToken, parameters.documentId, parameters.newTitle)

                return `✅ Document title updated successfully!\nNew title: "${parameters.newTitle}"`
            }

            case 'getRecentDocuments': {
                const documents = await getRecentDocuments(accessToken, parameters.maxResults || 10)

                if (documents.length === 0) {
                    return 'No recent documents found.'
                }

                const docList = documents.map((doc: DocSearchResult, i: number) =>
                    `${i + 1}. "${doc.name}" - Modified: ${new Date(doc.modifiedTime).toLocaleDateString()}`
                ).join('\n')

                return `📄 Recent Documents (${documents.length}):\n${docList}`
            }


            case 'markAsRead':
                return 'Mark as read functionality would be implemented here'

            default:
                throw new Error(`Unknown tool: ${toolName}`)
        }
    }

    private _getAgentResponse(toolName: string, parameters: any, organizer: { email: string, displayName: string }) {
        switch (toolName) {
            case 'sendEmail':
                return {
                    initial: `I'll help you send that email${parameters.to ? ` to ${parameters.to}` : ''}. Let me add the Gmail agent to handle the email composition and delivery.`,
                    action: `Now let me compose and send your email.`
                }
            case 'readRecentEmails':
                const count = parameters.count || 5
                const sender = parameters.sender
                return {
                    initial: `I'll help you read your ${count} most recent emails${sender ? ` from ${sender}` : ''}. Let me add the Gmail agent to access your email data.`,
                    action: `Now let me retrieve your emails.`
                }
            case 'searchEmails':
                return {
                    initial: `I'll help you search for emails${parameters.searchQuery ? ` about "${parameters.searchQuery}"` : ''}. Let me add the Gmail agent to access your email data.`,
                    action: `Now let me search through your emails.`
                }
            case 'scheduleMeeting':
                return {
                    initial: `I'll schedule your meeting "${parameters.meetTitle || ''}" and generate a Google Meet link. Adding the Calendar agent now.`,
                    action: `Creating the calendar event and sending invites...`
                }
            case 'getUpcomingEvents':
                return {
                    initial: `I'll fetch your upcoming events. Adding the Calendar agent now.`,
                    action: `Retrieving events from your calendar...`
                }
            case 'findFreeTimeSlots':
                return {
                    initial: `I'll look for free time slots in your calendar. Adding the Calendar agent now.`,
                    action: `Scanning free/busy information...`
                }
            case 'searchEvents':
                return {
                    initial: `I'll search your calendar for events${parameters.searchQuery ? ` about "${parameters.searchQuery}"` : ''}. Adding the Calendar agent now.`,
                    action: `Searching through your events...`
                }
            case 'getCalendarList':
                return {
                    initial: `I'll list your available calendars. Adding the Calendar agent now.`,
                    action: `Fetching your calendars...`
                }
            case 'createRecurringEvent':
                return {
                    initial: `I'll create the recurring event "${parameters.title || ''}". Adding the Calendar agent now.`,
                    action: `Creating the recurring series and sending invites...`
                }
            case 'checkEventConflicts':
                return {
                    initial: `I'll check for scheduling conflicts. Adding the Calendar agent now.`,
                    action: `Checking your calendar for conflicts...`
                }
            // NEW: Google Docs cases
            case 'searchDocuments':
                return {
                    initial: `I'll search for documents${parameters.searchQuery || parameters.documentTitle ? ` about "${parameters.searchQuery || parameters.documentTitle}"` : ''}. Adding the Docs agent now.`,
                    action: `Searching through your Google Docs...`
                }
            case 'getDocumentContent':
                return {
                    initial: `I'll read the document content${parameters.documentTitle ? ` for "${parameters.documentTitle}"` : ''}. Adding the Docs agent now.`,
                    action: `Retrieving document content...`
                }
            case 'createDocument':
                return {
                    initial: `I'll create a new document${parameters.documentTitle || parameters.title ? ` titled "${parameters.documentTitle || parameters.title}"` : ''}. Adding the Docs agent now.`,
                    action: `Creating the document...`
                }
            case 'updateDocumentContent':
                return {
                    initial: `I'll update the document${parameters.documentTitle ? ` "${parameters.documentTitle}"` : ''} with new content. Adding the Docs agent now.`,
                    action: `Adding content to the document...`
                }
            case 'getDocumentPermissions':
                return {
                    initial: `I'll check the permissions for the document${parameters.documentTitle ? ` "${parameters.documentTitle}"` : ''}. Adding the Docs agent now.`,
                    action: `Retrieving document permissions...`
                }
            case 'addDocumentPermission':
                return {
                    initial: `I'll add permissions to the document${parameters.documentTitle ? ` "${parameters.documentTitle}"` : ''}. Adding the Docs agent now.`,
                    action: `Adding document permission...`
                }
            case 'removeDocumentPermission':
                return {
                    initial: `I'll remove permissions from the document. Adding the Docs agent now.`,
                    action: `Removing document permission...`
                }
            case 'updateDocumentTitle':
                return {
                    initial: `I'll rename the document${parameters.newTitle ? ` to "${parameters.newTitle}"` : ''}. Adding the Docs agent now.`,
                    action: `Updating document title...`
                }
            case 'getRecentDocuments':
                return {
                    initial: `I'll get your recent documents. Adding the Docs agent now.`,
                    action: `Retrieving recent documents...`
                }
            default:
                return {
                    initial: 'I\'ll help you with your email request. Let me add the Gmail agent to access your email data.',
                    action: 'Now let me process your request.'
                }
        }
    }

    private _handleGmailError(error: any): string {
        const errorMessage = error instanceof Error ? error.message : String(error)

        if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid authentication credentials')) {
            return 'Your app session has expired. Please reconnect the app to continue.\n\n**To fix this:** [Go to Apps Settings](/apps) to reconnect your account.'
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
            return 'The app is experiencing high demand. Please wait a moment and try again.\n\n**To fix this:** Please wait a few minutes and try again.'
        } else if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('credentials')) {
            return 'App authentication issue. Please reconnect your account.\n\n**To fix this:** [Go to Apps Settings](/apps) to reconnect your account.'
        } else if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
            return 'Missing app permissions. Please check your account settings.\n\n**To fix this:** [Go to Apps Settings](/apps) to grant necessary permissions.'
        } else {
            return 'App operation failed. Please try again.\n\n**To fix this:** Check your connection and retry, or [reconnect the app](/apps).'
        }
    }

    private async _sendErrorAndClose(controller: any, encoder: TextEncoder, errorMessage: string, threadId: string, completeResponse: string) {
        controller.enqueue(encoder.encode(errorMessage))
        await this.conversationService.saveAssistantMessage(threadId, completeResponse + errorMessage)
        controller.close()
    }

    private _createErrorStream(errorMessage: string, threadId: string): ReadableStream {
        return new ReadableStream({
            start: (controller) => {
                const encoder = new TextEncoder()
                controller.enqueue(encoder.encode(errorMessage))
                controller.close()

                this.conversationService.saveAssistantMessage(threadId, errorMessage)
                    .catch(error => console.error('Failed to save error message:', error))
            }
        })
    }

    private async _delay(ms: number) {
        await new Promise(resolve => setTimeout(resolve, ms))
    }

    async fetchChatMessages(request: ChatFetchRequest) {

        const { threadId, userId } = request;

        const conversation = await prisma.conversation.findFirst({
            where: ({
                threadId,
                userId,
                isDeleted: false,
                deletedAt: null,
            } as any)
        })

        if (!conversation) {
            throw new Error('CONVERSATION_NOT_FOUND_OR_DELETED')
        }

        const conversationAny: any = conversation as any
        if (conversationAny?.isDeleted || conversationAny?.deletedAt) {
            throw new Error('CONVERSATION_NOT_FOUND_OR_DELETED')
        }

        return await prisma.message.findMany({
            where: {
                threadId,
            }
        })
    }
}