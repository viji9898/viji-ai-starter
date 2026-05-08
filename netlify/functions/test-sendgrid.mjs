import sgClient from "@sendgrid/client";
import { requireAuth } from "./lib/auth.mjs";
import {
  HttpError,
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new HttpError(500, `Missing required environment variable: ${name}`);
  }

  return value;
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const apiKey = getRequiredEnv("SENDGRID_API_KEY");

    sgClient.setApiKey(apiKey);

    const [response, body] = await sgClient.request({
      method: "GET",
      url: "/v3/user/account",
    });

    return json(200, {
      success: true,
      viewer: user.email,
      account: {
        type: body.type ?? null,
        reputation: body.reputation ?? null,
      },
      scopes: response.headers?.["x-ratelimit-limit"] ? "available" : "unknown",
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "SendGrid test failed."),
    });
  }
};