import { useEffect, useState } from "react";
import type { CredentialResponse } from "@react-oauth/google";
import { domainProbes } from "../constants/domainProbes";
import { probes } from "../constants/probes";
import { parseResponse, prettyJson } from "../lib/http";
import {
  clearPersistedToken,
  loadStoredToken,
  persistToken,
} from "../lib/session";
import type {
  AuthenticatedUser,
  ProbeDefinition,
  ProbeState,
  SessionState,
} from "../types/app";

const functionBasePath = "/.netlify/functions";

export function useAppSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const [authBootstrapPending, setAuthBootstrapPending] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, ProbeState>>(
    {},
  );
  const [domainProbeResults, setDomainProbeResults] = useState<
    Record<string, ProbeState>
  >({});

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = loadStoredToken();

      if (!token) {
        if (!cancelled) {
          setAuthBootstrapPending(false);
        }
        return;
      }

      if (!cancelled) {
        setAuthPending(true);
      }

      try {
        const response = await fetch(`${functionBasePath}/auth-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const payload = (await parseResponse(response)) as {
          success?: boolean;
          error?: string;
          user?: AuthenticatedUser;
        };

        if (!response.ok || !payload.success || !payload.user) {
          throw new Error(payload.error ?? "Authentication failed.");
        }

        if (!cancelled) {
          setSession({ token, user: payload.user });
          setAuthError(null);
        }
      } catch {
        clearPersistedToken();
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setAuthPending(false);
          setAuthBootstrapPending(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    const token = credentialResponse.credential?.trim();

    if (!token) {
      setAuthError("Google Sign-In did not return an ID token.");
      return;
    }

    setAuthPending(true);
    setAuthError(null);

    try {
      const response = await fetch(`${functionBasePath}/auth-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const payload = (await parseResponse(response)) as {
        success?: boolean;
        error?: string;
        user?: AuthenticatedUser;
      };

      if (!response.ok || !payload.success || !payload.user) {
        throw new Error(payload.error ?? "Authentication failed.");
      }

      persistToken(token);
      setSession({ token, user: payload.user });
      setProbeResults({});
      setDomainProbeResults({});
    } catch (error) {
      clearPersistedToken();
      setSession(null);
      setAuthError(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setAuthPending(false);
    }
  };

  const handleLogout = () => {
    clearPersistedToken();
    setSession(null);
    setProbeResults({});
    setDomainProbeResults({});
  };

  const runProbe = async (probe: ProbeDefinition) => {
    if (!session) {
      return;
    }

    setProbeResults((current) => ({
      ...current,
      [probe.id]: { status: "running" },
    }));

    try {
      const response = await fetch(`${functionBasePath}/${probe.endpoint}`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const payload = await parseResponse(response);
      const status = response.ok ? "success" : "error";

      setProbeResults((current) => ({
        ...current,
        [probe.id]: {
          status,
          output: prettyJson(payload),
        },
      }));
    } catch (error) {
      setProbeResults((current) => ({
        ...current,
        [probe.id]: {
          status: "error",
          output: prettyJson({
            success: false,
            error: error instanceof Error ? error.message : "Request failed.",
          }),
        },
      }));
    }
  };

  const runDomainProbe = async (probe: ProbeDefinition) => {
    if (!session) {
      return;
    }

    setDomainProbeResults((current) => ({
      ...current,
      [probe.id]: { status: "running" },
    }));

    try {
      const response = await fetch(`${functionBasePath}/${probe.endpoint}`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const payload = await parseResponse(response);
      const status = response.ok ? "success" : "error";

      setDomainProbeResults((current) => ({
        ...current,
        [probe.id]: {
          status,
          output: prettyJson(payload),
        },
      }));
    } catch (error) {
      setDomainProbeResults((current) => ({
        ...current,
        [probe.id]: {
          status: "error",
          output: prettyJson({
            success: false,
            error: error instanceof Error ? error.message : "Request failed.",
          }),
        },
      }));
    }
  };

  return {
    authBootstrapPending,
    authError,
    authPending,
    domainProbeResults,
    domainProbes,
    handleGoogleSuccess,
    handleLogout,
    probeResults,
    probes,
    runDomainProbe,
    runProbe,
    session,
  };
}
