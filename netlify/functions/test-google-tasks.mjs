import { google } from "googleapis";
import { requireAuth } from "./lib/auth.mjs";
import { createAuthorizedGoogleClient } from "./lib/google-auth.mjs";
import {
  getErrorMessage,
  getErrorStatus,
  json,
  methodNotAllowed,
} from "./lib/response.mjs";

const scopes = ["https://www.googleapis.com/auth/tasks"];

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed(event.httpMethod, ["GET"]);
  }

  try {
    const user = await requireAuth(event);
    const auth = await createAuthorizedGoogleClient(scopes);
    const tasks = google.tasks({ version: "v1", auth });
    const taskListsResponse = await tasks.tasklists.list({ maxResults: 5 });
    const firstTaskListId = taskListsResponse.data.items?.[0]?.id;

    let sampleTasks = [];

    if (firstTaskListId) {
      const tasksResponse = await tasks.tasks.list({
        tasklist: firstTaskListId,
        maxResults: 5,
        showCompleted: false,
      });

      sampleTasks = (tasksResponse.data.items ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        due: task.due,
      }));
    }

    return json(200, {
      success: true,
      viewer: user.email,
      taskLists: (taskListsResponse.data.items ?? []).map((taskList) => ({
        id: taskList.id,
        title: taskList.title,
      })),
      sampleTasks,
    });
  } catch (error) {
    return json(getErrorStatus(error, 500), {
      success: false,
      error: getErrorMessage(error, "Tasks test failed."),
    });
  }
};