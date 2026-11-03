import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from './store/useGameStore';
import { useWasmEngine } from './hooks/useWasmEngine';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { apiClient } from './services/apiClient';
import { wsClient } from './services/wsClient';
import { mockDataService } from './services/mockDataService';
import { LobbyScreen } from './pages/LobbyScreen';
import { WaitingRoomScreen } from './pages/WaitingRoomScreen';
import { GameplayScreen } from './pages/GameplayScreen';
import { ScoreboardScreen } from './pages/ScoreboardScreen';
import { RulesModal } from './components/modals/RulesModal';
import { ColdStartModal } from './components/modals/ColdStartModal';
import { BrutalToast } from './components/ui/BrutalToast';
import { Card } from './types/game';

/**
 * Prop types for the Root App component adhering strictly to Step 25 specification
 */
export type AppRootProps = Record<string, never>;

/**
 * Root Application Assembly, Screen Router & Global Modals Component
 *
 * Responsibilities:
 * 1. Coordinates seamless SPA PWA screen routing between 4 primary screens:
 *    - LobbyScreen ('lobby')
 *    - WaitingRoomScreen ('waiting_room')
 *    - GameplayScreen ('gameplay')
 *    - ScoreboardScreen ('scoreboard')
 * 2. Mounts global Neo-Brutalist overlays accessible from any screen:
 *    - RulesModal (Universal 5-rule tactical guide)
 *    - ColdStartModal (Free Tier Render ~20s container wake-up indicator)
 *    - BrutalToast (Tactile notification banner)
 * 3. Initializes TinyGo WebAssembly Engine ('/game.wasm') via useWasmEngine.
 * 4. Triggers background non-blocking Silent Wake-Up ('/healthz') via apiClient.
 * 5. Integrates WebSocket multiplayer events (wsClient) and mockDataService offline simulation.
 * 6. Manages 30-second session reconnect persistence across reloads via useSessionPersistence.
 */
export const App: React.FC<AppRootProps> = () => {
  const currentScreen = useGameStore((state) => state.currentScreen);
  const setScreen = useGameStore((state) => state.setScreen);
  const activeModal = useGameStore((state) => state.activeModal);
  const setModal = useGameStore((state) => state.setModal);
  const toast = useGameStore((state) => state.toast);
  const showToast = useGameStore((state) => state.showToast);
  const startOfflineGame = useGameStore((state) => state.startOfflineGame);
  const startRematch = useGameStore((state) => state.startRematch);
  const leaveToLobby = useGameStore((state) => state.leaveToLobby);
  const playSelectedCard = useGameStore((state) => state.playSelectedCard);
  const attemptFoldCard = useGameStore((state) => state.attemptFoldCard);

  // Initialize TinyGo WebAssembly Sevens Engine ('/game.wasm') and AI Bot turn runner
  useWasmEngine({ autoExecuteBot: true });

  // Manage 30-second session persistence and reconnect tolerance
  const {
    sessionData,
    isEligibleForReconnect,
    remainingReconnectSeconds,
    attemptRestoreSession,
  } = useSessionPersistence();

  // Cold start wake-up duration and retry counters
  const [coldStartElapsedSeconds, setColdStartElapsedSeconds] = useState(0);
  const reconnectNotifiedRef = useRef(false);

  // (1) Attempt restoring persisted session on initial mount
  useEffect(() => {
    attemptRestoreSession();
  }, [attemptRestoreSession]);

  // (2) Pre-fetch Silent Wake-Up non-blocking polling against backend /healthz
  useEffect(() => {
    const stopSilentWakeUp = apiClient.startSilentWakeUp();
    return () => {
      stopSilentWakeUp();
    };
  }, []);

  // (3) Configure WebSocket client event listeners and state synchronization
  useEffect(() => {
    wsClient.setCallbacks({
      onConnected: () => {
        showToast('⚡', 'Terhubung ke server multiplayer');
      },
      onDisconnected: () => {
        const state = useGameStore.getState();
        if (state.roomState?.mode === 'online') {
          showToast('⚠️', 'Koneksi terputus. Mencoba reconnect...');
        }
      },
      onRoomStateUpdate: (updatedRoom) => {
        const current = useGameStore.getState().currentScreen;
        if (updatedRoom.status === 'waiting' && current !== 'waiting_room') {
          setScreen('waiting_room');
        } else if (updatedRoom.status === 'playing' && current !== 'gameplay') {
          setScreen('gameplay');
        } else if (updatedRoom.status === 'finished' && current !== 'scoreboard') {
          setScreen('scoreboard');
        }
      },
      onLatencyUpdate: () => {
        // Latency is automatically synchronized into Zustand store pingMs
      },
      onError: (errorMessage) => {
        showToast('⚠️', errorMessage);
      },
    });
  }, [setScreen, showToast]);

  // (4) Track ColdStartModal elapsed time and 3s retry interval
  useEffect(() => {
    if (activeModal !== 'cold_start') {
      setColdStartElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setColdStartElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [activeModal]);

  // (5) Notify user if an active room session is eligible for 30s reconnect
  useEffect(() => {
    if (
      isEligibleForReconnect &&
      sessionData?.lastRoomId &&
      currentScreen === 'lobby' &&
      !reconnectNotifiedRef.current
    ) {
      reconnectNotifiedRef.current = true;
      showToast(
        '⚡',
        `Sesi aktif Room #${sessionData.lastRoomId} (${remainingReconnectSeconds}s). Klik Gabung untuk kembali.`
      );
    }
  }, [isEligibleForReconnect, sessionData, currentScreen, remainingReconnectSeconds, showToast]);

  // --- Handlers: Lobby Screen ---
  const handleCreateOnlineRoom = useCallback(() => {
    const { serverHealth, playerId, playerName, sessionToken } = useGameStore.getState();

    if (serverHealth === 'waking') {
      setModal('cold_start');
    }

    // Generate unique 6-character room code via mockDataService SSOT
    const roomCode = mockDataService.generateRoomCode();
    useGameStore.getState().setRoomCodeInput(roomCode);

    // Connect to WebSocket room
    wsClient.connectAndJoin({
      roomId: roomCode,
      playerId,
      playerName: playerName || 'Sekop07',
      sessionToken,
    });

    setScreen('waiting_room');
    showToast('🏠', `Room #${roomCode} dibuat! Bagikan kode ke teman.`);
  }, [setModal, setScreen, showToast]);

  const handleJoinOnlineRoom = useCallback(
    (roomCode: string) => {
      const sanitized = roomCode.trim().toUpperCase();
      const { serverHealth, playerId, playerName, sessionToken } = useGameStore.getState();

      if (serverHealth === 'waking') {
        setModal('cold_start');
      }

      useGameStore.getState().setRoomCodeInput(sanitized);

      wsClient.connectAndJoin({
        roomId: sanitized,
        playerId,
        playerName: playerName || 'Sekop07',
        sessionToken,
      });

      setScreen('waiting_room');
      showToast('🔗', `Bergabung ke Room #${sanitized}...`);
    },
    [setModal, setScreen, showToast]
  );

  // --- Handlers: Waiting Room Screen ---
  const handleToggleReady = useCallback(() => {
    const { roomState, playerId } = useGameStore.getState();
    if (roomState && roomState.id) {
      wsClient.sendToggleReady(roomState.id, playerId);
    }
  }, []);

  const handleStartOnlineMatch = useCallback(() => {
    const { roomState } = useGameStore.getState();
    if (roomState && roomState.id) {
      wsClient.sendStartGame(roomState.id);
      showToast('🚀', 'Memulai pertandingan online...');
    }
  }, [showToast]);

  const handleLeaveRoom = useCallback(() => {
    wsClient.disconnect();
    leaveToLobby();
    showToast('🚪', 'Kembali ke Lobi');
  }, [leaveToLobby, showToast]);

  // --- Handlers: Gameplay Screen ---
  const handleSendPlayCard = useCallback(
    (card: Card) => {
      const { roomState, playerId } = useGameStore.getState();
      if (roomState?.mode === 'online') {
        wsClient.sendPlayCard(roomState.id, playerId, card);
      } else {
        playSelectedCard(card);
      }
    },
    [playSelectedCard]
  );

  const handleSendFoldCard = useCallback(
    (card: Card) => {
      const { roomState, playerId } = useGameStore.getState();
      if (roomState?.mode === 'online') {
        wsClient.sendFoldCard(roomState.id, playerId, card);
      } else {
        attemptFoldCard(card);
      }
    },
    [attemptFoldCard]
  );

  // --- Handlers: Scoreboard Screen ---
  const handleRequestRematch = useCallback(() => {
    const { roomState, playerId } = useGameStore.getState();
    if (roomState?.mode === 'online') {
      wsClient.sendRematch(roomState.id, playerId);
      showToast('🔄', 'Mengajukan Rematch ke server...');
    } else {
      // Offline mode: trigger instant re-deal with Auto-Reshuffle rule
      startRematch();
    }
  }, [startRematch, showToast]);

  const handleReturnToLobby = useCallback(() => {
    const { roomState } = useGameStore.getState();
    if (roomState?.mode === 'online') {
      wsClient.disconnect();
    }
    leaveToLobby();
    showToast('🏠', 'Kembali ke Lobi');
  }, [leaveToLobby, showToast]);

  // --- Handlers: Cold Start Modal ---
  const handleCancelColdStartAndPlayOffline = useCallback(() => {
    wsClient.disconnect();
    setModal('none');
    startOfflineGame();
    showToast('🤖', 'Beralih ke mode Versus AI (Offline)');
  }, [setModal, startOfflineGame, showToast]);

  const handleCloseColdStart = useCallback(() => {
    wsClient.disconnect();
    setModal('none');
  }, [setModal]);

  // Render active primary screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'lobby':
        return (
          <LobbyScreen
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
          />
        );
      case 'waiting_room':
        return (
          <WaitingRoomScreen
            onToggleReady={handleToggleReady}
            onStartOnlineMatch={handleStartOnlineMatch}
            onLeaveRoom={handleLeaveRoom}
          />
        );
      case 'gameplay':
        return (
          <GameplayScreen
            onSendPlayCard={handleSendPlayCard}
            onSendFoldCard={handleSendFoldCard}
          />
        );
      case 'scoreboard':
        return (
          <ScoreboardScreen
            onRequestRematch={handleRequestRematch}
            onReturnToLobby={handleReturnToLobby}
          />
        );
      default:
        return (
          <LobbyScreen
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F0EA] flex flex-col font-body selection:bg-[#FFE600] selection:text-black">
      {/* Primary Screen Viewport (SPA PWA Smooth Routing) */}
      {renderCurrentScreen()}

      {/* Global Rules Modal accessible from any screen */}
      <RulesModal
        isOpen={activeModal === 'rules'}
        onClose={() => setModal('none')}
      />

      {/* Free Tier Render Silent Wake-Up Cold Start Modal */}
      <ColdStartModal
        isOpen={activeModal === 'cold_start'}
        retryCount={Math.floor(coldStartElapsedSeconds / 3)}
        elapsedSeconds={coldStartElapsedSeconds}
        onCancelAndPlayOffline={handleCancelColdStartAndPlayOffline}
        onClose={handleCloseColdStart}
      />

      {/* Global Neo-Brutalist Tactical Floating Toast Banner */}
      <BrutalToast
        visible={toast.visible}
        icon={toast.icon}
        message={toast.message}
      />
    </div>
  );
};

export default App;

