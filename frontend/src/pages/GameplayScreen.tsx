import React, { useMemo } from 'react';
import { BoardState, Card, Player } from '../types/game';
import {
  useGameStore,
  getInitials,
  getAceStatusLabel,
} from '../store/useGameStore';
import { useWasmEngine } from '../hooks/useWasmEngine';
import { AppShell } from '../components/layout/AppShell';
import { PlayerBadge } from '../components/game/PlayerBadge';
import { CentralBoard } from '../components/game/CentralBoard';
import { PlayerInteractionDock } from '../components/game/PlayerInteractionDock';
import { KeyCardWarningModal } from '../components/modals/KeyCardWarningModal';
import { SideDrawer } from '../components/modals/SideDrawer';
import { RulesModal } from '../components/modals/RulesModal';
import { BrutalToast } from '../components/ui/BrutalToast';
import { isKeyCard } from '../constants/designTokens';

export interface GameplayScreenProps {
  onSendPlayCard?: (card: Card) => void;
  onSendFoldCard?: (card: Card) => void;
}

/**
 * Fallback Board State used before room state is initialized
 */
const DEFAULT_BOARD_STATE: BoardState = {
  suits: {
    spades: { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
    hearts: { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
    clubs: { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
    diamonds: { minPlayed: 7, maxPlayed: 7, hasSeven: false, hasAce: false },
  },
};

/**
 * Screen 3: Tactical Gameplay Table Screen (Meja Permainan Taktis)
 * Strictly adheres to PRD Bab 6 Layar 3 and Google Stitch Screen ef5426ab71264f46baa2f94d3c3e3fc3:
 *
 * (1) Viewport:
 *     h-screen max-h-screen overflow-hidden flex flex-col justify-between with felt dark green radial gradient.
 *
 * (2) TopHeader:
 *     w-full py-2 px-3 bg-[#F5F0EA] border-b-[3px] border-black flex items-center justify-between.
 *     - Left: Yellow burger button w-8 h-8 + title '7-an' + badge '#XXXXXX' + text 'PUTARAN X'.
 *     - Center: Yellow pill 'Status As: Belum Terbuka / As Rendah (1) / As Tinggi (15)'.
 *     - Right: White reload/info button w-8 h-8.
 *
 * (3) Area Meja (Table Surface):
 *     - Top Row: Opponent 2 (left) and Opponent 3 (right).
 *     - Middle: CentralBoard (4 suit columns x 3 representative cards).
 *     - Bottom Row: User badge Anda (left, with badges 'ANDA', 'GILIRAN', and 'Kalah: Nx')
 *       alongside Opponent 4 (right).
 *
 * (4) Footer:
 *     PlayerInteractionDock supporting single-tap card selection and double-tap immediate play/fold,
 *     split into Folded Cards tray (left, with P: XX penalty badge) and Player Hand grid (right).
 *
 * (5) Overlays & Modals:
 *     SideDrawer, KeyCardWarningModal (high-risk flat +30 penalty for 6 & 8), RulesModal, and BrutalToast.
 */
export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  onSendPlayCard,
  onSendFoldCard,
}) => {
  // Central game state and action dispatchers from Zustand store
  const {
    roomState,
    playerId,
    playerName,
    roomCodeInput,
    pingMs,
    validMoves,
    selectedCard,
    activeModal,
    isDrawerOpen,
    pendingFoldCard,
    toast,
    setModal,
    setDrawerOpen,
    selectCard,
    playSelectedCard,
    attemptFoldCard,
    confirmFoldKeyCard,
    leaveToLobby,
    showToast,
  } = useGameStore();

  // Initialize and run the TinyGo WebAssembly AI engine (with pure TS fallback & 700ms natural bot thinking delay)
  useWasmEngine();

  // Safe room code & round/turn numbers
  const displayRoomCode = useMemo(() => {
    const rawId = roomState?.id || roomCodeInput || '7X9K2A';
    return rawId.replace(/^offline_/, '').toUpperCase();
  }, [roomState?.id, roomCodeInput]);

  const roundNumber = roomState?.roundNumber ?? 1;

  // Current status As formatted string: 'Belum Terbuka' | 'As Rendah (1)' | 'As Tinggi (15)'
  const aceStatusText = useMemo(() => {
    return getAceStatusLabel(roomState?.aceMode ?? 'LOCKED_NONE');
  }, [roomState?.aceMode]);

  // Board state with fallback
  const currentBoard = roomState?.board || DEFAULT_BOARD_STATE;

  // Resolve 4 seated players (User/Anda, Opponent 2, Opponent 3, Opponent 4)
  const { me, opponent2, opponent3, opponent4 } = useMemo(() => {
    const defaultMe: Player = {
      id: playerId || 'guest_me',
      name: playerName || 'Sekop07',
      initials: getInitials(playerName || 'Sekop07'),
      avatarColor: '#00D084',
      isBot: false,
      isReady: true,
      hand: [],
      foldedCards: [],
      penaltyPoints: 0,
      lossesCount: 0,
      isConnected: true,
    };

    const defaultOpponent2: Player = {
      id: 'bot_1',
      name: 'Bot Taktis',
      initials: 'BT',
      avatarColor: '#4F46E5',
      isBot: true,
      isReady: true,
      hand: [],
      foldedCards: [],
      penaltyPoints: 0,
      lossesCount: 1,
      isConnected: false,
    };

    const defaultOpponent3: Player = {
      id: 'bot_2',
      name: 'Bot Cermat',
      initials: 'BC',
      avatarColor: '#F59E0B',
      isBot: true,
      isReady: true,
      hand: [],
      foldedCards: [],
      penaltyPoints: 0,
      lossesCount: 0,
      isConnected: false,
    };

    const defaultOpponent4: Player = {
      id: 'bot_3',
      name: 'Bot Agresif',
      initials: 'BA',
      avatarColor: '#A855F7',
      isBot: true,
      isReady: true,
      hand: [],
      foldedCards: [],
      penaltyPoints: 0,
      lossesCount: 3,
      isConnected: false,
    };

    const playersList = roomState?.players || [];
    if (playersList.length === 0) {
      return {
        me: defaultMe,
        opponent2: defaultOpponent2,
        opponent3: defaultOpponent3,
        opponent4: defaultOpponent4,
      };
    }

    const myIdx = playersList.findIndex((p) => p.id === playerId);
    const safeMyIdx = myIdx >= 0 ? myIdx : 0;

    return {
      me: playersList[safeMyIdx] || defaultMe,
      opponent2: playersList[(safeMyIdx + 1) % playersList.length] || defaultOpponent2,
      opponent3: playersList[(safeMyIdx + 2) % playersList.length] || defaultOpponent3,
      opponent4: playersList[(safeMyIdx + 3) % playersList.length] || defaultOpponent4,
    };
  }, [roomState?.players, playerId, playerName]);

  // Active turn flags
  const currentTurnId = roomState?.currentTurn;
  const isMyTurn = Boolean(currentTurnId && currentTurnId === me.id);
  const isOpponent2Turn = Boolean(currentTurnId && currentTurnId === opponent2.id);
  const isOpponent3Turn = Boolean(currentTurnId && currentTurnId === opponent3.id);
  const isOpponent4Turn = Boolean(currentTurnId && currentTurnId === opponent4.id);

  // Play Card handler (via button, central board slot tap, or double-tap)
  const handlePlayCard = (card: Card) => {
    if (onSendPlayCard) {
      onSendPlayCard(card);
    }
    playSelectedCard(card);
  };

  // Fold Card request handler (validates Anti-Bohong, Anti-Sabotase, and Key Card Warning)
  const handleRequestFoldCard = (card: Card) => {
    const isKey = isKeyCard(card);
    attemptFoldCard(card);

    // If card is non-key, fold is executed synchronously by the store if valid
    if (!isKey && validMoves.length === 0 && card.rank !== 7) {
      onSendFoldCard?.(card);
    }
  };

  // Confirm Key Card fold from KeyCardWarningModal
  const handleConfirmFoldKeyCard = (card: Card) => {
    if (onSendFoldCard) {
      onSendFoldCard(card);
    }
    confirmFoldKeyCard();
  };

  return (
    <AppShell
      variant="felt"
      className="h-screen max-h-screen overflow-hidden flex flex-col justify-between"
    >
      {/* Floating Tactical Toast Notification */}
      <BrutalToast
        visible={toast.visible}
        icon={toast.icon}
        message={toast.message}
        position="top"
      />

      {/* Main Gameplay Screen Container */}
      <div
        id="gameplayViewport"
        data-purpose="mobile-viewport"
        className="relative w-full h-full max-h-screen flex flex-col justify-between overflow-hidden select-none"
      >
        {/* =========================================================================
         * (1) TopHeader: Menu Burger, Judul 7-an, Kode Meja, Ronde, Status As
         * ========================================================================= */}
        <header
          role="banner"
          aria-label="Header Meja Permainan"
          className="w-full py-2 px-3 bg-white border-b-[2.5px] border-black flex items-center justify-between z-30 shrink-0 select-none shadow-[0px_2px_0px_#000000]"
        >
          {/* Sisi Kiri: Tombol Burger + Judul 7-an + Kode Room + Ronde */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buka Menu Samping"
              onClick={() => setDrawerOpen(true)}
              className="w-8 h-8 rounded-lg bg-[#FFE600] hover:bg-yellow-300 border-2 border-black flex items-center justify-center text-black active:translate-x-0.5 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_#000000] focus:outline-none cursor-pointer"
            >
              <svg
                className="w-4 h-4 stroke-black"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-black font-display leading-tight">
                  7-an
                </span>
                <span
                  title={`Kode Meja: #${displayRoomCode}`}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FFE600] text-black font-mono font-black border-2 border-black shadow-[1px_1px_0px_#000000] leading-none"
                >
                  #{displayRoomCode}
                </span>
              </div>
              <span className="text-[10px] text-neutral-600 font-extrabold uppercase tracking-wider leading-none mt-0.5 font-display">
                RONDE {roundNumber}
              </span>
            </div>
          </div>

          {/* Sisi Tengah: Pill Kuning Status As */}
          <div
            title={`Status As: ${aceStatusText}`}
            className="inline-flex items-center bg-[#FFE600] rounded-full px-2.5 py-1 text-[10px] font-black border-2 border-black text-black shadow-[1.5px_1.5px_0px_#000000] whitespace-nowrap"
          >
            <span className="font-display">Status As:&nbsp;</span>
            <span className="text-black underline font-black font-display">
              {aceStatusText}
            </span>
          </div>

          {/* Sisi Kanan: Spacer Penyeimbang */}
          <div className="w-8" aria-hidden="true" />
        </header>

        {/* =========================================================================
         * (2) Area Meja (Table Surface): 3 Lawan & Pemain Utama + CentralBoard
         * ========================================================================= */}
        <main
          role="main"
          aria-label="Permukaan Meja Permainan"
          data-purpose="table-surface"
          className="relative flex-1 px-3 py-1 flex flex-col justify-between overflow-hidden"
        >
          {/* Baris Atas: Lawan 2 (Kiri) dan Lawan 3 (Kanan) */}
          <div
            data-purpose="top-players"
            className="flex justify-between items-start pt-1 z-10 w-full"
          >
            {/* Lawan 2 (Top Left) */}
            <PlayerBadge
              player={opponent2}
              isCurrentTurn={isOpponent2Turn}
              align="left"
              className="animate-idle"
            />

            {/* Lawan 3 (Top Right) */}
            <PlayerBadge
              player={opponent3}
              isCurrentTurn={isOpponent3Turn}
              align="right"
              className="animate-idle-delayed"
            />
          </div>

          {/* Tengah: CentralBoard 4 Kolom Representatif (♠, ♥, ♣, ♦) */}
          <section
            data-purpose="active-board-cards"
            aria-label="Papan Jalur 4 Lambang"
            className="my-auto py-0.5 w-full flex items-center justify-center z-10"
          >
            <CentralBoard
              board={currentBoard}
              selectedCard={selectedCard}
              isMyTurn={isMyTurn}
              onPlaySelectedCard={handlePlayCard}
            />
          </section>

          {/* Baris Bawah: Badge Anda (Kiri) dan Lawan 4 (Kanan) */}
          <div
            data-purpose="lower-players"
            className="flex justify-between items-end pb-1 z-10 w-full"
          >
            {/* Badge Anda (Bottom Left) & Indikator Giliran */}
            <div
              id="userPlayerBadge"
              className="flex items-center gap-1.5 z-10"
            >
              <PlayerBadge
                player={me}
                isCurrentTurn={isMyTurn}
                isMe={true}
                align="left"
              />

              {/* Badge Tambahan GILIRAN Aktif untuk Pemain Utama */}
              {isMyTurn && (
                <span
                  role="status"
                  aria-label="Sedang giliran Anda"
                  className="px-1.5 py-0.5 rounded-md bg-[#00D084] text-black font-black text-[9px] border-2 border-black leading-none shadow-[1.5px_1.5px_0px_#000000] uppercase animate-pulse select-none"
                >
                  GILIRAN
                </span>
              )}
            </div>

            {/* Lawan 4 (Bottom Right) */}
            <PlayerBadge
              player={opponent4}
              isCurrentTurn={isOpponent4Turn}
              align="right"
              className="animate-idle-delayed z-10"
            />
          </div>
        </main>

        {/* =========================================================================
         * (3) Footer: PlayerInteractionDock (TUTUP, MAINKAN, Kartu Tutup, Kartu Tangan)
         * ========================================================================= */}
        <PlayerInteractionDock
          hand={me.hand || []}
          foldedCards={me.foldedCards || []}
          currentPenaltyPoints={me.penaltyPoints || 0}
          validMoves={validMoves}
          selectedCard={selectedCard}
          isMyTurn={isMyTurn}
          onSelectCard={(card) => {
            if (
              selectedCard &&
              selectedCard.suit === card.suit &&
              selectedCard.rank === card.rank
            ) {
              selectCard(null);
            } else {
              selectCard(card);
            }
          }}
          onPlayCard={handlePlayCard}
          onRequestFoldCard={handleRequestFoldCard}
        />
      </div>

      {/* =========================================================================
       * (4) Tactical Overlays & Modals
       * ========================================================================= */}

      {/* Side Navigation Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        roomCode={displayRoomCode}
        playerName={me.name || playerName || 'Pemain'}
        playerInitials={me.initials || getInitials(me.name || playerName || 'P1')}
        isOnline={roomState?.mode === 'online'}
        pingMs={pingMs}
        onClose={() => setDrawerOpen(false)}
        onOpenRules={() => {
          setDrawerOpen(false);
          setModal('rules');
        }}
        onOpenTempScoreboard={() => {
          setDrawerOpen(false);
          showToast(
            '📊',
            `Skor Anda: ${me.penaltyPoints || 0} Poin Penalti (${me.foldedCards?.length || 0} kartu ditutup)`
          );
        }}
        onExitToLobby={() => {
          setDrawerOpen(false);
          leaveToLobby();
        }}
      />

      {/* High-Risk Key Card Warning Modal (6 & 8 Flat +30 Penalty) */}
      <KeyCardWarningModal
        isOpen={activeModal === 'key_warning'}
        targetCard={pendingFoldCard || selectedCard}
        onConfirmFold={handleConfirmFoldKeyCard}
        onCancel={() => setModal('none')}
      />

      {/* Quick Rules Modal */}
      <RulesModal
        isOpen={activeModal === 'rules'}
        onClose={() => setModal('none')}
      />
    </AppShell>
  );
};

export default GameplayScreen;

