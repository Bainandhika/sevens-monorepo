import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AceMode,
  BoardState,
  BotDifficulty,
  Card,
  Player,
} from '../types/game';
import {
  canPlayCard,
  getValidMovesForHand,
  useGameStore,
} from '../store/useGameStore';

/**
 * Natural thinking delay for AI bot turns in milliseconds (PRD & Spec SSOT: 700ms)
 */
export const BOT_TURN_NATURAL_DELAY_MS = 700;

/**
 * Interface representing the exposed TinyGo WebAssembly Sevens Engine API
 */
export interface SevensWasmAPI {
  validateMove: (boardJson: string, cardJson: string) => boolean;
  getValidMoves: (handJson: string, boardJson: string) => string;
  getBotMove: (handJson: string, boardJson: string, difficulty: string) => string;
  calculateScore: (playerId: string, handJson: string, extraPenalties: number) => string;
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
 * Pure TypeScript SSOT Fallback for computing score penalties
 * Identical formula to Go engine: CalculateHandScore (Ace=30, 7=30, >10=10, else rank)
 */
export function calculateScoreFallback(
  playerId: string,
  hand: Card[],
  extraPenalties = 0
): string {
  let cardPoints = 0;
  let acePenalties = 0;
  let sevenPenalties = 0;

  for (const card of hand) {
    if (card.rank === 1) {
      acePenalties += 30;
    } else if (card.rank === 7) {
      sevenPenalties += 30;
    } else if (card.rank > 10) {
      cardPoints += 10;
    } else {
      cardPoints += card.rank;
    }
  }

  const detail = {
    playerId,
    remainingCards: hand.length,
    cardPoints,
    acePenalties,
    sevenPenalties,
    otherPenalties: extraPenalties,
    totalMinus: cardPoints + acePenalties + sevenPenalties + extraPenalties,
  };

  return JSON.stringify(detail);
}

/**
 * Pure TypeScript SSOT Fallback for selecting the safest card to fold:
 * Rules:
 * 1. Kartu 7 haram ditutup dalam kondisi apa pun (rank !== 7)
 * 2. Hindari menutup kartu kunci (6 dan 8) karena terkena denda flat +30 poin
 * 3. Pilih kartu nominal terkecil untuk meminimalkan denda
 */
export function selectSafestFoldCard(hand: Card[]): Card {
  const foldCandidates = hand.filter((c) => c.rank !== 7);
  const nonKeyCandidates = foldCandidates.filter((c) => c.rank !== 6 && c.rank !== 8);

  if (nonKeyCandidates.length > 0) {
    // Sort ascending by rank to minimize penalty points
    const sorted = [...nonKeyCandidates].sort((a, b) => a.rank - b.rank);
    return sorted[0];
  }

  if (foldCandidates.length > 0) {
    const sorted = [...foldCandidates].sort((a, b) => a.rank - b.rank);
    return sorted[0];
  }

  // Extreme fallback (should not occur with auto-reshuffle deal rules)
  return hand[0];
}

/**
 * Pure TypeScript SSOT Fallback for Bot Decision:
 * Replicates Go pkg/engine/bot.go logic:
 * - Easy: random valid move
 * - Medium: prefers move where bot holds adjacent continuation cards (+2 score)
 * - Hard: strategic scoring (holds 7 if no 6/8 follow-up, awards continuity, targets 1/13)
 */
export function computeBotPlayMoveFallback(
  validMoves: Card[],
  hand: Card[],
  difficulty: BotDifficulty
): { action: 'play'; card: Card } {
  if (difficulty === 'easy' || validMoves.length === 1) {
    const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { action: 'play', card: chosen };
  }

  if (difficulty === 'medium') {
    const handMap = new Set(hand.map((c) => `${c.suit}-${c.rank}`));
    let bestScore = -100;
    let bestCard = validMoves[0];

    for (const move of validMoves) {
      let score = 0;
      if (move.rank < 7) {
        if (handMap.has(`${move.suit}-${move.rank - 1}`)) score += 2;
      } else if (move.rank > 7) {
        if (handMap.has(`${move.suit}-${move.rank + 1}`)) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCard = move;
      }
    }

    return { action: 'play', card: bestCard };
  }

  // Hard difficulty
  let bestScore = -9999;
  let bestCard = validMoves[0];

  for (const move of validMoves) {
    let score = 0;

    // Avoid starting a new suit (playing 7) if bot holds no 6 or 8 follow-up
    if (move.rank === 7) {
      const hasFollowUp = hand.some(
        (c) => c.suit === move.suit && (c.rank === 6 || c.rank === 8)
      );
      if (!hasFollowUp) {
        score -= 10;
      }
    }

    // Check self-continuity across hand
    for (const c of hand) {
      if (c.suit === move.suit) {
        if (
          (move.rank < 7 && c.rank < move.rank) ||
          (move.rank > 7 && c.rank > move.rank)
        ) {
          score += 5;
        }
      }
    }

    // Prefer playing towards Ace or King to finalize the suit lane
    if (move.rank === 1 || move.rank === 13) {
      score += 8;
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
      const decision = computeBotPlayMoveFallback(validMoves, hand, diff);
      return JSON.stringify({ card: decision.card, isPass: false });
    }

    return JSON.stringify({ card: null, isPass: true });
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

/**
 * Sevens WebAssembly Bridge object wrapping window.SevensWasm with TS fallbacks
 */
export const sevensWasmBridge: SevensWasmAPI = {
  validateMove: (boardJson: string, cardJson: string): boolean => {
    if (typeof window !== 'undefined' && window.SevensWasm && typeof window.SevensWasm.validateMove === 'function') {
      try {
        return window.SevensWasm.validateMove(boardJson, cardJson);
      } catch (err) {
        console.warn('[WASM] validateMove failed, using fallback:', err);
      }
    }
    return validateMoveFallback(boardJson, cardJson);
  },

  getValidMoves: (handJson: string, boardJson: string): string => {
    if (typeof window !== 'undefined' && window.SevensWasm && typeof window.SevensWasm.getValidMoves === 'function') {
      try {
        return window.SevensWasm.getValidMoves(handJson, boardJson);
      } catch (err) {
        console.warn('[WASM] getValidMoves failed, using fallback:', err);
      }
    }
    return getValidMovesFallback(handJson, boardJson);
  },

  getBotMove: (handJson: string, boardJson: string, difficulty: string): string => {
    if (typeof window !== 'undefined' && window.SevensWasm && typeof window.SevensWasm.getBotMove === 'function') {
      try {
        return window.SevensWasm.getBotMove(handJson, boardJson, difficulty);
      } catch (err) {
        console.warn('[WASM] getBotMove failed, using fallback:', err);
      }
    }
    return getBotMoveFallback(handJson, boardJson, difficulty);
  },

  calculateScore: (playerId: string, handJson: string, extraPenalties: number): string => {
    if (typeof window !== 'undefined' && window.SevensWasm && typeof window.SevensWasm.calculateScore === 'function') {
      try {
        return window.SevensWasm.calculateScore(playerId, handJson, extraPenalties);
      } catch (err) {
        console.warn('[WASM] calculateScore failed, using fallback:', err);
      }
    }
    try {
      const hand: Card[] = JSON.parse(handJson);
      return calculateScoreFallback(playerId, hand, extraPenalties);
    } catch {
      return '{}';
    }
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

  if (typeof window !== 'undefined' && window.SevensWasm && typeof window.SevensWasm.getValidMoves === 'function') {
    try {
      const raw = window.SevensWasm.getValidMoves(
        JSON.stringify(hand),
        JSON.stringify(board)
      );
      const wasmMoves: Card[] = JSON.parse(raw);

      // Include potential Ace plays allowed under AceMode
      const aceMoves = hand.filter(
        (c) => c.rank === 1 && canPlayCard(board, c, aceMode)
      );

      const candidateCards = [...wasmMoves, ...aceMoves];
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
    if (typeof window !== 'undefined' && window.SevensWasm && typeof window.SevensWasm.getBotMove === 'function') {
      try {
        const raw = window.SevensWasm.getBotMove(
          JSON.stringify(hand),
          JSON.stringify(board),
          difficulty
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
    return computeBotPlayMoveFallback(validMoves, hand, difficulty);
  }

  // No valid playable moves available: bot must fold safest candidate
  const foldCard = selectSafestFoldCard(hand);
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

