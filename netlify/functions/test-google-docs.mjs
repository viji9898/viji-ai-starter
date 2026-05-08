import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import {
  createAuthorizedGoogleClient,
  getRequiredGoogleConfig,
} from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/documents.readonly"];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const docs = google.docs({ version: "v1", auth });
    const documentId = getRequiredGoogleConfig([
      "GOOGLE_DOCS_TEST_DOCUMENT_ID",
    ]);
    const response = await docs.documents.get({ documentId });

    return json(200, {
      success: true,
      viewer: user.email,
      document: {
        documentId: response.data.documentId,
        title: response.data.title,
        revisionId: response.data.revisionId,
      },
      contentPreview: (response.data.body?.content ?? []).slice(0, 5),
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Docs test failed."),
    });
  }
};