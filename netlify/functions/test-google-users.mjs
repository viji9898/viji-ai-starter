import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = [
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const admin = google.admin({ version: "directory_v1", auth });
    const response = await admin.users.list({
      customer: "my_customer",
      maxResults: 5,
      orderBy: "email",
    });

    return json(200, {
      success: true,
      viewer: user.email,
      users: (response.data.users ?? []).map((directoryUser) => ({
        id: directoryUser.id,
        primaryEmail: directoryUser.primaryEmail,
        suspended: directoryUser.suspended,
      })),
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Admin SDK test failed."),
    });
  }
};