import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];

function getHeaderValue(headers, name) {
  return (
    headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? null
  );
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const gmail = google.gmail({ version: "v1", auth });
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });
    const messages = await Promise.all(
      (response.data.messages ?? []).map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "To", "Date"],
        });
        const headers = detail.data.payload?.headers ?? [];

        return {
          id: detail.data.id,
          threadId: detail.data.threadId,
          subject: getHeaderValue(headers, "Subject"),
          from: getHeaderValue(headers, "From"),
          to: getHeaderValue(headers, "To"),
          date: getHeaderValue(headers, "Date"),
          snippet: detail.data.snippet ?? null,
          labelIds: detail.data.labelIds ?? [],
          internalDate: detail.data.internalDate ?? null,
        };
      }),
    );

    return json(200, {
      success: true,
      viewer: user.email,
      messages,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Gmail test failed."),
    });
  }
};