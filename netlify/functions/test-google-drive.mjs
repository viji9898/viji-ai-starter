import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/drive.readonly"];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.list({
      pageSize: 5,
      fields: "files(id, name, mimeType, modifiedTime)",
    });

    return json(200, {
      success: true,
      viewer: user.email,
      files: response.data.files ?? [],
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Drive test failed."),
    });
  }
};