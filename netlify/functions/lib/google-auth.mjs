import { google } from "googleapis";
import { HttpError } from "./response.mjs";

function getRequiredEnv(names) {
  const options = Array.isArray(names) ? names : [names];

  for (const name of options) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  throw new HttpError(
    500,
    `Missing required environment variable: ${options.join(" or ")}`,
  );
}

export async function createAuthorizedGoogleClient(scopes) {
  const auth = new google.auth.JWT({
    email: getRequiredEnv([
      "GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL",
      "GOOGLE_CLIENT_EMAIL",
    ]),
    key: getRequiredEnv([
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
      "GOOGLE_PRIVATE_KEY",
    ]).replace(/\\n/g, "\n"),
    scopes,
    subject: getRequiredEnv("GOOGLE_IMPERSONATION_USER"),
  });

  await auth.authorize();
  return auth;
}

export async function createAuthorizedGoogleClientForSubject(scopes, subject) {
  const auth = new google.auth.JWT({
    email: getRequiredEnv([
      "GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL",
      "GOOGLE_CLIENT_EMAIL",
    ]),
    key: getRequiredEnv([
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
      "GOOGLE_PRIVATE_KEY",
    ]).replace(/\\n/g, "\n"),
    scopes,
    subject: subject?.trim() || getRequiredEnv("GOOGLE_IMPERSONATION_USER"),
  });

  await auth.authorize();
  return auth;
}

export function getRequiredGoogleConfig(names) {
  return getRequiredEnv(names);
}
