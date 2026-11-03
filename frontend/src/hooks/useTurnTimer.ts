import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Standard Turn Duration and Urgency Threshold in seconds
 */
export const TURN_DURATION_SECONDS = 10;
export const URGENCY_THRESHOLD_SECONDS = 4;

/**
 * Configuration options for the turn countdown hook
 */
export interface UseTurnTimerOptions {
  isPlaying: boolean;
  currentTurnPlayerId: string;
  turnNumber: number;
  isMyTurn: boolean;
  onTimeout?: () => void;
}

/**
 * Return type providing countdown status and controls
 */
export interface UseTurnTimerReturn {
  timeLeft: number;
  isUrgent: boolean;
  resetTimer: () => void;
}

/**
 * Custom Hook: useTurnTimer
 * 
 * Rules:
 * - Counts down 10 seconds per turn for active gameplay.
 * - Resets on turn transition (turnNumber or currentTurnPlayerId changes).
 * - Urgency state (isUrgent) is true when timeLeft <= 4 and > 0.
 * - When timeLeft reaches 0 on the player's turn (isMyTurn), triggers AFK protection
 *   via triggerTimeoutAutoAction() and displays toast:
 *   "⏱ Waktu habis! Langkah otomatis dieksekusi".
 */
export function useTurnTimer(options?: Partial<UseTurnTimerOptions>): UseTurnTimerReturn {
  const storeRoomState = useGameStore((state) => state.roomState);
  const storePlayerId = useGameStore((state) => state.playerId);
  const triggerTimeoutAutoAction = useGameStore((state) => state.triggerTimeoutAutoAction);
  const showToast = useGameStore((state) => state.showToast);

  const isPlaying = options?.isPlaying ?? (storeRoomState?.status === 'playing');
  const currentTurnPlayerId = options?.currentTurnPlayerId ?? (storeRoomState?.currentTurn ?? '');
  const turnNumber = options?.turnNumber ?? (storeRoomState?.turnNumber ?? 0);
  const isMyTurn = options?.isMyTurn ?? (storeRoomState?.currentTurn === storePlayerId);

  const [timeLeft, setTimeLeft] = useState<number>(TURN_DURATION_SECONDS);
  const hasTimedOutRef = useRef<boolean>(false);
  const onTimeoutRef = useRef(options?.onTimeout);

  useEffect(() => {
    onTimeoutRef.current = options?.onTimeout;
  }, [options?.onTimeout]);

  // Reset countdown whenever turnNumber or currentTurnPlayerId changes, or when paused
  useEffect(() => {
    if (!isPlaying) {
      setTimeLeft(TURN_DURATION_SECONDS);
      hasTimedOutRef.current = false;
      return;
    }

    setTimeLeft(TURN_DURATION_SECONDS);
    hasTimedOutRef.current = false;

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, turnNumber, currentTurnPlayerId]);

  // When timer hits 0, trigger auto action on player's turn and invoke callback
  useEffect(() => {
    if (timeLeft === 0 && isPlaying && !hasTimedOutRef.current) {
      hasTimedOutRef.current = true;

      if (isMyTurn) {
        triggerTimeoutAutoAction();
        showToast('⏱️', 'Waktu habis! Langkah otomatis dieksekusi');
      }

      onTimeoutRef.current?.();
    }
  }, [timeLeft, isPlaying, isMyTurn, triggerTimeoutAutoAction, showToast]);

  const resetTimer = useCallback(() => {
    setTimeLeft(TURN_DURATION_SECONDS);
    hasTimedOutRef.current = false;
  }, []);

  // Urgency pulse active when timeLeft <= 4s and > 0
  const isUrgent = timeLeft <= URGENCY_THRESHOLD_SECONDS && timeLeft > 0;

  return {
    timeLeft,
    isUrgent,
    resetTimer,
  };
}

export default useTurnTimer;

