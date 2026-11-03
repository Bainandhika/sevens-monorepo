import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Session storage key and 30-second reconnect tolerance constants
 */
export const SESSION_STORAGE_KEY = 'sevens_session_data';
export const RECONNECT_WINDOW_SECONDS = 30;
export const RECONNECT_WINDOW_MS = RECONNECT_WINDOW_SECONDS * 1000;

/**
 * Persisted session data structure stored in sessionStorage
 */
export interface PersistedSessionData {
  sessionToken: string;
  playerId: string;
  playerName: string;
  lastRoomId: string | null;
  disconnectedAt: number | null;
}

/**
 * Return signature of useSessionPersistence hook
 */
export interface UseSessionPersistenceReturn {
  sessionData: PersistedSessionData | null;
  isEligibleForReconnect: boolean;
  remainingReconnectSeconds: number;
  saveSession: (data: Partial<PersistedSessionData>) => void;
  clearSession: () => void;
  recordDisconnect: () => void;
  clearDisconnect: () => void;
  attemptRestoreSession: () => boolean;
}

/**
 * Safely reads and parses persisted session from sessionStorage
 */
export function getStoredSession(): PersistedSessionData | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSessionData;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.sessionToken === 'string' &&
      typeof parsed.playerId === 'string' &&
      typeof parsed.playerName === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('[SessionPersistence] Failed to parse sessionStorage data:', err);
    return null;
  }
}

/**
 * Safely serializes and saves persisted session to sessionStorage
 */
export function saveStoredSession(data: PersistedSessionData): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[SessionPersistence] Failed to write to sessionStorage:', err);
  }
}

/**
 * Clears persisted session from sessionStorage
 */
export function clearStoredSession(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('[SessionPersistence] Failed to clear sessionStorage:', err);
  }
}

/**
 * Checks whether a session data qualifies for the 30-second reconnection tolerance window
 */
export function isSessionEligibleForReconnect(data: PersistedSessionData | null): boolean {
  if (!data || !data.lastRoomId) {
    return false;
  }
  if (data.disconnectedAt === null) {
    return true;
  }
  const elapsed = Date.now() - data.disconnectedAt;
  return elapsed >= 0 && elapsed <= RECONNECT_WINDOW_MS;
}

/**
 * Computes remaining seconds within the 30-second reconnect window
 */
export function calculateRemainingReconnectSeconds(data: PersistedSessionData | null): number {
  if (!data || !data.lastRoomId) {
    return 0;
  }
  if (data.disconnectedAt === null) {
    return RECONNECT_WINDOW_SECONDS;
  }
  const elapsed = Date.now() - data.disconnectedAt;
  const remaining = Math.ceil((RECONNECT_WINDOW_MS - elapsed) / 1000);
  return Math.max(0, Math.min(RECONNECT_WINDOW_SECONDS, remaining));
}

/**
 * Custom Hook: useSessionPersistence
 * 
 * Manages player session data (sessionToken, playerId, playerName, activeRoomId)
 * and maintains 30-second reconnect window tracking across reloads and disconnects.
 */
export function useSessionPersistence(): UseSessionPersistenceReturn {
  const storeSessionToken = useGameStore((state) => state.sessionToken);
  const storePlayerId = useGameStore((state) => state.playerId);
  const storePlayerName = useGameStore((state) => state.playerName);
  const storeRoomId = useGameStore((state) => state.roomState?.id ?? null);
  const storeWsConnected = useGameStore((state) => state.wsConnected);

  const [sessionData, setSessionData] = useState<PersistedSessionData | null>(() => getStoredSession());
  const [remainingReconnectSeconds, setRemainingReconnectSeconds] = useState<number>(() =>
    calculateRemainingReconnectSeconds(getStoredSession())
  );

  const prevWsConnectedRef = useRef(storeWsConnected);
  const activeRoomIdRef = useRef(storeRoomId);

  useEffect(() => {
    activeRoomIdRef.current = storeRoomId;
  }, [storeRoomId]);

  /**
   * Save or update session fields in both state and sessionStorage
   */
  const saveSession = useCallback((updates: Partial<PersistedSessionData>) => {
    setSessionData((prev) => {
      const current = prev || {
        sessionToken: useGameStore.getState().sessionToken,
        playerId: useGameStore.getState().playerId,
        playerName: useGameStore.getState().playerName,
        lastRoomId: null,
        disconnectedAt: null,
      };

      const nextData: PersistedSessionData = {
        ...current,
        ...updates,
      };

      saveStoredSession(nextData);
      return nextData;
    });
  }, []);

  /**
   * Completely clear session state and storage
   */
  const clearSession = useCallback(() => {
    clearStoredSession();
    setSessionData(null);
    setRemainingReconnectSeconds(0);
  }, []);

  /**
   * Record disconnect timestamp to start 30s grace window
   */
  const recordDisconnect = useCallback(() => {
    const now = Date.now();
    saveSession({ disconnectedAt: now });
  }, [saveSession]);

  /**
   * Clear disconnect timestamp upon successful reconnect
   */
  const clearDisconnect = useCallback(() => {
    saveSession({ disconnectedAt: null });
  }, [saveSession]);

  /**
   * Attempt to restore stored session credentials into useGameStore
   */
  const attemptRestoreSession = useCallback((): boolean => {
    const stored = getStoredSession();
    if (!stored) return false;

    // Synchronize stored session identity to Zustand store
    useGameStore.setState({
      sessionToken: stored.sessionToken,
      playerId: stored.playerId,
      playerName: stored.playerName,
    });

    if (stored.lastRoomId && isSessionEligibleForReconnect(stored)) {
      useGameStore.setState({ roomCodeInput: stored.lastRoomId });
    }

    setSessionData(stored);
    setRemainingReconnectSeconds(calculateRemainingReconnectSeconds(stored));
    return true;
  }, []);

  // Sync store changes to sessionStorage during normal gameplay
  useEffect(() => {
    const existing = getStoredSession();
    const updated: PersistedSessionData = {
      sessionToken: storeSessionToken,
      playerId: storePlayerId,
      playerName: storePlayerName,
      lastRoomId: storeRoomId || (existing?.lastRoomId ?? null),
      disconnectedAt: existing?.disconnectedAt ?? null,
    };

    saveStoredSession(updated);
    setSessionData(updated);
  }, [storeSessionToken, storePlayerId, storePlayerName, storeRoomId]);

  // Window unload and pagehide listeners: mark disconnectedAt if player is in an active room
  useEffect(() => {
    const handleUnload = () => {
      if (activeRoomIdRef.current) {
        const stored = getStoredSession();
        if (stored) {
          stored.disconnectedAt = Date.now();
          saveStoredSession(stored);
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  // Listen for WebSocket disconnects to trigger 30s countdown
  useEffect(() => {
    if (prevWsConnectedRef.current && !storeWsConnected && storeRoomId) {
      // Transitioned from connected to disconnected while in a room
      recordDisconnect();
    } else if (!prevWsConnectedRef.current && storeWsConnected) {
      // Reconnected
      clearDisconnect();
    }
    prevWsConnectedRef.current = storeWsConnected;
  }, [storeWsConnected, storeRoomId, recordDisconnect, clearDisconnect]);

  // Reconnection countdown timer (30s window)
  useEffect(() => {
    if (!sessionData?.disconnectedAt) {
      setRemainingReconnectSeconds(sessionData?.lastRoomId ? RECONNECT_WINDOW_SECONDS : 0);
      return;
    }

    const updateRemaining = () => {
      const remaining = calculateRemainingReconnectSeconds(sessionData);
      setRemainingReconnectSeconds(remaining);
      if (remaining === 0) {
        // Reconnect window expired
        setSessionData((prev) => {
          if (!prev) return null;
          const expired = { ...prev, lastRoomId: null };
          saveStoredSession(expired);
          return expired;
        });
      }
    };

    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [sessionData?.disconnectedAt, sessionData?.lastRoomId]);

  const isEligibleForReconnect = isSessionEligibleForReconnect(sessionData) && remainingReconnectSeconds > 0;

  return {
    sessionData,
    isEligibleForReconnect,
    remainingReconnectSeconds,
    saveSession,
    clearSession,
    recordDisconnect,
    clearDisconnect,
    attemptRestoreSession,
  };
}

export default useSessionPersistence;

