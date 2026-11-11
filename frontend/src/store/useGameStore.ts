import { create } from 'zustand';
import {
  AceMode,
  BoardState,
  BotDifficulty,
  Card,
  ModalType,
  Player,
  PlayerScoreDetail,
  RoomState,
  ScreenName,
  ServerHealthStatus,
  Suit,
} from '../types/game';
import {
  ACE_MODE_LABELS,
  ALL_SUITS,
  ALL_RANKS,
  AVATAR_COLORS,
  DICE_NICKNAME_PRESETS,
  MAX_NICKNAME_LENGTH,
  ROOM_CODE_LENGTH,
  SUIT_NAMES_ID,
  calculateCardPenalty,
  isKeyCard,
} from '../constants/designTokens';
import { evaluateRTRWAfterRound } from '../services/mockDataService';

/**
 * LocalStorage settings persistence schema for Tujuhan Tactical
 */
const SETTINGS_STORAGE_KEY = 'sevens_settings_v1';

function getInitialSettings(): { audioEnabled: boolean; doubleTapEnabled: boolean } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : true,
          doubleTapEnabled: typeof parsed.doubleTapEnabled === 'boolean' ? parsed.doubleTapEnabled : true,
        };
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return { audioEnabled: true, doubleTapEnabled: true };
}

function persistSettings(settings: { audioEnabled: boolean; doubleTapEnabled: boolean }) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Interface for central Zustand Game Store state and actions
 */
export interface GameStoreState {
  currentScreen: ScreenName;
  playerId: string;
  sessionToken: string;
  playerName: string;
  offlineDifficulty: BotDifficulty;
  roomCodeInput: string;
  serverHealth: ServerHealthStatus;
  pingMs: number;
  wasmReady: boolean;
  wsConnected: boolean;
  roomState: RoomState | null;
  validMoves: Card[];
  selectedCard: Card | null;
  activeModal: ModalType;
  isDrawerOpen: boolean;
  pendingFoldCard: Card | null;
  toast: { visible: boolean; icon: string; message: string };
  audioEnabled: boolean;
  doubleTapEnabled: boolean;
  setScreen: (screen: ScreenName) => void;
  setPlayerName: (name: string) => void;
  randomizePlayerName: () => void;
  setOfflineDifficulty: (diff: BotDifficulty) => void;
  setRoomCodeInput: (code: string) => void;
  showToast: (icon: string, message: string) => void;
  setModal: (modal: ModalType) => void;
  setDrawerOpen: (open: boolean) => void;
  selectCard: (card: Card | null) => void;
  startOfflineGame: () => void;
  playSelectedCard: (card?: Card) => void;
  attemptFoldCard: (card?: Card) => void;
  confirmFoldKeyCard: () => void;
  triggerRematch: () => void;
  confirmRematch: () => void;
  startRematch: () => void;
  toggleAudio: () => void;
  toggleDoubleTap: () => void;
  leaveToLobby: () => void;
  syncServerRoomState: (state: RoomState) => void;
  getAceStatusLabel: () => string;
}

/**
 * Helper to generate 2-character avatar initials from player nickname
 * e.g., 'Sekop07' -> 'S7', 'Wajik99' -> 'W9', 'Ksatria' -> 'KS'
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '7';
  const clean = name.trim();
  if (clean.length === 1) return clean.toUpperCase();

  const lastChar = clean[clean.length - 1];
  if (/\d/.test(lastChar)) {
    return (clean[0] + lastChar).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Helper format status As for badge header:
 * 'Belum Terbuka' | 'As Rendah (1)' | 'As Tinggi (15)'
 */
export function getAceStatusLabel(mode: AceMode): 'Belum Terbuka' | 'As Rendah (1)' | 'As Tinggi (15)' {
  return (ACE_MODE_LABELS[mode] || 'Belum Terbuka') as 'Belum Terbuka' | 'As Rendah (1)' | 'As Tinggi (15)';
}

export const formatAceStatus = getAceStatusLabel;

/**
 * Suit display sort order
 */
const SUIT_ORDER: Record<Suit, number> = {
  spades: 0,
  hearts: 1,
  clubs: 2,
  diamonds: 3,
};

/**
 * Sorts player hand by suit and rank for clean tactical presentation
 */
export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return a.rank - b.rank;
  });
}

/**
 * Creates standard 52-card deck
 */
function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals cards to 4 players with mandatory Auto-Reshuffle rule:
 * If any player holds >= 3 cards of rank 7, reshuffle and re-deal.
 */
export function dealCardsWithAutoReshuffle(): Card[][] {
  const maxAttempts = 200;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const shuffled = shuffleCards(createStandardDeck());
    const hands: Card[][] = [[], [], [], []];

    for (let i = 0; i < 52; i++) {
      hands[i % 4].push(shuffled[i]);
    }

    const anyPlayerHasExcessSevens = hands.some((hand) => {
      const sevens = hand.filter((c) => c.rank === 7);
      return sevens.length >= 3;
    });

    if (!anyPlayerHasExcessSevens) {
      return hands.map(sortHand);
    }
  }

  // Fallback safe deal
  const fallback = shuffleCards(createStandardDeck());
  return [
    fallback.slice(0, 13),
    fallback.slice(13, 26),
    fallback.slice(26, 39),
    fallback.slice(39, 52),
  ].map(sortHand);
}

/**
 * Validates if a card can be legally played to the central board.
 * Adheres strictly to the Ace State Machine:
 * - When aceMode === 'LOCKED_NONE': Ace can be played on 2 (Low) or 13 (High).
 * - When aceMode === 'LOW': Ace can only be played on 2 (1 pt). Cannot play on 13.
 * - When aceMode === 'HIGH': Ace can only be played on 13 (15 pts). Cannot play on 2.
 */
export function canPlayCard(board: BoardState, card: Card, aceMode: AceMode): boolean {
  const suitState = board.suits[card.suit];
  if (!suitState) return false;

  // Rule: 7 can always be played to start a suit lane if not yet placed
  if (card.rank === 7) {
    return !suitState.hasSeven;
  }

  // Cannot play non-7 cards until 7 is placed
  if (!suitState.hasSeven) {
    return false;
  }

  // Ace (Rank 1) State Machine
  if (card.rank === 1) {
    if (suitState.hasAce) return false;

    const canPlayLow =
      suitState.minPlayed === 2 && (aceMode === 'LOCKED_NONE' || aceMode === 'LOW');
    const canPlayHigh =
      suitState.maxPlayed === 13 && (aceMode === 'LOCKED_NONE' || aceMode === 'HIGH');

    return canPlayLow || canPlayHigh;
  }

  // Downward connection (Rank 2 through 6)
  if (card.rank >= 2 && card.rank <= 6) {
    return card.rank === suitState.minPlayed - 1;
  }

  // Upward connection (Rank 8 through 13)
  if (card.rank >= 8 && card.rank <= 13) {
    return card.rank === suitState.maxPlayed + 1;
  }

  return false;
}

/**
 * Applies a card to the board state and transitions the Ace State Machine if applicable
 */
export function applyCardToBoard(
  board: BoardState,
  card: Card,
  currentAceMode: AceMode
): { newBoard: BoardState; newAceMode: AceMode } {
  const suitState = { ...board.suits[card.suit] };
  let newAceMode = currentAceMode;

  if (card.rank === 7) {
    suitState.hasSeven = true;
    suitState.minPlayed = 7;
    suitState.maxPlayed = 7;
  } else if (card.rank === 1) {
    suitState.hasAce = true;
    if (
      suitState.minPlayed === 2 &&
      (currentAceMode === 'LOCKED_NONE' || currentAceMode === 'LOW')
    ) {
      suitState.minPlayed = 1;
      if (newAceMode === 'LOCKED_NONE') {
        newAceMode = 'LOW';
      }
    } else if (
      suitState.maxPlayed === 13 &&
      (currentAceMode === 'LOCKED_NONE' || currentAceMode === 'HIGH')
    ) {
      suitState.maxPlayed = 14;
      if (newAceMode === 'LOCKED_NONE') {
        newAceMode = 'HIGH';
      }
    }
  } else if (card.rank === suitState.minPlayed - 1) {
    suitState.minPlayed = card.rank;
  } else if (card.rank === suitState.maxPlayed + 1) {
    suitState.maxPlayed = card.rank;
  }

  return {
    newBoard: {
      suits: {
        ...board.suits,
        [card.suit]: suitState,
      },
    },
    newAceMode,
  };
}

/**
 * Computes all valid playable cards for a hand given current board and ace mode
 */
export function getValidMovesForHand(
  hand: Card[],
  board: BoardState,
  aceMode: AceMode
): Card[] {
  return hand.filter((card) => canPlayCard(board, card, aceMode));
}

/**
 * Returns next active player who still holds cards
 */
function getNextTurnPlayer(players: Player[], currentIndex: number): Player | null {
  for (let step = 1; step <= players.length; step++) {
    const nextIdx = (currentIndex + step) % players.length;
    if (players[nextIdx].hand.length > 0) {
      return players[nextIdx];
    }
  }
  return null;
}

/**
 * Finalizes round, calculates penalty points, determines winner & juru kunci,
 * updates cumulative losses count and RT/RW community state via evaluateRTRWAfterRound,
 * and navigates to scoreboard
 */
function finalizeRound(
  players: Player[],
  board: BoardState,
  aceMode: AceMode,
  set: (fn: (state: GameStoreState) => Partial<GameStoreState>) => void
) {
  const playerScoresWithTotals = players.map((p) => {
    const foldedDetails = p.foldedCards.map((c) => ({
      card: c,
      ...calculateCardPenalty(c, aceMode),
    }));
    const totalPenalty = foldedDetails.reduce((sum, item) => sum + item.points, 0);
    return {
      player: p,
      foldedDetails,
      totalPenalty,
    };
  });

  // Sort ascending: lowest penalty = rank 1 (Winner), highest = rank 4 (Juru Kunci)
  playerScoresWithTotals.sort((a, b) => a.totalPenalty - b.totalPenalty);

  const scoreMap: Record<string, PlayerScoreDetail> = {};
  playerScoresWithTotals.forEach((entry, rankIndex) => {
    const rankPosition = (rankIndex + 1) as 1 | 2 | 3 | 4;
    const isWinner = rankPosition === 1;
    const isJuruKunci = rankPosition === 4;

    scoreMap[entry.player.id] = {
      playerId: entry.player.id,
      playerName: entry.player.name,
      rankPosition,
      foldedCards: entry.foldedDetails,
      totalPenalty: entry.totalPenalty,
      lossesCount: entry.player.lossesCount ?? 0,
      consecutiveLosses: entry.player.consecutiveLosses ?? 0,
      statusRtRw: entry.player.statusRtRw ?? 'NONE',
      isWinner,
      isJuruKunci,
    };
  });

  const {
    players: updatedPlayers,
    scoreboard: updatedScores,
    rtRwHolderId,
    rtRwStatus,
  } = evaluateRTRWAfterRound(players, scoreMap);

  set((prev) => ({
    roomState: prev.roomState
      ? {
          ...prev.roomState,
          status: 'finished',
          board,
          aceMode,
          players: updatedPlayers,
          scores: updatedScores,
          rtRwHolderId,
          rtRwStatus,
        }
      : null,
    validMoves: [],
    selectedCard: null,
    currentScreen: 'scoreboard',
  }));
}

/**
 * Executes a card fold action, accumulates penalties, and advances turn
 */
function executeFold(
  cardToFold: Card,
  player: Player,
  set: (fn: (state: GameStoreState) => Partial<GameStoreState>) => void,
  get: () => GameStoreState
) {
  const state = get();
  const { roomState, playerId } = state;
  if (!roomState) return;

  const cardIndex = player.hand.findIndex(
    (c) => c.suit === cardToFold.suit && c.rank === cardToFold.rank
  );
  if (cardIndex === -1) return;

  const updatedHand = player.hand.filter((_, idx) => idx !== cardIndex);
  const updatedFolded = [...player.foldedCards, cardToFold];

  const penaltyDetail = calculateCardPenalty(cardToFold, roomState.aceMode);
  const newPenaltyPoints = player.penaltyPoints + penaltyDetail.points;

  const updatedPlayers = roomState.players.map((p) =>
    p.id === player.id
      ? {
          ...p,
          hand: updatedHand,
          foldedCards: updatedFolded,
          penaltyPoints: newPenaltyPoints,
        }
      : p
  );

  const isRoundOver = updatedPlayers.every((p) => p.hand.length === 0);

  if (isRoundOver) {
    finalizeRound(updatedPlayers, roomState.board, roomState.aceMode, set);
    return;
  }

  const currentIndex = updatedPlayers.findIndex((p) => p.id === player.id);
  const nextPlayer = getNextTurnPlayer(updatedPlayers, currentIndex);
  const nextTurnId = nextPlayer ? nextPlayer.id : player.id;

  const myHand = updatedPlayers.find((p) => p.id === playerId)?.hand || [];
  const nextValidMoves = getValidMovesForHand(
    myHand,
    roomState.board,
    roomState.aceMode
  );

  set((prev) => ({
    roomState: prev.roomState
      ? {
          ...prev.roomState,
          players: updatedPlayers,
          currentTurn: nextTurnId,
          turnNumber: prev.roomState.turnNumber + 1,
        }
      : null,
    validMoves: nextValidMoves,
    selectedCard: null,
  }));
}

// Module-level timer reference for auto-dismissing toast notifications
let toastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Central Zustand Game Store (useGameStore)
 */
export const useGameStore = create<GameStoreState>()((set, get) => {
  const initialGuestName = DICE_NICKNAME_PRESETS[0];
  const initialPlayerId = `guest_${Math.random().toString(36).substring(2, 9)}`;
  const initialSessionToken = `sess_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  const initialSettings = getInitialSettings();

  return {
    currentScreen: 'lobby',
    playerId: initialPlayerId,
    sessionToken: initialSessionToken,
    playerName: initialGuestName,
    offlineDifficulty: 'medium',
    roomCodeInput: '',
    serverHealth: 'ready',
    pingMs: 32,
    wasmReady: false,
    wsConnected: false,
    roomState: null,
    validMoves: [],
    selectedCard: null,
    activeModal: 'none',
    isDrawerOpen: false,
    pendingFoldCard: null,
    toast: {
      visible: false,
      icon: '',
      message: '',
    },
    audioEnabled: initialSettings.audioEnabled,
    doubleTapEnabled: initialSettings.doubleTapEnabled,

    toggleAudio: () => {
      set((state) => {
        const nextVal = !state.audioEnabled;
        persistSettings({ audioEnabled: nextVal, doubleTapEnabled: state.doubleTapEnabled });
        return { audioEnabled: nextVal };
      });
    },

    toggleDoubleTap: () => {
      set((state) => {
        const nextVal = !state.doubleTapEnabled;
        persistSettings({ audioEnabled: state.audioEnabled, doubleTapEnabled: nextVal });
        return { doubleTapEnabled: nextVal };
      });
    },

    setScreen: (screen: ScreenName) => set({ currentScreen: screen }),

    setPlayerName: (name: string) => {
      const sanitized = name.slice(0, MAX_NICKNAME_LENGTH);
      set((state) => {
        let updatedRoomState = state.roomState;
        if (updatedRoomState) {
          updatedRoomState = {
            ...updatedRoomState,
            players: updatedRoomState.players.map((p) =>
              p.id === state.playerId
                ? { ...p, name: sanitized, initials: getInitials(sanitized) }
                : p
            ),
          };
        }
        return {
          playerName: sanitized,
          roomState: updatedRoomState,
        };
      });
    },

    randomizePlayerName: () => {
      const current = get().playerName;
      const choices = DICE_NICKNAME_PRESETS.filter((n) => n !== current);
      const nextName =
        choices[Math.floor(Math.random() * choices.length)] ||
        DICE_NICKNAME_PRESETS[0];
      get().setPlayerName(nextName);
    },

    setOfflineDifficulty: (diff: BotDifficulty) => {
      set((state) => {
        let updatedRoomState = state.roomState;
        if (updatedRoomState && updatedRoomState.mode === 'offline') {
          updatedRoomState = {
            ...updatedRoomState,
            players: updatedRoomState.players.map((p) =>
              p.isBot ? { ...p, botLevel: diff } : p
            ),
          };
        }
        return {
          offlineDifficulty: diff,
          roomState: updatedRoomState,
        };
      });
    },

    setRoomCodeInput: (code: string) => {
      const sanitized = code
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, ROOM_CODE_LENGTH);
      set({ roomCodeInput: sanitized });
    },

    showToast: (icon: string, message: string) => {
      if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
      }
      set({
        toast: {
          visible: true,
          icon,
          message,
        },
      });
      toastTimer = setTimeout(() => {
        set((state) => ({
          toast: {
            ...state.toast,
            visible: false,
          },
        }));
        toastTimer = null;
      }, 3000);
    },

    setModal: (modal: GameStoreState['activeModal']) => set({ activeModal: modal }),

    setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),

    selectCard: (card: Card | null) => set({ selectedCard: card }),

    startOfflineGame: () => {
      const state = get();
      const { playerId, playerName, offlineDifficulty } = state;

      const hands = dealCardsWithAutoReshuffle();

      const humanPlayer: Player = {
        id: playerId,
        name: playerName || 'Sekop07',
        initials: getInitials(playerName || 'Sekop07'),
        avatarColor: AVATAR_COLORS[0],
        isBot: false,
        isReady: true,
        hand: hands[0],
        foldedCards: [],
        penaltyPoints: 0,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
        isConnected: true,
      };

      const bot1: Player = {
        id: 'bot_1',
        name: 'Taktik7',
        initials: 'T7',
        avatarColor: AVATAR_COLORS[1],
        isBot: true,
        botLevel: offlineDifficulty,
        isReady: true,
        hand: hands[1],
        foldedCards: [],
        penaltyPoints: 0,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
        isConnected: true,
      };

      const bot2: Player = {
        id: 'bot_2',
        name: 'Cermat8',
        initials: 'C8',
        avatarColor: AVATAR_COLORS[2],
        isBot: true,
        botLevel: offlineDifficulty,
        isReady: true,
        hand: hands[2],
        foldedCards: [],
        penaltyPoints: 0,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
        isConnected: true,
      };

      const bot3: Player = {
        id: 'bot_3',
        name: 'Agresif9',
        initials: 'A9',
        avatarColor: AVATAR_COLORS[3],
        isBot: true,
        botLevel: offlineDifficulty,
        isReady: true,
        hand: hands[3],
        foldedCards: [],
        penaltyPoints: 0,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
        isConnected: true,
      };

      const players: Player[] = [humanPlayer, bot1, bot2, bot3];

      // Pick random opener suit
      const openerSuit = ALL_SUITS[Math.floor(Math.random() * ALL_SUITS.length)];

      // Automatically place opener 7 on the board
      let openerPlayerIndex = -1;
      for (let i = 0; i < players.length; i++) {
        const cardIdx = players[i].hand.findIndex(
          (c) => c.suit === openerSuit && c.rank === 7
        );
        if (cardIdx !== -1) {
          openerPlayerIndex = i;
          players[i].hand.splice(cardIdx, 1);
          break;
        }
      }

      const initialBoard: BoardState = {
        suits: {
          spades: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'spades',
            hasAce: false,
          },
          hearts: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'hearts',
            hasAce: false,
          },
          clubs: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'clubs',
            hasAce: false,
          },
          diamonds: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'diamonds',
            hasAce: false,
          },
        },
      };

      const nextTurnPlayer = players[(openerPlayerIndex + 1) % players.length];

      const initialValidMoves = getValidMovesForHand(
        players[0].hand,
        initialBoard,
        'LOCKED_NONE'
      );

      const newRoom: RoomState = {
        id: 'offline_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        mode: 'offline',
        status: 'playing',
        roundNumber: 1,
        turnNumber: 1,
        currentTurn: nextTurnPlayer.id,
        aceMode: 'LOCKED_NONE',
        openerSuit,
        board: initialBoard,
        players,
        rtRwHolderId: '',
        rtRwStatus: 'NONE',
      };

      set({
        roomState: newRoom,
        validMoves: initialValidMoves,
        selectedCard: null,
        activeModal: 'none',
        isDrawerOpen: false,
        pendingFoldCard: null,
        currentScreen: 'gameplay',
      });

      state.showToast(
        '🃏',
        `Permainan Dimulai! 7 ${SUIT_NAMES_ID[openerSuit]} dibuka otomatis.`
      );
    },

    playSelectedCard: (card?: Card) => {
      const state = get();
      const { roomState, playerId } = state;
      if (!roomState || roomState.status !== 'playing') return;

      const currentTurnPlayer = roomState.players.find(
        (p) => p.id === roomState.currentTurn
      );
      if (!currentTurnPlayer) return;

      const cardToPlay = card || state.selectedCard;
      if (!cardToPlay) {
        state.showToast('ℹ️', 'Pilih kartu yang ingin dimainkan');
        return;
      }

      const cardIndex = currentTurnPlayer.hand.findIndex(
        (c) => c.suit === cardToPlay.suit && c.rank === cardToPlay.rank
      );
      if (cardIndex === -1) return;

      if (!canPlayCard(roomState.board, cardToPlay, roomState.aceMode)) {
        state.showToast('⚠️', 'Kartu tidak dapat disambung ke meja!');
        return;
      }

      const { newBoard, newAceMode } = applyCardToBoard(
        roomState.board,
        cardToPlay,
        roomState.aceMode
      );

      // Notify player when Ace mode is locked
      if (roomState.aceMode === 'LOCKED_NONE' && newAceMode !== 'LOCKED_NONE') {
        if (newAceMode === 'LOW') {
          state.showToast('🎯', 'Status As: Terkunci As Rendah (1 Poin)!');
        } else {
          state.showToast('🔥', 'Status As: Terkunci As Tinggi (15 Poin)!');
        }
      }

      const updatedHand = currentTurnPlayer.hand.filter(
        (_, idx) => idx !== cardIndex
      );

      const updatedPlayers = roomState.players.map((p) =>
        p.id === currentTurnPlayer.id ? { ...p, hand: updatedHand } : p
      );

      const isRoundOver = updatedPlayers.every((p) => p.hand.length === 0);

      if (isRoundOver) {
        finalizeRound(updatedPlayers, newBoard, newAceMode, set);
        return;
      }

      const currentIndex = updatedPlayers.findIndex(
        (p) => p.id === currentTurnPlayer.id
      );
      const nextPlayer = getNextTurnPlayer(updatedPlayers, currentIndex);
      const nextTurnId = nextPlayer ? nextPlayer.id : currentTurnPlayer.id;

      const myHand =
        updatedPlayers.find((p) => p.id === playerId)?.hand || [];
      const nextValidMoves = getValidMovesForHand(myHand, newBoard, newAceMode);

      set({
        roomState: {
          ...roomState,
          board: newBoard,
          aceMode: newAceMode,
          players: updatedPlayers,
          currentTurn: nextTurnId,
          turnNumber: roomState.turnNumber + 1,
        },
        validMoves: nextValidMoves,
        selectedCard: null,
      });
    },

    attemptFoldCard: (card?: Card) => {
      const state = get();
      const { roomState, playerId } = state;
      if (!roomState || roomState.status !== 'playing') return;

      const currentTurnPlayer = roomState.players.find(
        (p) => p.id === roomState.currentTurn
      );
      if (!currentTurnPlayer) return;

      const cardToFold = card || state.selectedCard;
      if (!cardToFold) {
        state.showToast('ℹ️', 'Pilih kartu yang ingin ditutup');
        return;
      }

      const cardIndex = currentTurnPlayer.hand.findIndex(
        (c) => c.suit === cardToFold.suit && c.rank === cardToFold.rank
      );
      if (cardIndex === -1) return;

      const isHumanTurn = currentTurnPlayer.id === playerId;

      if (isHumanTurn) {
        // Anti-Bohong rule: cannot fold if player has any valid moves
        if (state.validMoves.length > 0) {
          state.showToast('⚠️', 'Wajib mainkan kartu valid! Tidak boleh tutup kartu.');
          return;
        }

        // Anti-Sabotase Kartu 7: 7 cannot be folded under any circumstance
        if (cardToFold.rank === 7) {
          state.showToast('🚫', 'Kartu 7 haram ditutup dalam kondisi apa pun!');
          return;
        }

        // Key card warning: 6 and 8 incur flat 30 points penalty
        if (isKeyCard(cardToFold)) {
          set({
            pendingFoldCard: cardToFold,
            activeModal: 'key_warning',
          });
          return;
        }
      }

      // Execute fold immediately
      executeFold(cardToFold, currentTurnPlayer, set, get);
    },

    confirmFoldKeyCard: () => {
      const state = get();
      const { roomState, pendingFoldCard } = state;
      if (!roomState || !pendingFoldCard) return;

      const currentTurnPlayer = roomState.players.find(
        (p) => p.id === roomState.currentTurn
      );
      if (!currentTurnPlayer) return;

      set({ activeModal: 'none' });
      executeFold(pendingFoldCard, currentTurnPlayer, set, get);
      set({ pendingFoldCard: null });
      state.showToast('🛡️', 'Kartu Kunci ditutup (+30 Poin Denda)!');
    },

    triggerRematch: () => {
      set({
        currentScreen: 'shuffling',
        activeModal: 'none',
      });
    },

    confirmRematch: () => {
      const state = get();
      const { roomState, playerId } = state;
      if (!roomState) return;

      // Retain cumulative lossesCount, consecutiveLosses, and statusRtRw across rematch
      const existingPlayers = roomState.players.map((p) => ({
        ...p,
        hand: [] as Card[],
        foldedCards: [] as Card[],
        penaltyPoints: 0,
        lossesCount: p.lossesCount ?? 0,
        consecutiveLosses: p.consecutiveLosses ?? 0,
        statusRtRw: p.statusRtRw ?? 'NONE',
        isReady: true,
      }));

      // Deal with Auto-Reshuffle rule
      const hands = dealCardsWithAutoReshuffle();
      existingPlayers.forEach((p, idx) => {
        p.hand = hands[idx];
      });

      // Pick random opener suit
      const openerSuit = ALL_SUITS[Math.floor(Math.random() * ALL_SUITS.length)];

      // Automatically place opener 7 on the board
      let openerPlayerIndex = -1;
      for (let i = 0; i < existingPlayers.length; i++) {
        const cardIdx = existingPlayers[i].hand.findIndex(
          (c) => c.suit === openerSuit && c.rank === 7
        );
        if (cardIdx !== -1) {
          openerPlayerIndex = i;
          existingPlayers[i].hand.splice(cardIdx, 1);
          break;
        }
      }

      const initialBoard: BoardState = {
        suits: {
          spades: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'spades',
            hasAce: false,
          },
          hearts: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'hearts',
            hasAce: false,
          },
          clubs: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'clubs',
            hasAce: false,
          },
          diamonds: {
            minPlayed: 7,
            maxPlayed: 7,
            hasSeven: openerSuit === 'diamonds',
            hasAce: false,
          },
        },
      };

      const nextTurnPlayer =
        existingPlayers[(openerPlayerIndex + 1) % existingPlayers.length];

      const myHand =
        existingPlayers.find((p) => p.id === playerId)?.hand || [];
      const initialValidMoves = getValidMovesForHand(
        myHand,
        initialBoard,
        'LOCKED_NONE'
      );

      set({
        roomState: {
          ...roomState,
          status: 'playing',
          roundNumber: (roomState.roundNumber || 1) + 1,
          turnNumber: 1,
          currentTurn: nextTurnPlayer.id,
          aceMode: 'LOCKED_NONE',
          openerSuit,
          board: initialBoard,
          players: existingPlayers,
          scores: undefined,
          rtRwHolderId: roomState.rtRwHolderId ?? '',
          rtRwStatus: roomState.rtRwStatus ?? 'NONE',
        },
        validMoves: initialValidMoves,
        selectedCard: null,
        activeModal: 'none',
        isDrawerOpen: false,
        pendingFoldCard: null,
        currentScreen: 'gameplay',
      });

      state.showToast(
        '🎮',
        `Rematch Dimulai! 7 ${SUIT_NAMES_ID[openerSuit]} dibuka otomatis.`
      );
    },

    startRematch: () => {
      get().confirmRematch();
    },

    leaveToLobby: () => {
      set({
        currentScreen: 'lobby',
        roomState: null,
        validMoves: [],
        selectedCard: null,
        activeModal: 'none',
        isDrawerOpen: false,
        pendingFoldCard: null,
      });
    },

    syncServerRoomState: (state: RoomState) => {
      const currentStore = get();
      const me = state.players.find((p) => p.id === currentStore.playerId);
      const myHand = me?.hand || [];
      const moves = state.board
        ? getValidMovesForHand(myHand, state.board, state.aceMode)
        : [];

      set({
        roomState: state,
        validMoves: moves,
      });
    },

    getAceStatusLabel: () => {
      const mode = get().roomState?.aceMode ?? 'LOCKED_NONE';
      return ACE_MODE_LABELS[mode] || 'Belum Terbuka';
    },
  };
});

