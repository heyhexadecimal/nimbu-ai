import { StructuredTool } from "@langchain/core/tools";
import { google } from "googleapis";
import { z } from "zod";

function getCalenderClient(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    return google.calendar({ version: 'v3', auth })
}

export class GoogleCalendarCreateEvent extends StructuredTool {
    name = "google_calendar_create_event";
    description = "Create a new event in the user's Google Calendar";
    private calendar;

    schema = z.object({
        summary: z.string(),
        description: z.string(),
        start: z.string(),
        end: z.string(),
        attendees: z.array(z.string()),
        organizerEmail: z.string(),
        organizerName: z.string(),
    });

    constructor(private accessToken: string) {
        super();
        this.calendar = getCalenderClient(this.accessToken)
    }

    async _call({ summary, description, start, end, attendees, organizerEmail, organizerName }: z.infer<typeof this.schema>) {
        try {
            const event = {
                summary,
                description,
                start: { dateTime: start, timeZone: 'Asia/Kolkata' },
                end: { dateTime: end, timeZone: 'Asia/Kolkata' },
                attendees: attendees.map(email => ({ email })),
                conferenceData: { createRequest: { requestId: `meet-${Date.now()}` } },
                organizer: {
                    email: organizerEmail,
                    displayName: organizerName
                },
            }

            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            })

            return { success: true, eventId: response.data.id, meetLink: response.data.hangoutLink }
        } catch (err: any) {
            return `Failed to create event: ${err.message}`;
        }
    }
}


export class GoogleCalendarGetEvents extends StructuredTool {
    name = "google_calendar_get_events";
    description = "Get events from the user's Google Calendar. Can filter by date range, search terms, or get all events. Perfect for finding free time slots or checking availability.";
    private calendar;

    schema = z.object({
        timeMin: z.string().optional().describe("Start time for events search (ISO string). If not provided, defaults to current time"),
        timeMax: z.string().optional().describe("End time for events search (ISO string). If not provided, gets events for next 30 days"),
        q: z.string().optional().describe("Free text search terms to find events"),
        maxResults: z.number().optional().default(50).describe("Maximum number of events to return (1-2500, default 50)"),
        singleEvents: z.boolean().optional().default(true).describe("Whether to expand recurring events into individual events"),
        orderBy: z.enum(['startTime', 'updated']).optional().default('startTime').describe("Order results by start time or last updated")
    });

    constructor(private accessToken: string) {
        super();
        this.calendar = getCalenderClient(this.accessToken)
    }

    async _call({ timeMin, timeMax, q, maxResults, singleEvents, orderBy }: z.infer<typeof this.schema>) {
        try {
            const defaultTimeMin = timeMin || new Date().toISOString();
            const defaultTimeMax = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: defaultTimeMin,
                timeMax: defaultTimeMax,
                maxResults,
                singleEvents,
                orderBy,
                q
            });

            const events = response.data.items || [];

            return {
                success: true,
                eventsCount: events.length,
                events: events.map(event => ({
                    id: event.id,
                    summary: event.summary,
                    description: event.description,
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                    attendees: event.attendees?.map(attendee => attendee.email) || [],
                    location: event.location,
                    status: event.status,
                    organizer: event.organizer,
                    hangoutLink: event.hangoutLink,
                    htmlLink: event.htmlLink
                }))
            };
        } catch (err: any) {
            return `Failed to get events: ${err.message}`;
        }
    }
}

export class GoogleCalendarUpdateEvent extends StructuredTool {
    name = "google_calendar_update_event";
    description = "Update an existing event in the user's Google Calendar. Can modify any event details like time, title, description, attendees, etc.";
    private calendar;

    schema = z.object({
        eventId: z.string().describe("The ID of the event to update"),
        summary: z.string().optional().describe("New title/summary for the event"),
        description: z.string().optional().describe("New description for the event"),
        start: z.string().optional().describe("New start time (ISO string)"),
        end: z.string().optional().describe("New end time (ISO string)"),
        attendees: z.array(z.string()).optional().describe("New list of attendee emails"),
        location: z.string().optional().describe("New location for the event"),
        organizerEmail: z.string().optional().describe("Organizer email"),
        organizerName: z.string().optional().describe("Organizer display name")
    });

    constructor(private accessToken: string) {
        super();
        this.calendar = getCalenderClient(this.accessToken)
    }

    async _call({ eventId, summary, description, start, end, attendees, location, organizerEmail, organizerName }: z.infer<typeof this.schema>) {
        try {
            const existingEvent = await this.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            if (!existingEvent.data) {
                return `Event with ID ${eventId} not found`;
            }

            const updateData: any = {};

            if (summary !== undefined) updateData.summary = summary;
            if (description !== undefined) updateData.description = description;
            if (start !== undefined) updateData.start = { dateTime: start, timeZone: 'Asia/Kolkata' };
            if (end !== undefined) updateData.end = { dateTime: end, timeZone: 'Asia/Kolkata' };
            if (attendees !== undefined) updateData.attendees = attendees.map(email => ({ email }));
            if (location !== undefined) updateData.location = location;
            if (organizerEmail && organizerName) {
                updateData.organizer = {
                    email: organizerEmail,
                    displayName: organizerName
                };
            }

            const response = await this.calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: updateData,
                sendUpdates: 'all'
            });

            return {
                success: true,
                eventId: response.data.id,
                summary: response.data.summary,
                start: response.data.start?.dateTime,
                end: response.data.end?.dateTime,
                hangoutLink: response.data.hangoutLink
            };
        } catch (err: any) {
            return `Failed to update event: ${err.message}`;
        }
    }
}

export class GoogleCalendarDeleteEvent extends StructuredTool {
    name = "google_calendar_delete_event";
    description = "Delete an event from the user's Google Calendar. This action cannot be undone.";
    private calendar;

    schema = z.object({
        eventId: z.string().describe("The ID of the event to delete"),
        sendUpdates: z.enum(['all', 'externalOnly', 'none']).optional().default('all').describe("Whether to send cancellation emails to attendees")
    });

    constructor(private accessToken: string) {
        super();
        this.calendar = getCalenderClient(this.accessToken)
    }

    async _call({ eventId, sendUpdates }: z.infer<typeof this.schema>) {
        try {
            const existingEvent = await this.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            if (!existingEvent.data) {
                return `Event with ID ${eventId} not found`;
            }

            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
                sendUpdates: sendUpdates
            });

            return {
                success: true,
                message: `Event "${existingEvent.data.summary}" has been successfully deleted`,
                deletedEventId: eventId
            };
        } catch (err: any) {
            return `Failed to delete event: ${err.message}`;
        }
    }
}