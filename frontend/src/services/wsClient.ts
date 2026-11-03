import {
  AceMode,
  Card,
  Player,
  RoomState,
  Suit,
} from '../types/game';
import { getWsBaseUrl, pingHealthCheck } from './apiClient';
import { useGameStore, getInitials } from '../store/useGameStore';
import { AVATAR_COLORS } from '../constants/designTokens';

/**
 * WebSocket Outgoing Event Types for 7-an (Tujuhan Tactical)
 */
export type WSOutgoingEventType =
  | 'join'
  | 'toggle_ready'
  | 'start_game'
  | 'play_card'
  | 'pass'
  | 'fold_card'
  | 'rematch'
  | 'leave_room'
  | 'ping';

/**
 * Callbacks interface for WebSocket client consumers
 */
export interface WSClientCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onRoomStateUpdate: (roomState: RoomState) => void;
  onLatencyUpdate: (pingMs: number) => void;
  onError: (message: string) => void;
}

/**
 * Core interface contract for WebSocket Client Service
 */
export interface WSClientService {
  connectAndJoin: (params: {
    roomId: string;
    playerId: string;
    playerName: string;
    sessionToken: string;
  }) => void;
  sendToggleReady: (roomId: string, playerId: string) => void;
  sendStartGame: (roomId: string) => void;
  sendPlayCard: (roomId: string, playerId: string, card: Card) => void;
  sendFoldCard: (roomId: string, playerId: string, card: Card) => void;
  sendRematch: (roomId: string, playerId: string) => void;
  disconnect: () => void;
}

/**
 * Extended interface for client instance management
 */
export interface WSClientInstance extends WSClientService {
  setCallbacks: (callbacks: Partial<WSClientCallbacks>) => void;
  getCallbacks: () => WSClientCallbacks;
  isConnected: () => boolean;
  getActiveParams: () => {
    roomId: string;
    playerId: string;
    playerName: string;
    sessionToken: string;
  } | null;
}

/**
 * Timing constants adhering to PRD F2, F3 & UI Rules
 */
const CONNECTION_TIMEOUT_MS = 2500; // 2.5 seconds timeout before triggering ColdStartModal
const RETRY_INTERVAL_MS = 3000;     // 3 seconds interval for cold-start and reconnect polling
const RECONNECT_WINDOW_MS = 30000;  // 30 seconds reconnect tolerance window
const HEARTBEAT_INTERVAL_MS = 8000; // 8 seconds interval for heartbeat ping measurements

/**
 * Storage keys for session persistence across page refreshes / brief disconnects
 */
const STORAGE_ROOM_ID_KEY = 'sevens_active_room_id';
const STORAGE_SESSION_TOKEN_KEY = 'sevens_session_token';

/**
 * Generates a unique 6-character uppercase alphanumeric room code (e.g., '7X9K2A').
 * Excludes easily confusable characters (0, O, 1, I) to guarantee high readability.
 */
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      result += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

/**
 * Normalizes incoming raw Go backend room JSON into client RoomState SSOT.
 * Applies Host Migration logic if the original host has left or disconnected.
 */
export function normalizeRoomState(raw: any, fallbackRoomId: string): RoomState {
  const rawSuits = raw?.board?.suits || {};
  const suitsState = {
    spades: rawSuits.spades || { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
    hearts: rawSuits.hearts || { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
    clubs: rawSuits.clubs || { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
    diamonds: rawSuits.diamonds || { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
  };

  const rawPlayers: any[] = Array.isArray(raw?.players) ? raw.players : [];

  let players: Player[] = rawPlayers.map((p: any, index: number) => ({
    id: String(p.id || `player_${index + 1}`),
    name: String(p.name || `Pemain ${index + 1}`),
    initials: p.initials || getInitials(p.name || `P${index + 1}`),
    avatarColor: p.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length],
    isBot: Boolean(p.isBot),
    botLevel: p.botLevel || (p.isBot ? 'hard' : undefined),
    isHost: Boolean(p.isHost ?? (index === 0)),
    isReady: Boolean(p.isReady),
    hand: Array.isArray(p.hand) ? p.hand : [],
    foldedCards: Array.isArray(p.foldedCards) ? p.foldedCards : [],
    penaltyPoints: Number(p.penaltyPoints ?? p.penalties ?? 0),
    lossesCount: Number(p.lossesCount ?? 0),
    isConnected: p.isConnected !== false,
  }));

  // Host Migration: Ensure there is always exactly one active host among connected human players
  const activeHumans = players.filter((p) => !p.isBot && p.isConnected);
  const currentHost = players.find((p) => p.isHost && !p.isBot && p.isConnected);

  if (!currentHost && activeHumans.length > 0) {
    const newHostId = activeHumans[0].id;
    players = players.map((p) => ({
      ...p,
      isHost: p.id === newHostId,
    }));
  }

  return {
    id: String(raw?.id || fallbackRoomId),
    mode: 'online',
    status: (raw?.status as 'waiting' | 'playing' | 'finished') || 'waiting',
    roundNumber: Number(raw?.roundNumber || 1),
    turnNumber: Number(raw?.turnNumber || 1),
    currentTurn: String(raw?.currentTurn || (players[0]?.id || '')),
    aceMode: (raw?.aceMode as AceMode) || 'LOCKED_NONE',
    openerSuit: (raw?.openerSuit as Suit) || 'spades',
    board: {
      suits: suitsState,
    },
    players,
    scores: raw?.scores,
  };
}

/**
 * Creates an isolated or singleton instance of the WebSocket Client Service.
 */
export function createWsClient(initialCallbacks?: Partial<WSClientCallbacks>): WSClientInstance {
  let socket: WebSocket | null = null;
  let activeParams: {
    roomId: string;
    playerId: string;
    playerName: string;
    sessionToken: string;
  } | null = null;

  let isManualDisconnect = false;
  let coldStartTimer: any = null;
  let retryTimer: any = null;
  let heartbeatTimer: any = null;
  let reconnectStartTime: number | null = null;
  let lastPingTimestamp = 0;
  let lastPongTimestamp = 0;

  const callbacks: WSClientCallbacks = {
    onConnected: () => {},
    onDisconnected: () => {},
    onRoomStateUpdate: () => {},
    onLatencyUpdate: () => {},
    onError: () => {},
    ...initialCallbacks,
  };

  /**
   * Helper to send JSON messages over WebSocket with graceful safety check
   */
  function sendEvent(type: WSOutgoingEventType, payload: Record<string, any>) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      socket.send(JSON.stringify({ type, payload }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears all running background timers
   */
  function clearAllTimers() {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  /**
   * Heartbeat ping measurement runner
   */
  function startHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        lastPingTimestamp = Date.now();
        sendEvent('ping', { timestamp: lastPingTimestamp });

        // Fallback: if no WebSocket pong returned within 12 seconds, check via apiClient HTTP healthz
        if (Date.now() - lastPongTimestamp > 12000) {
          pingHealthCheck(3000)
            .then((res) => {
              if (res.latencyMs > 0) {
                callbacks.onLatencyUpdate(res.latencyMs);
                useGameStore.setState({ pingMs: res.latencyMs });
              }
            })
            .catch(() => {});
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Internal connection worker
   */
  function doConnect() {
    if (!activeParams || isManualDisconnect) {
      return;
    }

    const { roomId, playerId, playerName, sessionToken } = activeParams;

    // Preserve room code in useGameStore without losing input on retries
    useGameStore.getState().setRoomCodeInput(roomId);

    // Persist session tokens for 30s reconnect tolerance
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(STORAGE_ROOM_ID_KEY, roomId);
        window.sessionStorage.setItem(STORAGE_SESSION_TOKEN_KEY, sessionToken);
      } catch {
        // Storage quota or privacy sandbox errors ignored safely
      }
    }

    // UI Rule: If serverHealth is 'waking', open ColdStartModal immediately
    if (useGameStore.getState().serverHealth === 'waking') {
      useGameStore.getState().setModal('cold_start');
    }

    // UI Rule: Start 2.5s watchdog. If socket fails to open in 2.5s, trigger ColdStartModal
    if (coldStartTimer) clearTimeout(coldStartTimer);
    coldStartTimer = setTimeout(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        useGameStore.getState().setModal('cold_start');
      }
    }, CONNECTION_TIMEOUT_MS);

    // Clean up any stale socket connection
    if (socket) {
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      } catch {
        // Ignore close errors on stale sockets
      }
      socket = null;
    }

    const wsUrl = getWsBaseUrl();

    try {
      socket = new WebSocket(wsUrl);
    } catch (err: any) {
      callbacks.onError(err?.message || 'Gagal menginisialisasi WebSocket client.');
      scheduleAutoRetry();
      return;
    }

    socket.onopen = () => {
      // Clear 2.5s cold start timer
      if (coldStartTimer) {
        clearTimeout(coldStartTimer);
        coldStartTimer = null;
      }

      // Close ColdStartModal once connection is successfully established
      if (useGameStore.getState().activeModal === 'cold_start') {
        useGameStore.getState().setModal('none');
      }

      // Reset reconnect tracking
      reconnectStartTime = null;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }

      // Sync Zustand connection status
      useGameStore.setState({
        wsConnected: true,
        serverHealth: 'ready',
      });

      // Send join event with session token
      sendEvent('join', {
        roomId,
        playerId,
        name: playerName,
        sessionToken,
      });

      // Start ping heartbeat
      lastPongTimestamp = Date.now();
      startHeartbeat();

      callbacks.onConnected();
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const msgType = data?.type;
        const payload = data?.payload;

        if (msgType === 'room_state' && payload) {
          const normalized = normalizeRoomState(payload, roomId);
          useGameStore.getState().syncServerRoomState(normalized);
          callbacks.onRoomStateUpdate(normalized);
        } else if (msgType === 'pong') {
          lastPongTimestamp = Date.now();
          const latency = Math.max(1, Math.round(lastPongTimestamp - (payload?.timestamp || lastPingTimestamp)));
          useGameStore.setState({ pingMs: latency });
          callbacks.onLatencyUpdate(latency);
        } else if (msgType === 'error') {
          const errMsg = payload?.message || 'Terjadi kesalahan pada server WebSocket.';
          callbacks.onError(errMsg);
        }
      } catch {
        // Ignore unparseable or ping frames
      }
    };

    socket.onerror = () => {
      callbacks.onError('Terjadi gangguan pada koneksi WebSocket.');
    };

    socket.onclose = () => {
      if (coldStartTimer) {
        clearTimeout(coldStartTimer);
        coldStartTimer = null;
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      useGameStore.setState({ wsConnected: false });
      callbacks.onDisconnected();

      if (!isManualDisconnect && activeParams) {
        scheduleAutoRetry();
      }
    };
  }

  /**
   * Auto-reconnect scheduler within the 30-second window
   */
  function scheduleAutoRetry() {
    if (isManualDisconnect || !activeParams) {
      return;
    }

    if (reconnectStartTime === null) {
      reconnectStartTime = Date.now();
    }

    const elapsed = Date.now() - reconnectStartTime;

    if (elapsed < RECONNECT_WINDOW_MS) {
      // Auto-retry connection every 3 seconds without losing input room code
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (!isManualDisconnect && activeParams) {
          doConnect();
        }
      }, RETRY_INTERVAL_MS);
    } else {
      // 30 seconds reconnect window expired
      reconnectStartTime = null;
      clearAllTimers();
      callbacks.onError('Batas waktu penyambungan kembali (30 detik) telah habis.');
      useGameStore.getState().showToast('⚠️', 'Batas waktu reconnect 30 detik habis.');
    }
  }

  return {
    setCallbacks(newCallbacks: Partial<WSClientCallbacks>) {
      Object.assign(callbacks, newCallbacks);
    },

    getCallbacks() {
      return callbacks;
    },

    isConnected() {
      return socket !== null && socket.readyState === WebSocket.OPEN;
    },

    getActiveParams() {
      return activeParams;
    },

    connectAndJoin(params: {
      roomId: string;
      playerId: string;
      playerName: string;
      sessionToken: string;
    }) {
      isManualDisconnect = false;
      const cleanRoomId = (params.roomId || '').trim().toUpperCase();
      activeParams = {
        roomId: cleanRoomId,
        playerId: params.playerId,
        playerName: params.playerName,
        sessionToken: params.sessionToken,
      };

      doConnect();
    },

    sendToggleReady(roomId: string, playerId: string) {
      sendEvent('toggle_ready', { roomId, playerId });
    },

    sendStartGame(roomId: string) {
      sendEvent('start_game', { roomId });
    },

    sendPlayCard(roomId: string, playerId: string, card: Card) {
      sendEvent('play_card', { roomId, playerId, card });
    },

    sendFoldCard(roomId: string, playerId: string, card: Card) {
      // Send fold_card event containing card detail
      sendEvent('fold_card', { roomId, playerId, card });
      // Also send pass payload for full Go handlePass backend compatibility
      sendEvent('pass', { roomId, playerId });
    },

    sendRematch(roomId: string, playerId: string) {
      sendEvent('rematch', { roomId, playerId });
    },

    disconnect() {
      isManualDisconnect = true;
      clearAllTimers();
      reconnectStartTime = null;

      if (socket && socket.readyState === WebSocket.OPEN && activeParams) {
        sendEvent('leave_room', {
          roomId: activeParams.roomId,
          playerId: activeParams.playerId,
        });
      }

      if (socket) {
        try {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close(1000, 'User left room');
        } catch {
          // Ignore close error
        }
        socket = null;
      }

      activeParams = null;
      useGameStore.setState({ wsConnected: false });

      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          window.sessionStorage.removeItem(STORAGE_ROOM_ID_KEY);
        } catch {
          // Ignore
        }
      }

      callbacks.onDisconnected();
    },
  };
}

/**
 * Singleton Default WSClient Service Instance
 */
export const wsClient: WSClientInstance = createWsClient();

export default wsClient;

