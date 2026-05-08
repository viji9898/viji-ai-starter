import { OAuth2Client } from "google-auth-library";
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

function getEmailSet(name) {
  const raw = process.env[name] ?? "";

  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getApprovedEmails(admins) {
  const approved = getEmailSet("APPROVED_EMAILS");

  for (const email of admins) {
    approved.add(email);
  }

  return approved;
}

export async function verifyGoogleToken(idToken) {
  if (!idToken?.trim()) {
    throw new HttpError(400, "Missing Google ID token.");
  }

  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const allowedDomain = getRequiredEnv("ALLOWED_EMAIL_DOMAIN").toLowerCase();
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();

  if (!payload) {
    throw new HttpError(401, "Google token payload is empty.");
  }

  const email = payload.email?.toLowerCase();

  if (!email) {
    throw new HttpError(401, "Google token is missing an email address.");
  }

  if (!payload.email_verified) {
    throw new HttpError(401, "Google account email is not verified.");
  }

  const hostedDomain = (payload.hd ?? email.split("@")[1] ?? "").toLowerCase();

  if (hostedDomain !== allowedDomain) {
    throw new HttpError(
      403,
      `Email domain ${hostedDomain || "unknown"} is not allowed.`,
    );
  }

  const admins = getEmailSet("ADMIN_EMAILS");
  const approvedEmails = getApprovedEmails(admins);

  if (!approvedEmails.has(email)) {
    throw new HttpError(
      403,
      `Email ${email} is not in the approved user list.`,
    );
  }

  return {
    email,
    name: payload.name ?? email,
    picture: payload.picture,
    hd: hostedDomain,
    role: admins.has(email) ? "admin" : "team",
  };
}

export async function requireAuth(event) {
  const authHeader = event.headers.authorization ?? event.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing Authorization bearer token.");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return verifyGoogleToken(token);
}
