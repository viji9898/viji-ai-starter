import type { ProbeDefinition } from "../types/app";

export const probes: ProbeDefinition[] = [
  {
    id: "gmail",
    title: "Gmail test",
    endpoint: "test-google-gmail",
    description:
      "Lists recent messages with readable fields like subject, sender, recipients, and date.",
  },
  {
    id: "calendar",
    title: "Calendar test",
    endpoint: "test-google-calendar",
    description:
      "Searches six months around today and returns up to seven calendar events with readable fields.",
  },
  {
    id: "drive",
    title: "Drive test",
    endpoint: "test-google-drive",
    description:
      "Returns a small sample of files visible to the service account.",
  },
  {
    id: "tasks",
    title: "Tasks test",
    endpoint: "test-google-tasks",
    description:
      "Lists task lists and a sample of open tasks for the delegated user.",
  },
  {
    id: "docs",
    title: "Docs test",
    endpoint: "test-google-docs",
    description:
      "Fetches document metadata and the first content blocks for a configured test doc.",
  },
  {
    id: "sheets",
    title: "Sheets test",
    endpoint: "test-google-sheets",
    description:
      "Reads a small range from a configured spreadsheet to verify Sheets access.",
  },
  {
    id: "admin",
    title: "Admin SDK test",
    endpoint: "test-google-users",
    description:
      "Lists a few directory users to confirm delegated Admin SDK access.",
  },
  {
    id: "analytics",
    title: "Analytics test",
    endpoint: "test-google-analytics",
    description:
      "Verifies the analytics.readonly scope by listing Google Analytics account summaries and properties visible to the delegated user.",
  },
  {
    id: "openai",
    title: "OpenAI test",
    endpoint: "test-openai",
    description:
      "Verifies the backend OpenAI API key by listing a small sample of visible models.",
  },
  {
    id: "sendgrid",
    title: "SendGrid test",
    endpoint: "test-sendgrid",
    description:
      "Verifies the backend SendGrid API key by reading the configured account profile.",
  },
  {
    id: "db",
    title: "Neon DB test",
    endpoint: "test-db",
    description:
      "Verifies the backend DATABASE_URL by opening a Postgres connection and reading basic server details.",
  },
];
