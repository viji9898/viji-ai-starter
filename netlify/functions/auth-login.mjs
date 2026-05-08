import { verifyGoogleToken } from "./lib/auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return methodNotAllowed(event.httpMethod, ["POST"]);
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const user = await verifyGoogleToken(body.token);

    return json(200, {
      success: true,
      user,
    });
  } catch (error) {
    const message = getErrorMessage(error, "Authentication failed.");

    return json(getErrorStatus(error, 401), {
      success: false,
      error: message,
    });
  }
};
