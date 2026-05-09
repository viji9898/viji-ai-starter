import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClientForSubject } from "./lib/google-auth.mjs";
import {
  HttpError,
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
const maxPageSize = 250;

function requireAdmin(user) {
  if (user.role !== "admin") {
    throw new HttpError(403, "Admin access is required for this route.");
  }
}

function parseEmailList(rawValue) {
  return Array.from(
    new Set(
      (rawValue ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function getAllowedMailboxes() {
  const mailboxes = parseEmailList(process.env.GOOGLE_MAILBOXES);

  if (mailboxes.length === 0) {
    throw new HttpError(500, "Missing GOOGLE_MAILBOXES for domain meet reads.");
  }

  return mailboxes;
}

function getRequestedMailboxes(event, allowedMailboxes) {
  const requestedRaw =
    event.queryStringParameters?.mailboxes ??
    event.queryStringParameters?.mailbox ??
    event.queryStringParameters?.subjects ??
    event.queryStringParameters?.subject ??
    "";

  if (!requestedRaw.trim()) {
    return allowedMailboxes;
  }

  const requestedMailboxes = parseEmailList(requestedRaw);
  const invalidMailboxes = requestedMailboxes.filter(
    (mailbox) => !allowedMailboxes.includes(mailbox),
  );

  if (invalidMailboxes.length > 0) {
    throw new HttpError(
      403,
      `Requested mailboxes are not allowlisted: ${invalidMailboxes.join(", ")}`,
    );
  }

  return requestedMailboxes;
}

function getCurrentMonthBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  return {
    start,
    end,
  };
}

function isGoogleMeetEvent(eventItem) {
  if (eventItem.hangoutLink?.includes("meet.google.com")) {
    return true;
  }

  if (
    eventItem.conferenceData?.conferenceSolution?.key?.type === "hangoutsMeet"
  ) {
    return true;
  }

  return (eventItem.conferenceData?.entryPoints ?? []).some(
    (entryPoint) =>
      entryPoint.entryPointType === "video" &&
      entryPoint.uri?.includes("meet.google.com"),
  );
}

function mapMeetEvent(eventItem) {
  return {
    id: eventItem.id,
    summary: eventItem.summary ?? null,
    description: eventItem.description ?? null,
    status: eventItem.status ?? null,
    eventType: eventItem.eventType ?? null,
    start: eventItem.start?.dateTime ?? eventItem.start?.date ?? null,
    end: eventItem.end?.dateTime ?? eventItem.end?.date ?? null,
    organizer: eventItem.organizer?.email ?? null,
    creator: eventItem.creator?.email ?? null,
    recurringEventId: eventItem.recurringEventId ?? null,
    hangoutLink: eventItem.hangoutLink ?? null,
    conferenceId: eventItem.conferenceData?.conferenceId ?? null,
    attendeeCount: eventItem.attendees?.length ?? 0,
    attendees: (eventItem.attendees ?? []).map((attendee) => ({
      email: attendee.email ?? null,
      displayName: attendee.displayName ?? null,
      responseStatus: attendee.responseStatus ?? null,
      organizer: attendee.organizer ?? false,
      self: attendee.self ?? false,
    })),
  };
}

async function loadMeetEventsForMailbox(mailbox, monthStart, monthEnd) {
  const auth = await createAuthorizedGoogleClientForSubject(scopes, mailbox);
  const calendar = google.calendar({ version: "v3", auth });
  const events = [];
  let pageToken;

  do {
    const response = await calendar.events.list({
      calendarId: "primary",
      singleEvents: true,
      orderBy: "startTime",
      timeMin: monthStart.toISOString(),
      timeMax: monthEnd.toISOString(),
      showDeleted: false,
      maxResults: maxPageSize,
      pageToken,
    });

    events.push(...(response.data.items ?? []));
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  const meetEvents = events.filter(isGoogleMeetEvent).map(mapMeetEvent);

  return {
    mailbox,
    success: true,
    totalCalendarEvents: events.length,
    totalMeetEvents: meetEvents.length,
    meetEvents,
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const viewer = await requireAuth(event);
    requireAdmin(viewer);

    const allowedMailboxes = getAllowedMailboxes();
    const requestedMailboxes = getRequestedMailboxes(event, allowedMailboxes);
    const { start, end } = getCurrentMonthBounds();
    const results = [];

    for (const mailbox of requestedMailboxes) {
      try {
        results.push(await loadMeetEventsForMailbox(mailbox, start, end));
      } catch (error) {
        results.push({
          mailbox,
          success: false,
          error: getErrorMessage(error, "Meet query failed."),
        });
      }
    }

    return json(200, {
      success: true,
      viewer: viewer.email,
      allowedMailboxes,
      monthStart: start.toISOString(),
      monthEnd: end.toISOString(),
      results,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Domain meet query failed."),
    });
  }
};