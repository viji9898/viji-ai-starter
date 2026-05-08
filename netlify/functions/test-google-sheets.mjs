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

const scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = getRequiredGoogleConfig([
      "GOOGLE_SHEETS_TEST_SPREADSHEET_ID",
    ]);
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const firstSheetTitle =
      spreadsheet.data.sheets?.[0]?.properties?.title ?? "Sheet1";
    const values = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheetTitle}!A1:E5`,
    });

    return json(200, {
      success: true,
      viewer: user.email,
      spreadsheet: {
        spreadsheetId: spreadsheet.data.spreadsheetId,
        title: spreadsheet.data.properties?.title,
        firstSheetTitle,
      },
      values: values.data.values ?? [],
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Sheets test failed."),
    });
  }
};