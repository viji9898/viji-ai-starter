const sessionStorageKey = "app-victor.google-id-token";

export function loadStoredToken() {
  return window.localStorage.getItem(sessionStorageKey)?.trim() ?? "";
}

export function persistToken(token: string) {
  window.localStorage.setItem(sessionStorageKey, token);
}

export function clearPersistedToken() {
  window.localStorage.removeItem(sessionStorageKey);
}
