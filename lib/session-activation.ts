import { useSyncExternalStore } from "react";

type ActivationState = {
  pending: boolean;
  sessionId: string | null;
  activationStartedAt: number | null;
};

let activationState: ActivationState = {
  pending: false,
  sessionId: null,
  activationStartedAt: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return activationState;
}

export function markSessionActivationPending(sessionId: string) {
  console.log("[SESSION ACTIVATION DEBUG] pending set", sessionId);

  activationState = {
    pending: true,
    sessionId,
    activationStartedAt: Date.now(),
  };
  emitChange();
}

export function clearSessionActivationPending(reason = "unspecified") {
  if (
    !activationState.pending &&
    activationState.sessionId === null &&
    activationState.activationStartedAt === null
  ) {
    return;
  }

  console.log("[SESSION ACTIVATION DEBUG] pending cleared", {
    reason,
    previousSessionId: activationState.sessionId,
    activationStartedAt: activationState.activationStartedAt,
  });

  activationState = {
    pending: false,
    sessionId: null,
    activationStartedAt: null,
  };
  emitChange();
}

export function hasRecentActivationWindow(maxAgeMs = 15000) {
  if (!activationState.activationStartedAt) {
    return false;
  }

  return Date.now() - activationState.activationStartedAt <= maxAgeMs;
}

export function useSessionActivationState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
