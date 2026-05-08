import pg from "pg";
import { requireAuth } from "./lib/auth.mjs";
import {
  HttpError,
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const { Client } = pg;

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

  let client;

  try {
    const user = await requireAuth(event);
    const connectionString = getRequiredEnv("DATABASE_URL");

    client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const response = await client.query(`
      select
        now() as server_time,
        current_database() as database_name,
        current_user as database_user,
        version() as postgres_version
    `);

    const row = response.rows[0] ?? null;

    return json(200, {
      success: true,
      viewer: user.email,
      database: row
        ? {
            serverTime: row.server_time,
            databaseName: row.database_name,
            databaseUser: row.database_user,
            postgresVersion: row.postgres_version,
          }
        : null,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Database test failed."),
    });
  } finally {
    await client?.end().catch(() => undefined);
  }
};