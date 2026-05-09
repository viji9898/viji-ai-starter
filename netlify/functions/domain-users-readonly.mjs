import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  HttpError,
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = [
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
];

function requireAdmin(user) {
  if (user.role !== "admin") {
    throw new HttpError(403, "Admin access is required for this route.");
  }
}

function getCustomerId() {
  return process.env.GOOGLE_DIRECTORY_CUSTOMER_ID?.trim() || "my_customer";
}

function mapDirectoryUser(directoryUser) {
  return {
    id: directoryUser.id,
    primaryEmail: directoryUser.primaryEmail,
    fullName: directoryUser.name?.fullName ?? null,
    givenName: directoryUser.name?.givenName ?? null,
    familyName: directoryUser.name?.familyName ?? null,
    orgUnitPath: directoryUser.orgUnitPath ?? null,
    suspended: directoryUser.suspended ?? false,
    isAdmin: directoryUser.isAdmin ?? false,
    isDelegatedAdmin: directoryUser.isDelegatedAdmin ?? false,
    archived: directoryUser.archived ?? false,
    lastLoginTime: directoryUser.lastLoginTime ?? null,
    creationTime: directoryUser.creationTime ?? null,
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const viewer = await requireAuth(event);
    requireAdmin(viewer);

    const auth = await createAuthorizedGoogleClient(scopes);
    const admin = google.admin({ version: "directory_v1", auth });

    const users = [];
    let pageToken;

    do {
      const response = await admin.users.list({
        customer: getCustomerId(),
        maxResults: 500,
        orderBy: "email",
        pageToken,
        fields:
          "users(id,primaryEmail,name/fullName,name/givenName,name/familyName,orgUnitPath,suspended,isAdmin,isDelegatedAdmin,archived,lastLoginTime,creationTime),nextPageToken",
      });

      users.push(...(response.data.users ?? []).map(mapDirectoryUser));
      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return json(200, {
      success: true,
      viewer: viewer.email,
      customer: getCustomerId(),
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Directory readonly query failed."),
    });
  }
};