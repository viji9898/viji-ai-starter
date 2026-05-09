import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClientForSubject } from "./lib/google-auth.mjs";
import {
  HttpError,
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/tasks"];
const maxPageSize = 100;

function requireAdmin(user) {
  if (user.role !== "admin") {
    throw new HttpError(403, "Admin access is required for this route.");
  }
}

function parseEmailList(rawValue) {
  return Array.from(
    new Set(
      (rawValue ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function getAllowedSubjects() {
  const subjects = parseEmailList(process.env.GOOGLE_MAILBOXES);

  if (subjects.length === 0) {
    throw new HttpError(
      500,
      "Missing GOOGLE_MAILBOXES for domain task reads.",
    );
  }

  return subjects;
}

function getRequestedSubjects(event, allowedSubjects) {
  const requestedRaw =
    event.queryStringParameters?.subjects ??
    event.queryStringParameters?.subject ??
    "";

  if (!requestedRaw.trim()) {
    return allowedSubjects;
  }

  const requestedSubjects = parseEmailList(requestedRaw);
  const invalidSubjects = requestedSubjects.filter(
    (subject) => !allowedSubjects.includes(subject),
  );

  if (invalidSubjects.length > 0) {
    throw new HttpError(
      403,
      `Requested subjects are not allowlisted: ${invalidSubjects.join(", ")}`,
    );
  }

  return requestedSubjects;
}

async function loadTasksForSubject(subject) {
  const auth = await createAuthorizedGoogleClientForSubject(scopes, subject);
  const tasks = google.tasks({ version: "v1", auth });

  const taskLists = [];
  let taskListsPageToken;

  do {
    const taskListsResponse = await tasks.tasklists.list({
      maxResults: maxPageSize,
      pageToken: taskListsPageToken,
    });

    taskLists.push(...(taskListsResponse.data.items ?? []));
    taskListsPageToken = taskListsResponse.data.nextPageToken ?? undefined;
  } while (taskListsPageToken);

  const taskListDetails = await Promise.all(
    taskLists.map(async (taskList) => {
      const taskItems = [];
      let tasksPageToken;

      do {
        const tasksResponse = await tasks.tasks.list({
          tasklist: taskList.id,
          maxResults: maxPageSize,
          pageToken: tasksPageToken,
          showCompleted: true,
          showHidden: true,
        });

        taskItems.push(...(tasksResponse.data.items ?? []));
        tasksPageToken = tasksResponse.data.nextPageToken ?? undefined;
      } while (tasksPageToken);

      return {
        id: taskList.id,
        title: taskList.title,
        updated: taskList.updated ?? null,
        tasks: taskItems.map((task) => ({
          id: task.id,
          title: task.title,
          notes: task.notes ?? null,
          status: task.status,
          due: task.due ?? null,
          completed: task.completed ?? null,
          updated: task.updated ?? null,
        })),
      };
    }),
  );

  return {
    subject,
    success: true,
    taskLists: taskListDetails,
    totalTaskLists: taskListDetails.length,
    totalTasks: taskListDetails.reduce(
      (count, taskList) => count + taskList.tasks.length,
      0,
    ),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const viewer = await requireAuth(event);
    requireAdmin(viewer);

    const allowedSubjects = getAllowedSubjects();
    const subjects = getRequestedSubjects(event, allowedSubjects);
    const results = [];

    for (const subject of subjects) {
      try {
        results.push(await loadTasksForSubject(subject));
      } catch (error) {
        results.push({
          subject,
          success: false,
          error: getErrorMessage(error, "Task query failed."),
        });
      }
    }

    return json(200, {
      success: true,
      viewer: viewer.email,
      allowedSubjects,
      results,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Domain task query failed."),
    });
  }
};