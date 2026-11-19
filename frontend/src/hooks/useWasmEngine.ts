import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AceMode,
  BoardState,
  BotDifficulty,
  Card,
  CommunityStatus,
  Player,
  PlayerScoreDetail,
} from '../types/game';
import {
  canPlayCard,
  getValidMovesForHand,
  useGameStore,
} from '../store/useGameStore';
import { calculateCardPenalty, isKeyCard } from '../constants/designTokens';
import { evaluateRTRWAfterRound } from '../services/mockDataService';

/**
 * Natural thinking delay for AI bot turns in milliseconds (PRD & Spec SSOT: 700ms)
 */
export const BOT_TURN_NATURAL_DELAY_MS = 700;

/**
 * Interface representing the exposed TinyGo WebAssembly Sevens Engine API
 */
export interface SevensWasmAPI {
  validateMove: (boardJson: string, cardJson: string, aceMode?: string) => boolean;
  getValidMoves: (handJson: string, boardJson: string, aceMode?: string) => string;
  getBotMove: (
    handJson: string,
    boardJson: string,
    difficulty: string,
    aceMode?: string
  ) => string;
  calculateScore: (
    playerId: string,
    handJson: string,
    extraPenalties: number,
    aceMode?: string
  ) => string;
  selectFoldCard: (
    handJson: string,
    difficulty?: string,
    aceMode?: string
  ) => string;
  calculateLeaderboard: (inputsJson: string, aceMode?: string) => string;
}

/**
 * Return interface for the useWasmEngine custom hook
 */
export interface UseWasmEngineReturn {
  wasmReady: boolean;
  evaluateValidMoves: (hand: Card[], board: BoardState, aceMode: AceMode) => Card[];
  computeBotAction: (
    hand: Card[],
    board: BoardState,
    difficulty: BotDifficulty,
    aceMode: AceMode
  ) => { action: 'play' | 'fold'; card: Card };
}

/**
 * Optional configuration for useWasmEngine
 */
export interface UseWasmEngineOptions {
  autoExecuteBot?: boolean;
  botTurnDelayMs?: number;
}

/**
 * Augment the Window interface to recognize TinyGo / Go Wasm globals
 */
declare global {
  interface Window {
    Go?: new () => {
      importObject: WebAssembly.Imports;
      run: (instance: WebAssembly.Instance) => Promise<void>;
    };
    SevensWasm?: SevensWasmAPI;
  }
}

// Module-level singleton promise to guarantee Wasm is instantiated only once
let wasmInitPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads /wasm_exec.js if window.Go is not yet available
 */
async function ensureGoRuntimeLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.Go) return true;

  return new Promise<boolean>((resolve) => {
    // Check if script tag already exists in DOM
    const existing = document.querySelector('script[src*="wasm_exec.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Go)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      // Poll briefly if it was already loaded
      setTimeout(() => resolve(Boolean(window.Go)), 500);
      return;
    }

    const script = document.createElement('script');
    script.src = '/wasm_exec.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Go));
    script.onerror = () => {
      console.warn('[WASM] Failed to load /wasm_exec.js');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initializes the TinyGo WebAssembly engine from '/game.wasm'
 */
export async function initWasmEngine(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Already initialized and available
  if (window.SevensWasm && typeof window.SevensWasm.getValidMoves === 'function') {
    useGameStore.setState({ wasmReady: true });
    return true;
  }

  if (wasmInitPromise) {
    return wasmInitPromise;
  }

  wasmInitPromise = (async () => {
    try {
      const goAvailable = await ensureGoRuntimeLoaded();
      if (!goAvailable || !window.Go) {
        console.warn('[WASM] Go runtime wasm_exec.js unavailable. Pure TypeScript SSOT active.');
        return false;
      }

      const go = new window.Go();
      let wasmInstance: WebAssembly.Instance | null = null;

      // Prefer instantiateStreaming, fallback to arrayBuffer
      if (typeof WebAssembly.instantiateStreaming === 'function') {
        try {
          const streamingResult = await WebAssembly.instantiateStreaming(
            fetch('/game.wasm'),
            go.importObject
          );
          wasmInstance = streamingResult.instance;
        } catch {
          // Fall back to ArrayBuffer below
        }
      }

      if (!wasmInstance) {
        const response = await fetch('/game.wasm');
        if (!response.ok) {
          throw new Error(`Failed to fetch /game.wasm: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.instantiate(buffer, go.importObject);
        wasmInstance = module.instance;
      }

      // Start the Go WebAssembly runtime asynchronously
      go.run(wasmInstance);

      if (window.SevensWasm) {
        console.log('[WASM] TinyGo Sevens WebAssembly Engine initialized successfully');
        useGameStore.setState({ wasmReady: true });
        return true;
      }

      return false;
    } catch (err) {
      console.warn('[WASM] WebAssembly engine init failed, running on Pure TypeScript SSOT:', err);
      return false;
    }
  })();

  return wasmInitPromise;
}

/**
 * Pure TypeScript SSOT Fallback for validating a move
 */
export function validateMoveFallback(
  boardJson: string,
  cardJson: string,
  aceMode: AceMode = 'LOCKED_NONE'
): boolean {
  try {
    const board: BoardState = JSON.parse(boardJson);
    const card: Card = JSON.parse(cardJson);
    return canPlayCard(board, card, aceMode);
  } catch {
    return false;
  }
}

/**
 * Pure TypeScript SSOT Fallback for calculating all valid playable moves
 */
export function getValidMovesFallback(
  handJson: string,
  boardJson: string,
  aceMode: AceMode = 'LOCKED_NONE'
): string {
  try {
    const hand: Card[] = JSON.parse(handJson);
    const board: BoardState = JSON.parse(boardJson);
    const valid = getValidMovesForHand(hand, board, aceMode);
    return JSON.stringify(valid);
  } catch {
    return '[]';
  }
}

/**
 * Pure TypeScript SSOT Fallback for computing tactical score penalties:
 * - Key cards 6 & 8: flat 30 points
 * - Ace (1): 0 (LOCKED_NONE), 1 (LOW), 15 (HIGH)
 * - 2-5, 7, 9-10, J(11), Q(12), K(13): nominal rank value
 */
export function calculateScoreFallback(
  playerId: string,
  hand: Card[],
  extraPenalties = 0,
  aceMode: AceMode = 'LOCKED_NONE'
): string {
  const foldedCards = hand.map((card) => ({
    card,
    ...calculateCardPenalty(card, aceMode),
  }));
  const cardPenaltyTotal = foldedCards.reduce((sum, item) => sum + item.points, 0);
  const totalPenalty = cardPenaltyTotal + extraPenalties;

  const detail = {
    playerId,
    playerName: playerId,
    foldedCards,
    totalPenalty,
    otherPenalties: extraPenalties,
  };

  return JSON.stringify(detail);
}

/**
 * Counts how many same-suit continuation cards in hand become blocked if `card` is folded.
 * Matches Go pkg/engine/bot.go continuationLoss.
 */
function continuationLoss(card: Card, hand: Card[]): number {
  let loss = 0;
  for (const c of hand) {
    if (c.suit === card.suit) {
      if (card.rank < 7 && c.rank < card.rank) {
        loss++;
      } else if (
        card.rank > 7 &&
        (c.rank > card.rank || (card.rank === 13 && c.rank === 1))
      ) {
        loss++;
      }
    }
  }
  return loss;
}

/**
 * Pure TypeScript SSOT Fallback for selecting the safest card to fold.
 * Matches Go pkg/engine/bot.go SelectFoldCard.
 */
export function selectSafestFoldCardFallback(
  hand: Card[],
  difficulty: BotDifficulty = 'hard',
  aceMode: AceMode = 'LOCKED_NONE'
): Card {
  const foldCandidates = hand.filter((c) => c.rank !== 7);
  if (foldCandidates.length === 0) {
    return hand[0];
  }

  if (difficulty === 'easy') {
    return foldCandidates[Math.floor(Math.random() * foldCandidates.length)];
  }

  const nonKeyCandidates = foldCandidates.filter((c) => !isKeyCard(c));
  const pool = nonKeyCandidates.length > 0 ? nonKeyCandidates : foldCandidates;

  if (difficulty === 'medium') {
    const sorted = [...pool].sort((a, b) => a.rank - b.rank);
    return sorted[0];
  }

  // Hard difficulty: evaluate actual penalty cost via calculateCardPenalty(c, aceMode),
  // break ties by continuationLoss, then rank, then suit.
  const sorted = [...pool].sort((a, b) => {
    const penA = calculateCardPenalty(a, aceMode).points;
    const penB = calculateCardPenalty(b, aceMode).points;
    if (penA !== penB) {
      return penA - penB;
    }
    const lossA = continuationLoss(a, hand);
    const lossB = continuationLoss(b, hand);
    if (lossA !== lossB) {
      return lossA - lossB;
    }
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return a.suit < b.suit ? -1 : a.suit > b.suit ? 1 : 0;
  });

  return sorted[0];
}

/**
 * Selects the safest card to fold, delegating to window.SevensWasm.selectFoldCard when ready.
 */
export function selectSafestFoldCard(
  hand: Card[],
  difficulty: BotDifficulty = 'hard',
  aceMode: AceMode = 'LOCKED_NONE'
): Card {
  if (
    typeof window !== 'undefined' &&
    window.SevensWasm &&
    typeof window.SevensWasm.selectFoldCard === 'function'
  ) {
    try {
      const raw = window.SevensWasm.selectFoldCard(
        JSON.stringify(hand),
        difficulty,
        aceMode
      );
      const parsed = JSON.parse(raw);
      if (parsed && parsed.suit && parsed.rank && parsed.rank !== 7) {
        return parsed as Card;
      }
    } catch (err) {
      console.warn('[WASM] selectFoldCard failed, using fallback:', err);
    }
  }

  return selectSafestFoldCardFallback(hand, difficulty, aceMode);
}

/**
 * Pure TypeScript SSOT Fallback for Bot Decision:
 * Strictly mirrors Go pkg/engine/bot.go logic:
 * - Easy: random valid move
 * - Medium: adjacent continuation (+3), Rank >= 10 (+2), key cards 6/8 (+2)
 * - Hard: withholds 7 (-10) if lacking 6/8, withholds 6/8 (-4) if lacking lane follow-up,
 *         steers AceMode LOW/HIGH (+12) based on lowCount (2..5) vs highCount (10..13),
 *         awards +5 per unlocked continuation card.
 */
export function computeBotPlayMoveFallback(
  validMoves: Card[],
  hand: Card[],
  difficulty: BotDifficulty,
  board?: BoardState
): { action: 'play'; card: Card } {
  if (difficulty === 'easy' || validMoves.length === 1) {
    const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { action: 'play', card: chosen };
  }

  if (difficulty === 'medium') {
    const handMap = new Set(hand.map((c) => `${c.suit}-${c.rank}`));
    let bestScore = -9999;
    let bestCard = validMoves[0];

    for (const move of validMoves) {
      let score = 0;

      if (move.rank < 7) {
        if (handMap.has(`${move.suit}-${move.rank - 1}`)) score += 3;
      } else if (move.rank > 7) {
        if (handMap.has(`${move.suit}-${move.rank + 1}`)) score += 3;
      } else {
        if (handMap.has(`${move.suit}-6`)) score += 3;
        if (handMap.has(`${move.suit}-8`)) score += 3;
      }

      if (move.rank >= 10) {
        score += 2;
      }

      if (isKeyCard(move)) {
        score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCard = move;
      }
    }

    return { action: 'play', card: bestCard };
  }

  // Hard difficulty
  let bestScore = -99999;
  let bestCard = validMoves[0];

  let lowCount = 0;
  let highCount = 0;
  for (const c of hand) {
    if (c.rank >= 2 && c.rank <= 5) {
      lowCount++;
    } else if (c.rank >= 10 && c.rank <= 13) {
      highCount++;
    }
  }

  for (const move of validMoves) {
    let score = 0;

    // 1. Withholds opening a new 7 (-10) if holding neither 6 nor 8 of that suit
    if (move.rank === 7) {
      const hasFollowUp = hand.some(
        (c) => c.suit === move.suit && (c.rank === 6 || c.rank === 8)
      );
      if (!hasFollowUp) {
        score -= 10;
      }
    }

    // 2. Withholds playing 6 or 8 (-4) if alternatives exist and lacking lane follow-up
    if (isKeyCard(move) && validMoves.length > 1) {
      let hasLaneFollowUp = false;
      if (move.rank === 6) {
        hasLaneFollowUp = hand.some((c) => c.suit === move.suit && c.rank < 6);
      } else if (move.rank === 8) {
        hasLaneFollowUp = hand.some(
          (c) => c.suit === move.suit && (c.rank > 8 || c.rank === 1)
        );
      }
      if (!hasLaneFollowUp) {
        score -= 4;
      }
    }

    // 3. Evaluates low-card (2..5) vs high-card (10..13) composition to steer AceMode (+12)
    if (move.rank === 1 && board?.suits?.[move.suit]) {
      const suitState = board.suits[move.suit];
      if (suitState.minPlayed === 2 && lowCount >= highCount) {
        score += 12;
      }
      if (suitState.maxPlayed === 13 && highCount >= lowCount) {
        score += 12;
      }
    }

    // 4. Awards +5 for each self-continuation card unlocked in hand
    for (const c of hand) {
      if (c.suit === move.suit) {
        if (move.rank === 7) {
          if (c.rank !== 7) score += 5;
        } else if (move.rank < 7) {
          if (c.rank < move.rank) score += 5;
        } else {
          if (c.rank > move.rank || (c.rank === 1 && move.rank === 13)) {
            score += 5;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCard = move;
    }
  }

  return { action: 'play', card: bestCard };
}

/**
 * Pure TypeScript SSOT Fallback for getBotMove JSON string
 */
export function getBotMoveFallback(
  handJson: string,
  boardJson: string,
  difficulty: string,
  aceMode: AceMode = 'LOCKED_NONE'
): string {
  try {
    const hand: Card[] = JSON.parse(handJson);
    const board: BoardState = JSON.parse(boardJson);
    const diff = (difficulty as BotDifficulty) || 'medium';
    const validMoves = getValidMovesForHand(hand, board, aceMode);

    if (validMoves.length > 0) {
      const decision = computeBotPlayMoveFallback(validMoves, hand, diff, board);
      return JSON.stringify({ card: decision.card, isPass: false, action: 'play' });
    }

    const foldCard = selectSafestFoldCardFallback(hand, diff, aceMode);
    return JSON.stringify({
      card: null,
      isPass: true,
      action: 'fold',
      foldCard,
    });
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

/**
 * Pure TypeScript SSOT Fallback for calculateLeaderboard JSON string.
 * Mirrors Go pkg/engine/score.go CalculateFinalLeaderboard.
 */
export function calculateLeaderboardFallback(
  inputsJson: string,
  aceMode: AceMode = 'LOCKED_NONE'
): string {
  try {
    const inputs: Array<{
      playerId: string;
      playerName: string;
      seatIndex: number;
      foldedCards: Card[];
      lossesCount?: number;
      consecutiveLosses?: number;
      statusRtRw?: CommunityStatus;
    }> = JSON.parse(inputsJson);

    const ranked = inputs.map((input) => {
      const foldedCards = (input.foldedCards || []).map((card) => ({
        card,
        ...calculateCardPenalty(card, aceMode),
      }));
      const totalPenalty = foldedCards.reduce((sum, item) => sum + item.points, 0);
      return {
        input,
        foldedCards,
        totalPenalty,
      };
    });

    ranked.sort((a, b) => {
      if (a.totalPenalty !== b.totalPenalty) {
        return a.totalPenalty - b.totalPenalty;
      }
      return (a.input.seatIndex ?? 0) - (b.input.seatIndex ?? 0);
    });

    const players: Player[] = inputs.map((input) => ({
      id: input.playerId,
      name: input.playerName,
      initials: input.playerName.slice(0, 2).toUpperCase(),
      avatarColor: '#4F46E5',
      isBot: false,
      isReady: true,
      hand: [],
      foldedCards: input.foldedCards || [],
      penaltyPoints: 0,
      lossesCount: input.lossesCount ?? 0,
      consecutiveLosses: input.consecutiveLosses ?? 0,
      statusRtRw: input.statusRtRw ?? 'NONE',
      isConnected: true,
    }));

    const scoreboard: Record<string, PlayerScoreDetail> = {};
    ranked.forEach((entry, idx) => {
      const rankPosition = (idx + 1) as 1 | 2 | 3 | 4;
      scoreboard[entry.input.playerId] = {
        playerId: entry.input.playerId,
        playerName: entry.input.playerName,
        rankPosition,
        foldedCards: entry.foldedCards,
        totalPenalty: entry.totalPenalty,
        lossesCount: entry.input.lossesCount ?? 0,
        consecutiveLosses: entry.input.consecutiveLosses ?? 0,
        statusRtRw: entry.input.statusRtRw ?? 'NONE',
        isWinner: idx === 0,
        isJuruKunci: idx === ranked.length - 1 && ranked.length > 1,
      };
    });

    const evaluated = evaluateRTRWAfterRound(players, scoreboard);
    return JSON.stringify(evaluated.scoreboard);
  } catch {
    return '{}';
  }
}

/**
 * Sevens WebAssembly Bridge object wrapping window.SevensWasm with TS fallbacks
 */
export const sevensWasmBridge: SevensWasmAPI = {
  validateMove: (boardJson: string, cardJson: string, aceMode = 'LOCKED_NONE'): boolean => {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.validateMove === 'function'
    ) {
      try {
        return window.SevensWasm.validateMove(boardJson, cardJson, aceMode);
      } catch (err) {
        console.warn('[WASM] validateMove failed, using fallback:', err);
      }
    }
    return validateMoveFallback(boardJson, cardJson, aceMode as AceMode);
  },

  getValidMoves: (handJson: string, boardJson: string, aceMode = 'LOCKED_NONE'): string => {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.getValidMoves === 'function'
    ) {
      try {
        return window.SevensWasm.getValidMoves(handJson, boardJson, aceMode);
      } catch (err) {
        console.warn('[WASM] getValidMoves failed, using fallback:', err);
      }
    }
    return getValidMovesFallback(handJson, boardJson, aceMode as AceMode);
  },

  getBotMove: (
    handJson: string,
    boardJson: string,
    difficulty: string,
    aceMode = 'LOCKED_NONE'
  ): string => {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.getBotMove === 'function'
    ) {
      try {
        return window.SevensWasm.getBotMove(handJson, boardJson, difficulty, aceMode);
      } catch (err) {
        console.warn('[WASM] getBotMove failed, using fallback:', err);
      }
    }
    return getBotMoveFallback(handJson, boardJson, difficulty, aceMode as AceMode);
  },

  calculateScore: (
    playerId: string,
    handJson: string,
    extraPenalties = 0,
    aceMode = 'LOCKED_NONE'
  ): string => {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.calculateScore === 'function'
    ) {
      try {
        return window.SevensWasm.calculateScore(
          playerId,
          handJson,
          extraPenalties,
          aceMode
        );
      } catch (err) {
        console.warn('[WASM] calculateScore failed, using fallback:', err);
      }
    }
    try {
      const hand: Card[] = JSON.parse(handJson);
      return calculateScoreFallback(playerId, hand, extraPenalties, aceMode as AceMode);
    } catch {
      return '{}';
    }
  },

  selectFoldCard: (
    handJson: string,
    difficulty = 'hard',
    aceMode = 'LOCKED_NONE'
  ): string => {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.selectFoldCard === 'function'
    ) {
      try {
        return window.SevensWasm.selectFoldCard(handJson, difficulty, aceMode);
      } catch (err) {
        console.warn('[WASM] selectFoldCard failed, using fallback:', err);
      }
    }
    try {
      const hand: Card[] = JSON.parse(handJson);
      const card = selectSafestFoldCardFallback(
        hand,
        difficulty as BotDifficulty,
        aceMode as AceMode
      );
      return JSON.stringify(card ?? {});
    } catch {
      return '{}';
    }
  },

  calculateLeaderboard: (inputsJson: string, aceMode = 'LOCKED_NONE'): string => {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.calculateLeaderboard === 'function'
    ) {
      try {
        return window.SevensWasm.calculateLeaderboard(inputsJson, aceMode);
      } catch (err) {
        console.warn('[WASM] calculateLeaderboard failed, using fallback:', err);
      }
    }
    return calculateLeaderboardFallback(inputsJson, aceMode as AceMode);
  },
};

/**
 * Evaluates all legally playable cards for a hand given current board and ace mode.
 * Invokes TinyGo WebAssembly when available and conforms strictly to Ace State Machine.
 */
export function evaluateValidMoves(
  hand: Card[],
  board: BoardState,
  aceMode: AceMode
): Card[] {
  if (!hand || hand.length === 0 || !board || !board.suits) {
    return [];
  }

  if (
    typeof window !== 'undefined' &&
    window.SevensWasm &&
    typeof window.SevensWasm.getValidMoves === 'function'
  ) {
    try {
      const raw = window.SevensWasm.getValidMoves(
        JSON.stringify(hand),
        JSON.stringify(board),
        aceMode
      );
      const wasmMoves: Card[] = JSON.parse(raw);

      const candidateCards = Array.isArray(wasmMoves) ? wasmMoves : [];
      const verifiedMap = new Map<string, Card>();

      for (const card of candidateCards) {
        if (canPlayCard(board, card, aceMode)) {
          verifiedMap.set(`${card.suit}-${card.rank}`, card);
        }
      }

      return Array.from(verifiedMap.values());
    } catch (err) {
      console.warn('[WASM] evaluateValidMoves execution failed, using SSOT fallback:', err);
    }
  }

  return getValidMovesForHand(hand, board, aceMode);
}

/**
 * Computes the optimal bot action ('play' or 'fold') given hand, board, difficulty, and ace mode.
 * Tries WebAssembly getBotMove first; if not ready or on pass, uses pure TypeScript SSOT.
 */
export function computeBotAction(
  hand: Card[],
  board: BoardState,
  difficulty: BotDifficulty,
  aceMode: AceMode
): { action: 'play' | 'fold'; card: Card } {
  const validMoves = evaluateValidMoves(hand, board, aceMode);

  if (validMoves.length > 0) {
    if (
      typeof window !== 'undefined' &&
      window.SevensWasm &&
      typeof window.SevensWasm.getBotMove === 'function'
    ) {
      try {
        const raw = window.SevensWasm.getBotMove(
          JSON.stringify(hand),
          JSON.stringify(board),
          difficulty,
          aceMode
        );
        const decision = JSON.parse(raw);

        if (decision && !decision.isPass && decision.card) {
          const chosen: Card = decision.card;
          const isLegal = validMoves.some(
            (v) => v.suit === chosen.suit && v.rank === chosen.rank
          );
          if (isLegal) {
            return { action: 'play', card: chosen };
          }
        }
      } catch (err) {
        console.warn('[WASM] computeBotAction WebAssembly call failed, using fallback:', err);
      }
    }

    // Pure TypeScript selection fallback
    return computeBotPlayMoveFallback(validMoves, hand, difficulty, board);
  }

  // No valid playable moves available: bot must fold safest candidate
  const foldCard = selectSafestFoldCard(hand, difficulty, aceMode);
  return { action: 'fold', card: foldCard };
}

/**
 * Custom Hook: useWasmEngine
 *
 * Responsibilities:
 * 1. Loads '/game.wasm' via window.Go and tracks `wasmReady`.
 * 2. Provides `evaluateValidMoves` and `computeBotAction` wrapping WebAssembly with TypeScript SSOT fallbacks.
 * 3. Automatically executes AI Bot turns when active on the Gameplay screen with a natural 700ms delay:
 *    - The bot's PlayerBadge turn indicator flashes yellow during the 700ms thinking delay.
 *    - Automatically plays valid card or folds safest candidate.
 *    - Displays a short toast message when a bot folds a card.
 */
export function useWasmEngine(options?: UseWasmEngineOptions): UseWasmEngineReturn {
  const autoExecuteBot = options?.autoExecuteBot ?? true;
  const botTurnDelayMs = options?.botTurnDelayMs ?? BOT_TURN_NATURAL_DELAY_MS;

  const storeWasmReady = useGameStore((state) => state.wasmReady);
  const [wasmReady, setWasmReady] = useState<boolean>(storeWasmReady);

  const roomState = useGameStore((state) => state.roomState);
  const currentScreen = useGameStore((state) => state.currentScreen);
  const playSelectedCard = useGameStore((state) => state.playSelectedCard);
  const attemptFoldCard = useGameStore((state) => state.attemptFoldCard);
  const showToast = useGameStore((state) => state.showToast);

  // Guard against duplicate execution for the same turn cycle
  const executingTurnKeyRef = useRef<string | null>(null);

  // Initialize WebAssembly engine once
  useEffect(() => {
    let isMounted = true;

    initWasmEngine().then((ready) => {
      if (isMounted) {
        setWasmReady(ready);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize local wasmReady with Zustand store
  useEffect(() => {
    if (storeWasmReady !== wasmReady) {
      setWasmReady(storeWasmReady);
    }
  }, [storeWasmReady, wasmReady]);

  // Memoized evaluator functions
  const handleEvaluateValidMoves = useCallback(
    (hand: Card[], board: BoardState, aceMode: AceMode): Card[] => {
      return evaluateValidMoves(hand, board, aceMode);
    },
    []
  );

  const handleComputeBotAction = useCallback(
    (
      hand: Card[],
      board: BoardState,
      difficulty: BotDifficulty,
      aceMode: AceMode
    ): { action: 'play' | 'fold'; card: Card } => {
      return computeBotAction(hand, board, difficulty, aceMode);
    },
    []
  );

  // Automatic AI Bot Turn Executor
  useEffect(() => {
    if (!autoExecuteBot || !roomState || roomState.status !== 'playing') {
      return;
    }

    // Only execute on gameplay screen (or active gameplay state)
    if (currentScreen !== 'gameplay') {
      return;
    }

    const currentTurnPlayer: Player | undefined = roomState.players.find(
      (p) => p.id === roomState.currentTurn
    );

    if (!currentTurnPlayer || !currentTurnPlayer.isBot || currentTurnPlayer.hand.length === 0) {
      return;
    }

    // Build unique key for this turn cycle
    const turnKey = `${roomState.id}_${roomState.roundNumber}_${roomState.turnNumber}_${currentTurnPlayer.id}`;
    if (executingTurnKeyRef.current === turnKey) {
      return;
    }

    // During this natural 700ms delay, the bot's PlayerBadge glows yellow with pinging indicator
    // because roomState.currentTurn === currentTurnPlayer.id
    const timerId = window.setTimeout(() => {
      // Re-verify turn validity before executing action
      const currentState = useGameStore.getState();
      const latestRoom = currentState.roomState;

      if (!latestRoom || latestRoom.status !== 'playing') return;
      if (latestRoom.currentTurn !== currentTurnPlayer.id) return;

      const latestBot = latestRoom.players.find((p) => p.id === currentTurnPlayer.id);
      if (!latestBot || !latestBot.isBot || latestBot.hand.length === 0) return;

      executingTurnKeyRef.current = turnKey;

      const botDifficulty = latestBot.botLevel || currentState.offlineDifficulty || 'medium';
      const actionResult = computeBotAction(
        latestBot.hand,
        latestRoom.board,
        botDifficulty,
        latestRoom.aceMode
      );

      if (actionResult.action === 'play') {
        currentState.playSelectedCard(actionResult.card);
      } else {
        // Bot folds card -> execute fold and notify via brief toast
        currentState.attemptFoldCard(actionResult.card);
        currentState.showToast('🛡️', `${latestBot.name} menutup kartu`);
      }
    }, botTurnDelayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    autoExecuteBot,
    botTurnDelayMs,
    roomState,
    currentScreen,
    playSelectedCard,
    attemptFoldCard,
    showToast,
  ]);

  return {
    wasmReady,
    evaluateValidMoves: handleEvaluateValidMoves,
    computeBotAction: handleComputeBotAction,
  };
}

export default useWasmEngine;

