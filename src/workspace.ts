/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Google Workspace API client integrations using fetch with client-side access tokens

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  hangoutLink?: string; // Meet link
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
}

export interface ChatSpace {
  name: string; // "spaces/SPACE_ID"
  displayName: string;
  type: string;
}

export interface GoogleContact {
  resourceName: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * Fetch upcoming calendar events from the primary Google Calendar
 */
export async function listEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    const now = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=10&orderBy=startTime&singleEvents=true`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error('listEvents error:', err);
    throw err;
  }
}

/**
 * Create a Google Calendar event and optionally create a Google Meet conference link
 */
export async function createEvent(
  accessToken: string,
  event: Omit<CalendarEvent, 'id'>,
  includeMeet: boolean = false
): Promise<CalendarEvent> {
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${includeMeet ? 1 : 0}`;
    
    const payload: any = {
      summary: event.summary,
      description: event.description || '',
      start: event.start,
      end: event.end,
    };

    if (includeMeet) {
      payload.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Failed to create calendar event: ${response.statusText}. Detail: ${errBody}`);
    }

    return await response.json();
  } catch (err) {
    console.error('createEvent error:', err);
    throw err;
  }
}

/**
 * List the Google Chat Spaces available to the user
 */
export async function listChatSpaces(accessToken: string): Promise<ChatSpace[]> {
  try {
    const url = 'https://chat.googleapis.com/v1/spaces';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list Google Chat spaces: ${response.statusText}`);
    }

    const data = await response.json();
    return data.spaces || [];
  } catch (err) {
    console.error('listChatSpaces error:', err);
    throw err;
  }
}

/**
 * Send a notification/alert message to a specific Google Chat space
 */
export async function sendChatMessage(
  accessToken: string,
  spaceName: string, // format: "spaces/xxxxx"
  text: string
): Promise<any> {
  try {
    const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to send Google Chat message: ${response.statusText}. Details: ${errText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('sendChatMessage error:', err);
    throw err;
  }
}

/**
 * Fetch Google Contacts connections to import
 */
export async function listGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
  try {
    const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve Google Contacts: ${response.statusText}`);
    }

    const data = await response.json();
    const connections = data.connections || [];

    return connections.map((conn: any) => {
      const nameObj = conn.names?.[0];
      const emailObj = conn.emailAddresses?.[0];
      const phoneObj = conn.phoneNumbers?.[0];

      return {
        resourceName: conn.resourceName,
        name: nameObj?.displayName || 'Unnamed Contact',
        email: emailObj?.value || '',
        phone: phoneObj?.canonicalForm || phoneObj?.value || ''
      };
    });
  } catch (err) {
    console.error('listGoogleContacts error:', err);
    throw err;
  }
}
