import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    const sixMonthsAhead = new Date(now);

    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

    const response = await calendar.events.list({
      calendarId: "primary",
      maxResults: 7,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: sixMonthsAgo.toISOString(),
      timeMax: sixMonthsAhead.toISOString(),
    });

    return json(200, {
      success: true,
      viewer: user.email,
      events: (response.data.items ?? []).map((eventItem) => ({
        id: eventItem.id,
        summary: eventItem.summary,
        start: eventItem.start?.dateTime ?? eventItem.start?.date,
        end: eventItem.end?.dateTime ?? eventItem.end?.date,
        status: eventItem.status,
        creator: eventItem.creator?.email ?? null,
      })),
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Calendar test failed."),
    });
  }
};