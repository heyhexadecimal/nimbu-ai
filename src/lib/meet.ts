import { google } from 'googleapis'

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

// Calendar Event Interfaces
export interface CalendarEvent {
    id: string
    summary: string
    description?: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
    attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>
    organizer?: { email: string; displayName?: string }
    location?: string
    hangoutLink?: string
    recurringEventId?: string
    status?: string
}

export interface EventSearchParams {
    timeMin?: string
    timeMax?: string
    maxResults?: number
    singleEvents?: boolean
    orderBy?: 'startTime' | 'updated'
    q?: string
    timeZone?: string
}

export interface FreeTimeSlot {
    start: string
    end: string
    duration: number // in minutes
}

function getMeetClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.meet({ version: 'v2', auth })
}

function getCalenderClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.calendar({ version: 'v3', auth })
}

export async function scheduleMeeting(
    accessToken: string,
    title: string,
    description: string,
    start: string,
    end: string,
    attendees: string[],
    organizer: {
        email: string,
        displayName: string
    }
) {
    try {
        const calendar = getCalenderClient(accessToken)

        const event = {
            summary: title,
            description: description,
            start: { dateTime: start, timeZone: 'Asia/Kolkata' },
            end: { dateTime: end, timeZone: 'Asia/Kolkata' },
            attendees: attendees.map(email => ({ email })),
            conferenceData: { createRequest: { requestId: `meet-${Date.now()}` } },
            organizer,
        }

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all'
        })

        return { success: true, eventId: response.data.id, meetLink: response.data.hangoutLink }
    } catch (error) {
        console.error('Error scheduling meeting:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to schedule meeting: ${error.message}`)
        } else {
            throw new Error('Failed to schedule meeting: Unknown error')
        }
    }
}

// Get upcoming events
export async function getUpcomingEvents(
    accessToken: string,
    maxResults: number = 10,
    timeMin?: string,
    timeMax?: string
) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        const now = new Date()
        const defaultTimeMin = timeMin || now.toISOString()
        const defaultTimeMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: defaultTimeMin,
            timeMax: defaultTimeMax,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime'
        })

        return {
            success: true,
            events: response.data.items || [],
            nextPageToken: response.data.nextPageToken
        }
    } catch (error) {
        console.error('Error getting upcoming events:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to get upcoming events: ${error.message}`)
        } else {
            throw new Error('Failed to get upcoming events: Unknown error')
        }
    }
}

// Get specific event by ID
export async function getEventById(accessToken: string, eventId: string) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        const response = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId
        })

        return {
            success: true,
            event: response.data
        }
    } catch (error) {
        console.error('Error getting event:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to get event: ${error.message}`)
        } else {
            throw new Error('Failed to get event: Unknown error')
        }
    }
}

// Update existing event
export async function updateEvent(
    accessToken: string,
    eventId: string,
    updates: Partial<{
        summary: string
        description: string
        start: string
        end: string
        attendees: string[]
        location: string
    }>
) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        // First get the current event to merge updates
        const currentEvent = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId
        })

        const updatedEvent = {
            ...currentEvent.data,
            ...(updates.summary && { summary: updates.summary }),
            ...(updates.description && { description: updates.description }),
            ...(updates.start && { start: { dateTime: updates.start, timeZone: 'Asia/Kolkata' } }),
            ...(updates.end && { end: { dateTime: updates.end, timeZone: 'Asia/Kolkata' } }),
            ...(updates.attendees && { attendees: updates.attendees.map(email => ({ email })) }),
            ...(updates.location && { location: updates.location })
        }

        const response = await calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: updatedEvent,
            sendUpdates: 'all'
        })

        return {
            success: true,
            eventId: response.data.id,
            updatedEvent: response.data
        }
    } catch (error) {
        console.error('Error updating event:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to update event: ${error.message}`)
        } else {
            throw new Error('Failed to update event: Unknown error')
        }
    }
}

// Delete event
export async function deleteEvent(accessToken: string, eventId: string, notifyAttendees: boolean = true) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
            sendUpdates: notifyAttendees ? 'all' : 'none'
        })

        return {
            success: true,
            message: 'Event deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting event:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to delete event: ${error.message}`)
        } else {
            throw new Error('Failed to delete event: Unknown error')
        }
    }
}

// Find free time slots
export async function findFreeTimeSlots(
    accessToken: string,
    startDate: string,
    endDate: string,
    durationMinutes: number = 60,
    attendees?: string[]
) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        // Get busy times for the specified period
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startDate,
                timeMax: endDate,
                items: [
                    { id: 'primary' },
                    ...(attendees || []).map(email => ({ id: email }))
                ]
            }
        })

        const busyTimes = response.data.calendars?.['primary']?.busy || []
        
        // Find free slots
        const freeSlots: FreeTimeSlot[] = []
        let currentTime = new Date(startDate)
        const endTime = new Date(endDate)

        while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000)
            
            if (slotEnd > endTime) break

            const isSlotFree = !busyTimes.some(busy => {
                const busyStart = new Date(busy.start!)
                const busyEnd = new Date(busy.end!)
                return currentTime < busyEnd && slotEnd > busyStart
            })

            if (isSlotFree) {
                freeSlots.push({
                    start: currentTime.toISOString(),
                    end: slotEnd.toISOString(),
                    duration: durationMinutes
                })
            }

            currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000) // Move by 30 minutes
        }

        return {
            success: true,
            freeSlots,
            totalSlots: freeSlots.length
        }
    } catch (error) {
        console.error('Error finding free time slots:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to find free time slots: ${error.message}`)
        } else {
            throw new Error('Failed to find free time slots: Unknown error')
        }
    }
}

// Search events by query
export async function searchEvents(
    accessToken: string,
    query: string,
    maxResults: number = 20,
    timeMin?: string,
    timeMax?: string
) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        const now = new Date()
        const defaultTimeMin = timeMin || now.toISOString()
        const defaultTimeMax = timeMax || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now

        const response = await calendar.events.list({
            calendarId: 'primary',
            q: query,
            timeMin: defaultTimeMin,
            timeMax: defaultTimeMax,
            maxResults,
            singleEvents: true,
            orderBy: 'startTime'
        })

        return {
            success: true,
            events: response.data.items || [],
            query,
            totalFound: response.data.items?.length || 0
        }
    } catch (error) {
        console.error('Error searching events:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to search events: ${error.message}`)
        } else {
            throw new Error('Failed to search events: Unknown error')
        }
    }
}

// Get calendar list (multiple calendars)
export async function getCalendarList(accessToken: string) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        const response = await calendar.calendarList.list()

        return {
            success: true,
            calendars: response.data.items || []
        }
    } catch (error) {
        console.error('Error getting calendar list:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to get calendar list: ${error.message}`)
        } else {
            throw new Error('Failed to get calendar list: Unknown error')
        }
    }
}

// Create recurring event
export async function createRecurringEvent(
    accessToken: string,
    title: string,
    description: string,
    start: string,
    end: string,
    recurrence: string[], // e.g., ['RRULE:FREQ=WEEKLY;COUNT=10']
    attendees: string[],
    organizer: {
        email: string,
        displayName: string
    }
) {
    try {
        const calendar = getCalenderClient(accessToken)

        const event = {
            summary: title,
            description: description,
            start: { dateTime: start, timeZone: 'Asia/Kolkata' },
            end: { dateTime: end, timeZone: 'Asia/Kolkata' },
            attendees: attendees.map(email => ({ email })),
            conferenceData: { createRequest: { requestId: `meet-${Date.now()}` } },
            organizer,
            recurrence
        }

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all'
        })

        return { 
            success: true, 
            eventId: response.data.id, 
            meetLink: response.data.hangoutLink,
            recurringEventId: response.data.recurringEventId
        }
    } catch (error) {
        console.error('Error creating recurring event:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to create recurring event: ${error.message}`)
        } else {
            throw new Error('Failed to create recurring event: Unknown error')
        }
    }
}

// Get event conflicts for a specific time
export async function checkEventConflicts(
    accessToken: string,
    start: string,
    end: string,
    excludeEventId?: string
) {
    try {
        const calendar = getCalenderClient(accessToken)
        
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: start,
            timeMax: end,
            singleEvents: true
        })

        const conflicts = (response.data.items || []).filter(event => 
            event.id !== excludeEventId && 
            event.status !== 'cancelled'
        )

        return {
            success: true,
            conflicts,
            hasConflicts: conflicts.length > 0,
            conflictCount: conflicts.length
        }
    } catch (error) {
        console.error('Error checking event conflicts:', error)
        if (error instanceof Error) {
            if (error.message.includes('invalid authentication credentials') || error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid or expired Google credentials. Please relogin to continue.');
            }
            throw new Error(`Failed to check event conflicts: ${error.message}`)
        } else {
            throw new Error('Failed to check event conflicts: Unknown error')
        }
    }
}

