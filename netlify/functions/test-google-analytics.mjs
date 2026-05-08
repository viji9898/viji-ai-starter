import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/analytics.readonly"];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth });
    const response = await analyticsAdmin.accountSummaries.list({ pageSize: 5 });

    return json(200, {
      success: true,
      viewer: user.email,
      accountSummaries: (response.data.accountSummaries ?? []).map((summary) => ({
        name: summary.name,
        account: summary.account,
        displayName: summary.displayName,
        propertySummaries: (summary.propertySummaries ?? [])
          .slice(0, 5)
          .map((property) => ({
            property: property.property,
            displayName: property.displayName,
            propertyType: property.propertyType,
            parent: property.parent,
          })),
      })),
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Analytics test failed."),
    });
  }
};