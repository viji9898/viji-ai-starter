const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function json(statusCode, payload) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(payload),
  };
}

export function methodNotAllowed(method, allowedMethods) {
  return json(405, {
    success: false,
    error: `Method ${method} is not allowed. Use ${allowedMethods.join(", ")}.`,
  });
}

export function getErrorStatus(error, fallbackStatus = 500) {
  return error instanceof HttpError ? error.statusCode : fallbackStatus;
}

export function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}
