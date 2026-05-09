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

function normalizeConnectionString(value) {
  const trimmed = value.trim();

  const psqlMatch = trimmed.match(/^psql\s+'([^']+)'$/i);

  if (psqlMatch) {
    return psqlMatch[1];
  }

  return trimmed;
}

function getProjectMetadata(connectionString) {
  const projectName = process.env.NEON_PROJECT_NAME?.trim() || null;

  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const endpointName = host.split(".")[0] || null;

    return {
      projectName,
      endpointName,
      host,
      database: url.pathname.replace(/^\//, "") || null,
    };
  } catch {
    return {
      projectName,
      endpointName: null,
      host: null,
      database: null,
    };
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  let client;

  try {
    const user = await requireAuth(event);
    const connectionString = normalizeConnectionString(
      getRequiredEnv("DATABASE_URL"),
    );
    const project = getProjectMetadata(connectionString);

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
        version() as postgres_version,
        pg_database_size(current_database()) as database_size_bytes,
        (
          select count(*)::int
          from information_schema.tables
          where table_schema not in ('pg_catalog', 'information_schema')
            and table_type = 'BASE TABLE'
        ) as table_count,
        (
          select count(*)::int
          from information_schema.views
          where table_schema not in ('pg_catalog', 'information_schema')
        ) as view_count,
        (
          select count(*)::int
          from information_schema.schemata
          where schema_name not in ('pg_catalog', 'information_schema')
            and schema_name not like 'pg_toast%'
            and schema_name not like 'pg_temp%'
        ) as schema_count
    `);

    const tablesResponse = await client.query(`
      select
        stats.schemaname as schema_name,
        stats.relname as table_name,
        stats.n_live_tup::bigint as estimated_rows,
        pg_total_relation_size(format('%I.%I', stats.schemaname, stats.relname))::bigint as total_size_bytes
      from pg_stat_user_tables as stats
      order by pg_total_relation_size(format('%I.%I', stats.schemaname, stats.relname)) desc,
               stats.schemaname,
               stats.relname
      limit 10
    `);

    const row = response.rows[0] ?? null;

    return json(200, {
      success: true,
      viewer: user.email,
      project,
      database: row
        ? {
            serverTime: row.server_time,
            databaseName: row.database_name,
            databaseUser: row.database_user,
            postgresVersion: row.postgres_version,
            databaseSizeBytes: Number(row.database_size_bytes ?? 0),
            stats: {
              schemaCount: Number(row.schema_count ?? 0),
              tableCount: Number(row.table_count ?? 0),
              viewCount: Number(row.view_count ?? 0),
            },
            tables: tablesResponse.rows.map((table) => ({
              schemaName: table.schema_name,
              tableName: table.table_name,
              estimatedRows: Number(table.estimated_rows ?? 0),
              totalSizeBytes: Number(table.total_size_bytes ?? 0),
            })),
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
