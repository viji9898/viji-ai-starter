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

const scopes = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
];
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
    throw new HttpError(
      500,
      "Missing GOOGLE_MAILBOXES for domain meet minutes reads.",
    );
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

function getYearToDateBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const end = now;

  return { start, end };
}

function shouldIncludeDocumentText(event) {
  const includeText =
    event.queryStringParameters?.includeText ??
    event.queryStringParameters?.includeContent ??
    "";

  return ["1", "true", "yes"].includes(includeText.toLowerCase());
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

function getDocumentIdFromUrl(fileUrl) {
  const match = fileUrl?.match(/\/document\/d\/([^/]+)/);
  return match?.[1] ?? null;
}

function getMinutesAttachment(eventItem) {
  const attachments = Array.isArray(eventItem.attachments)
    ? eventItem.attachments
    : [];

  return attachments.find((attachment) => {
    const hasDocumentId = Boolean(
      attachment.fileId || getDocumentIdFromUrl(attachment.fileUrl),
    );

    if (!hasDocumentId) {
      return false;
    }

    if (attachment.mimeType === "application/vnd.google-apps.document") {
      return true;
    }

    return attachment.fileUrl?.includes("docs.google.com/document") ?? false;
  });
}

function getTextFromDocContent(elements = []) {
  const chunks = [];

  for (const element of elements) {
    if (element.paragraph?.elements) {
      const paragraphText = element.paragraph.elements
        .map((paragraphElement) => paragraphElement.textRun?.content ?? "")
        .join("")
        .trim();

      if (paragraphText) {
        chunks.push(paragraphText);
      }
    }

    for (const row of element.table?.tableRows ?? []) {
      for (const cell of row.tableCells ?? []) {
        const cellText = getTextFromDocContent(cell.content ?? []);

        if (cellText) {
          chunks.push(cellText);
        }
      }
    }

    const tocText = getTextFromDocContent(
      element.tableOfContents?.content ?? [],
    );

    if (tocText) {
      chunks.push(tocText);
    }
  }

  return chunks.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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

  return events
    .filter(isGoogleMeetEvent)
    .map((eventItem) => {
      const minutesAttachment = getMinutesAttachment(eventItem);

      if (!minutesAttachment) {
        return null;
      }

      const fileId =
        minutesAttachment.fileId ?? getDocumentIdFromUrl(minutesAttachment.fileUrl);

      if (!fileId) {
        return null;
      }

      return {
        mailbox,
        eventId: eventItem.id,
        eventSummary: eventItem.summary ?? null,
        start: eventItem.start?.dateTime ?? eventItem.start?.date ?? null,
        end: eventItem.end?.dateTime ?? eventItem.end?.date ?? null,
        organizer: eventItem.organizer?.email ?? null,
        hangoutLink: eventItem.hangoutLink ?? null,
        conferenceId: eventItem.conferenceData?.conferenceId ?? null,
        fileId,
        title: minutesAttachment.title ?? "Meeting minutes",
        fileUrl: minutesAttachment.fileUrl ?? null,
      };
    })
    .filter(Boolean);
}

function mergeMinutesCandidates(candidates) {
  const uniqueMinutes = new Map();

  for (const candidate of candidates) {
    const existing = uniqueMinutes.get(candidate.fileId);

    if (!existing) {
      uniqueMinutes.set(candidate.fileId, {
        fileId: candidate.fileId,
        title: candidate.title,
        fileUrl: candidate.fileUrl,
        sourceMailboxes: [candidate.mailbox],
        sourceEvents: [
          {
            mailbox: candidate.mailbox,
            eventId: candidate.eventId,
            eventSummary: candidate.eventSummary,
            start: candidate.start,
            end: candidate.end,
            organizer: candidate.organizer,
            hangoutLink: candidate.hangoutLink,
            conferenceId: candidate.conferenceId,
          },
        ],
      });
      continue;
    }

    if (!existing.sourceMailboxes.includes(candidate.mailbox)) {
      existing.sourceMailboxes.push(candidate.mailbox);
    }

    if (
      !existing.sourceEvents.some(
        (eventItem) =>
          eventItem.eventId === candidate.eventId &&
          eventItem.mailbox === candidate.mailbox,
      )
    ) {
      existing.sourceEvents.push({
        mailbox: candidate.mailbox,
        eventId: candidate.eventId,
        eventSummary: candidate.eventSummary,
        start: candidate.start,
        end: candidate.end,
        organizer: candidate.organizer,
        hangoutLink: candidate.hangoutLink,
        conferenceId: candidate.conferenceId,
      });
    }
  }

  return Array.from(uniqueMinutes.values());
}

async function loadDocumentText(fileId, sourceMailboxes) {
  let lastError = null;

  for (const mailbox of sourceMailboxes) {
    try {
      const auth = await createAuthorizedGoogleClientForSubject(scopes, mailbox);
      const docs = google.docs({ version: "v1", auth });
      const response = await docs.documents.get({ documentId: fileId });
      const text = getTextFromDocContent(response.data.body?.content ?? []);

      return {
        title: response.data.title ?? null,
        text,
        fetchedByMailbox: mailbox,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to read meeting minutes document.");
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
    const { start, end } = getYearToDateBounds();
    const includeDocumentText = shouldIncludeDocumentText(event);
    const mailboxReads = await Promise.allSettled(
      requestedMailboxes.map((mailbox) =>
        loadMeetEventsForMailbox(mailbox, start, end),
      ),
    );
    const allCandidates = mailboxReads.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    const uniqueMinutes = mergeMinutesCandidates(allCandidates);
    const results = [];

    for (const minuteItem of uniqueMinutes) {
      if (!includeDocumentText) {
        results.push({
          fileId: minuteItem.fileId,
          title: minuteItem.title,
          fileUrl: minuteItem.fileUrl,
          sourceMailboxes: minuteItem.sourceMailboxes,
          sourceEvents: minuteItem.sourceEvents,
          contentFetched: false,
        });
        continue;
      }

      try {
        const document = await loadDocumentText(
          minuteItem.fileId,
          minuteItem.sourceMailboxes,
        );

        results.push({
          fileId: minuteItem.fileId,
          title: document.title ?? minuteItem.title,
          fileUrl: minuteItem.fileUrl,
          sourceMailboxes: minuteItem.sourceMailboxes,
          sourceEvents: minuteItem.sourceEvents,
          fetchedByMailbox: document.fetchedByMailbox,
          contentFetched: true,
          text: document.text,
          excerpt: document.text.slice(0, 280),
        });
      } catch (error) {
        results.push({
          fileId: minuteItem.fileId,
          title: minuteItem.title,
          fileUrl: minuteItem.fileUrl,
          sourceMailboxes: minuteItem.sourceMailboxes,
          sourceEvents: minuteItem.sourceEvents,
          error: getErrorMessage(error, "Meeting minutes document read failed."),
        });
      }
    }

    return json(200, {
      success: true,
      viewer: viewer.email,
      allowedMailboxes,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      includeDocumentText,
      totalUniqueMinutes: results.filter((item) => !item.error).length,
      totalCandidateMinutes: uniqueMinutes.length,
      results,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Domain meet minutes query failed."),
    });
  }
};