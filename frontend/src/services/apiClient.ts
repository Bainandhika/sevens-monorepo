/// <reference types="vite/client" />

import { ServerHealthStatus } from '../types/game';
import { useGameStore } from '../store/useGameStore';

/**
 * Health check response model from Go backend (/healthz)
 */
export interface HealthCheckResponse {
  status: string;
  time: string;
  latencyMs: number;
}

/**
 * Interface contract for API Client Service
 */
export interface ApiClientService {
  getApiBaseUrl: () => string;
  getWsBaseUrl: () => string;
  pingHealthCheck: (timeoutMs?: number) => Promise<HealthCheckResponse>;
  startSilentWakeUp: (
    onStatusChange?: (status: 'ready' | 'waking' | 'offline', latencyMs: number) => void
  ) => () => void;
}

/**
 * Polling and retry configurations for Silent Wake-Up mechanism
 */
const COLD_START_RETRY_INTERVAL_MS = 3000; // 3 seconds retry polling during cold start
const READY_HEARTBEAT_INTERVAL_MS = 30000;  // 30 seconds passive keep-alive check once ready
const DEFAULT_TIMEOUT_MS = 5000;            // 5 seconds timeout per healthcheck request

/**
 * Resolves the backend HTTP API Base URL.
 * Checks environment variables first (VITE_API_URL, VITE_API_BASE_URL, VITE_BACKEND_URL).
 * If running locally (localhost / 127.0.0.1), defaults to Go backend on port 8080.
 * In production / cloud, falls back to window.location.origin.
 */
export function getApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const metaEnv = import.meta.env as Record<string, string | undefined>;
    const envUrl =
      metaEnv.VITE_API_URL ||
      metaEnv.VITE_API_BASE_URL ||
      metaEnv.VITE_BACKEND_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim().replace(/\/+$/, '');
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port } = window.location;

    // Local dev: Go server listens on port 8080 by default
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port !== '8080') {
        return `http://${hostname}:8080`;
      }
      return `http://${hostname}:${port}`;
    }

    return window.location.origin.replace(/\/+$/, '');
  }

  return 'http://localhost:8080';
}

/**
 * Resolves the backend WebSocket Base URL for Melody ('/ws').
 * Converts http(s) -> ws(s) and appends /ws route.
 */
export function getWsBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const metaEnv = import.meta.env as Record<string, string | undefined>;
    const envWs =
      metaEnv.VITE_WS_URL ||
      metaEnv.VITE_WS_BASE_URL;
    if (envWs && typeof envWs === 'string' && envWs.trim().length > 0) {
      return envWs.trim();
    }
  }

  const apiBase = getApiBaseUrl();
  try {
    const parsed = new URL(apiBase);
    const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${parsed.host}/ws`;
  } catch {
    if (typeof window !== 'undefined' && window.location) {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const { hostname } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `ws://${hostname}:8080/ws`;
      }
      return `${wsProto}//${window.location.host}/ws`;
    }
    return 'ws://localhost:8080/ws';
  }
}

/**
 * Sends a non-blocking GET request to '/healthz' and measures latency in milliseconds.
 *
 * @param timeoutMs Maximum wait time before aborting (default: 5000ms).
 * @returns HealthCheckResponse with server status, timestamp, and measured ping latency.
 */
export async function pingHealthCheck(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<HealthCheckResponse> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const url = `${baseUrl}/healthz`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const latencyMs = Math.max(1, Math.round(endTime - startTime));

    if (!response.ok) {
      throw new Error(`Healthcheck HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      status: (data && data.status) ? String(data.status) : 'ok',
      time: (data && data.time) ? String(data.time) : new Date().toISOString(),
      latencyMs,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Starts the Silent Wake-Up non-blocking polling mechanism against Go backend (/healthz).
 *
 * - Non-blocking: Runs in the background without freezing or delaying the UI.
 * - Updates Zustand store (useGameStore):
 *   - 'waking' (yellow pulsing dot) during cold start requests or timeouts.
 *   - 'ready' (green dot + pingMs) once 200 OK is received from /healthz.
 *   - 'offline' when client loses network connection.
 * - Auto-retries every 3 seconds while server is spinning up from cold sleep.
 * - Once awake, runs a gentle 30s heartbeat to prevent Render free-tier idle spin-down.
 *
 * @param onStatusChange Optional callback receiving (status, latencyMs) updates.
 * @returns Cleanup function to stop polling and remove network event listeners.
 */
export function startSilentWakeUp(
  onStatusChange?: (status: 'ready' | 'waking' | 'offline', latencyMs: number) => void
): () => void {
  let isStopped = false;
  let activeTimer: ReturnType<typeof setTimeout> | null = null;

  const updateStatus = (status: ServerHealthStatus, latencyMs = 0) => {
    if (isStopped) return;

    try {
      useGameStore.setState({
        serverHealth: status,
        ...(latencyMs > 0 ? { pingMs: latencyMs } : {}),
      });
    } catch {
      // Safe fallback if called in isolated test environment
    }

    if (onStatusChange) {
      try {
        onStatusChange(status, latencyMs);
      } catch (err) {
        console.error('[SilentWakeUp] Error in onStatusChange callback:', err);
      }
    }
  };

  const scheduleNext = (delayMs: number) => {
    if (isStopped) return;
    if (activeTimer) {
      clearTimeout(activeTimer);
    }
    activeTimer = setTimeout(() => {
      void executeProbe();
    }, delayMs);
  };

  const executeProbe = async () => {
    if (isStopped) return;

    // Check device connectivity first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      updateStatus('offline', 0);
      scheduleNext(COLD_START_RETRY_INTERVAL_MS);
      return;
    }

    try {
      const response = await pingHealthCheck(DEFAULT_TIMEOUT_MS);
      if (isStopped) return;

      if (response && response.status === 'ok') {
        // Cold start complete: Server is alive and responsive
        updateStatus('ready', response.latencyMs);
        scheduleNext(READY_HEARTBEAT_INTERVAL_MS);
      } else {
        // Server returned non-ok payload
        updateStatus('waking', response?.latencyMs || 0);
        scheduleNext(COLD_START_RETRY_INTERVAL_MS);
      }
    } catch {
      if (isStopped) return;

      // Server is cold-starting or timed out
      const isDeviceOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const nextStatus: ServerHealthStatus = isDeviceOffline ? 'offline' : 'waking';
      updateStatus(nextStatus, 0);

      // Auto-retry polling every 3 seconds during cold start
      scheduleNext(COLD_START_RETRY_INTERVAL_MS);
    }
  };

  // Online / Offline window listeners for instant responsiveness
  const handleOnline = () => {
    if (isStopped) return;
    updateStatus('waking', 0);
    void executeProbe();
  };

  const handleOffline = () => {
    if (isStopped) return;
    updateStatus('offline', 0);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Initial state setup: Mark 'waking' and fire probe immediately
  const initialOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  updateStatus(initialOffline ? 'offline' : 'waking', 0);
  void executeProbe();

  // Return cleanup teardown function
  return () => {
    isStopped = true;
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
}

/**
 * Singleton API Client service instance
 */
export const apiClient: ApiClientService = {
  getApiBaseUrl,
  getWsBaseUrl,
  pingHealthCheck,
  startSilentWakeUp,
};

export default apiClient;
