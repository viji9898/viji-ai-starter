import OpenAI from "openai";
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
    const apiKey = getRequiredEnv("OPENAI_API_KEY");
    const client = new OpenAI({ apiKey });
    const response = await client.models.list();
    const models = [...response.data].slice(0, 5).map((model) => ({
      id: model.id,
      created: model.created,
      ownedBy: model.owned_by,
    }));

    return json(200, {
      success: true,
      viewer: user.email,
      models,
      totalVisibleModels: response.data.length,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "OpenAI test failed."),
    });
  }
};