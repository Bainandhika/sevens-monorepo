import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Check,
  Flame,
  History,
  X,
  Lock,
  Layers,
  Sparkles,
  Trophy,
} from 'lucide-react';
import clsx from 'clsx';
import { useGameStore, getInitials } from '../store/useGameStore';
import { wsClient } from '../services/wsClient';
import { AppShell } from '../components/layout/AppShell';
import {
  SUIT_SYMBOLS,
  RANK_LABELS,
  SHUFFLE_RITUAL_TIMEOUT_SECONDS,
  TACTICAL_Z_PATTERN,
  isKeyCard,
} from '../constants/designTokens';
import { Suit, PlayerScoreDetail, Player } from '../types/game';

export interface ShuffleRitualScreenProps {
  onCompleteRematch?: () => void;
  onReturnToLobby?: () => void;
}

/**
 * Screen 5: Ritual Kocok Kartu (9 Titik Interaktif) & Waiting Lounge
 * Strictly matches Google Stitch Screens:
 * - 9ce664cdd7d544b78bf0361256d16d11 (Kocok Kartu Taktis - 9 Titik Interaktif)
 * - 96b7f2bda2f94721ba330fac7f1f989a (Layar Tunggu Kocok Kartu - Santai Kawan)
 * - 77d196f887d548fc86fad1e789213006 (Modal Log Detail Ronde)
 */
export const ShuffleRitualScreen: React.FC<ShuffleRitualScreenProps> = ({
  onCompleteRematch,
  onReturnToLobby,
}) => {
  const {
    roomState,
    playerId,
    playerName,
    roomCodeInput,
    roundLogSnapshot,
    shuffleStep,
    shuffleAutoReshuffled,
    sruputActiveByPlayer,
    isTableCheering,
    lastCheeredBy,
    setShuffleStep,
    triggerLoungeReaction,
    confirmRematch,
    leaveToLobby,
    showToast,
  } = useGameStore();

  const displayRoomCode = (
    roomState?.id ||
    roomCodeInput ||
    'IB9GVM'
  )
    .replace(/^offline_/, '')
    .toUpperCase();
  const isOnlineMode = roomState?.mode === 'online';
  const roundNumber = roundLogSnapshot?.roundNumber ?? roomState?.roundNumber ?? 1;
  const currentUserId = playerId || 'p1';
  const currentUserName = playerName || 'Sekop07';

  // --- 1. Identify Juru Kunci Loser & Ranked Scoreboard ---
  const scoresMap = roundLogSnapshot?.scores ?? roomState?.scores;
  const playersSource: Player[] = useMemo(() => {
    if (roundLogSnapshot?.players && roundLogSnapshot.players.length > 0) {
      return roundLogSnapshot.players;
    }
    if (roomState?.players && roomState.players.length > 0) {
      return roomState.players;
    }
    return [
      {
        id: currentUserId,
        name: currentUserName,
        initials: getInitials(currentUserName),
        avatarColor: '#10B981',
        isBot: false,
        isReady: true,
        hand: [],
        foldedCards: [],
        penaltyPoints: 0,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE' as const,
        isConnected: true,
      },
      {
        id: 'bot_1',
        name: 'Taktik7',
        initials: 'T7',
        avatarColor: '#3B82F6',
        isBot: true,
        isReady: true,
        hand: [],
        foldedCards: [],
        penaltyPoints: 8,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE' as const,
        isConnected: true,
      },
      {
        id: 'bot_2',
        name: 'Cermat8',
        initials: 'C8',
        avatarColor: '#8B5CF6',
        isBot: true,
        isReady: true,
        hand: [],
        foldedCards: [],
        penaltyPoints: 19,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE' as const,
        isConnected: true,
      },
      {
        id: 'bot_3',
        name: 'Agresif9',
        initials: 'A9',
        avatarColor: '#EC4899',
        isBot: true,
        isReady: true,
        hand: [],
        foldedCards: [],
        penaltyPoints: 48,
        lossesCount: 1,
        consecutiveLosses: 1,
        statusRtRw: 'NONE' as const,
        isConnected: true,
      },
    ];
  }, [roundLogSnapshot?.players, roomState?.players, currentUserId, currentUserName]);

  const rankedScores: PlayerScoreDetail[] = useMemo(() => {
    if (scoresMap && Object.keys(scoresMap).length > 0) {
      return Object.values(scoresMap).sort((a, b) => a.rankPosition - b.rankPosition);
    }

    return playersSource.map((p, idx) => ({
      playerId: p.id,
      playerName: p.name,
      rankPosition: ((idx + 1) as 1 | 2 | 3 | 4),
      foldedCards: [],
      totalPenalty: p.penaltyPoints || (idx === 0 ? 0 : idx === 1 ? 8 : idx === 2 ? 19 : 48),
      lossesCount: p.lossesCount || (idx === 3 ? 1 : 0),
      consecutiveLosses: p.consecutiveLosses || (idx === 3 ? 1 : 0),
      statusRtRw: p.statusRtRw || 'NONE',
      isWinner: idx === 0,
      isJuruKunci: idx === 3,
    }));
  }, [scoresMap, playersSource]);

  // Identify Juru Kunci loser (prefer explicit server shufflerId when present)
  const loser = useMemo(() => {
    if (roomState?.shufflerId) {
      const byShufflerId = rankedScores.find((s) => s.playerId === roomState.shufflerId);
      if (byShufflerId) return byShufflerId;
    }
    return (
      rankedScores.find((s) => s.isJuruKunci) ||
      rankedScores.find((s) => s.rankPosition === 4) ||
      rankedScores[rankedScores.length - 1]
    );
  }, [rankedScores, roomState?.shufflerId]);

  const loserId = roomState?.shufflerId || loser?.playerId || currentUserId;
  const loserPlayer = useMemo(
    () => playersSource.find((p) => p.id === loserId),
    [playersSource, loserId]
  );

  const isLocalUserJuruKunci = loserId === currentUserId;
  const loserName = loserPlayer?.name || loser?.playerName || 'Sekop07';
  const loserPenalty = loser?.totalPenalty ?? 48;
  const loserInitials = loserPlayer?.initials || getInitials(loserName);

  // Opener card & Ace mode for Round Log modal
  const openerSuit: Suit = roundLogSnapshot?.openerSuit ?? roomState?.openerSuit ?? 'spades';
  const aceMode = roundLogSnapshot?.aceMode ?? roomState?.aceMode ?? 'LOCKED_NONE';

  // --- Handlers & Rematch Transition ---
  const [rematchTriggered, setRematchTriggered] = useState(false);
  const rematchTriggeredRef = useRef(false);
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleTimeout = useCallback((fn: () => void, delayMs: number) => {
    const id = setTimeout(fn, delayMs);
    pendingTimeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach((id) => clearTimeout(id));
      pendingTimeoutsRef.current = [];
    };
  }, []);

  const triggerRematchTransition = useCallback(
    (autoReshuffle = false) => {
      if (rematchTriggeredRef.current) return;
      rematchTriggeredRef.current = true;
      setRematchTriggered(true);

      if (isOnlineMode && roomState?.id) {
        // Online mode: notify server that shuffle step 3 (or auto-reshuffle) is done;
        // server transitions room.status -> 'playing' and broadcasts room_state.
        wsClient.sendShuffleProgress(roomState.id, 3, autoReshuffle);
        return;
      }

      // Offline / standalone mode: deal new round in store and enter gameplay
      confirmRematch();
      if (onCompleteRematch) {
        onCompleteRematch();
      }
    },
    [isOnlineMode, roomState?.id, confirmRematch, onCompleteRematch]
  );

  const handleReturnToLobby = () => {
    if (onReturnToLobby) {
      onReturnToLobby();
    } else {
      leaveToLobby();
    }
  };

  // --- Modal Log Ronde State ---
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // --- Synchronized 14-Second Shuffle Timer (PRD F4 & DESIGN.md 4.5/4.6) ---
  const [countdown, setCountdown] = useState<number>(SHUFFLE_RITUAL_TIMEOUT_SECONDS);
  const [isAutoReshuffleTriggered, setIsAutoReshuffleTriggered] = useState<boolean>(false);

  // =========================================================================
  // BRANCH A: Local User IS Juru Kunci (Kocok Kartu Manual - 9 Titik Interaktif)
  // Stitch Screen: 9ce664cdd7d544b78bf0361256d16d11
  // =========================================================================
  const TARGET_PATTERN = TACTICAL_Z_PATTERN; // Tactical-Z: 0 -> 2 -> 6 -> 8
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [failCount, setFailCount] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('MENUNGGU GORESAN...');
  const [isErrorLine, setIsErrorLine] = useState<boolean>(false);
  const [isShufflingCards, setIsShufflingCards] = useState<boolean>(false);
  const [tempPointerPos, setTempPointerPos] = useState<{ x: number; y: number } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const userSequenceRef = useRef<number[]>([]);

  // Reset ritual state when entering a fresh round/shuffler session
  useEffect(() => {
    setCountdown(SHUFFLE_RITUAL_TIMEOUT_SECONDS);
    setIsAutoReshuffleTriggered(false);
    setRematchTriggered(false);
    rematchTriggeredRef.current = false;
    setCurrentStep(1);
    setFailCount(0);
    setUserSequence([]);
    userSequenceRef.current = [];
    setTempPointerPos(null);
    setIsErrorLine(false);
    setStatusText('MENUNGGU GORESAN...');
  }, [roomState?.id, roundNumber, isLocalUserJuruKunci]);

  // Synchronized 14s countdown across both Branch A and Branch B
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (rematchTriggeredRef.current) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [roomState?.id, roundNumber, isLocalUserJuruKunci]);

  // 14s Anti-Stall Auto-Reshuffle trigger when countdown hits 0
  useEffect(() => {
    if (countdown > 0 || rematchTriggeredRef.current || isAutoReshuffleTriggered) return;

    if (isLocalUserJuruKunci || !isOnlineMode) {
      setIsAutoReshuffleTriggered(true);
      setIsErrorLine(false);
      setStatusText('AUTO-RESHUFFLE AKTIF!');
      setShuffleStep(3, true);
      showToast('⚡', 'Waktu habis! AUTO-RESHUFFLE AKTIF!');
      scheduleTimeout(() => {
        triggerRematchTransition(true);
      }, 800);
      return;
    }

    // Online Branch B anti-stall fallback if server timer hasn't transitioned yet
    setIsAutoReshuffleTriggered(true);
    setShuffleStep(3, true);
    scheduleTimeout(() => {
      if (!rematchTriggeredRef.current && roomState?.id) {
        triggerRematchTransition(true);
      }
    }, 1000);
  }, [
    countdown,
    isAutoReshuffleTriggered,
    isLocalUserJuruKunci,
    isOnlineMode,
    roomState?.id,
    scheduleTimeout,
    setShuffleStep,
    showToast,
    triggerRematchTransition,
  ]);

  const formattedCountdown = `00:${String(countdown).padStart(2, '0')}`;

  // Keep ref synchronized
  useEffect(() => {
    userSequenceRef.current = userSequence;
  }, [userSequence]);

  const getDotCenter = useCallback((index: number) => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const dotEl = stageRef.current.querySelector(`[data-dot="${index}"]`);
    if (!dotEl) return { x: 0, y: 0 };
    const stageRect = stageRef.current.getBoundingClientRect();
    const dotRect = dotEl.getBoundingClientRect();
    return {
      x: dotRect.left - stageRect.left + dotRect.width / 2,
      y: dotRect.top - stageRect.top + dotRect.height / 2,
    };
  }, []);

  const resetCurrentCanvas = useCallback(() => {
    setUserSequence([]);
    userSequenceRef.current = [];
    setTempPointerPos(null);
    setIsErrorLine(false);
    setStatusText('MENUNGGU GORESAN...');
  }, []);

  const handleDotHit = useCallback((clientX: number, clientY: number) => {
    if (!stageRef.current) return;
    const dots = stageRef.current.querySelectorAll<HTMLElement>('.dot-cell');
    dots.forEach((dot) => {
      const rect = dot.getBoundingClientRect();
      const margin = 14; // generous hit zone for touch
      if (
        clientX >= rect.left - margin &&
        clientX <= rect.right + margin &&
        clientY >= rect.top - margin &&
        clientY <= rect.bottom + margin
      ) {
        const dotIdx = parseInt(dot.getAttribute('data-dot') || '-1', 10);
        if (dotIdx !== -1 && !userSequenceRef.current.includes(dotIdx)) {
          const next = [...userSequenceRef.current, dotIdx];
          userSequenceRef.current = next;
          setUserSequence(next);
          setStatusText('MENGGORES...');
        }
      }
    });
  }, []);

  const triggerCardShuffleAnim = useCallback(() => {
    setIsShufflingCards(true);
    scheduleTimeout(() => {
      setIsShufflingCards(false);
    }, 400);
  }, [scheduleTimeout]);

  const checkPattern = useCallback(() => {
    if (rematchTriggeredRef.current || isAutoReshuffleTriggered) return;
    const seq = userSequenceRef.current;
    if (seq.length === 0) return;

    const isCorrect =
      seq.length === TARGET_PATTERN.length &&
      seq.every((val, index) => val === TARGET_PATTERN[index]);

    if (isCorrect) {
      setStatusText(`PUTARAN ${currentStep} VALID!`);
      setIsErrorLine(false);
      triggerCardShuffleAnim();

      if (currentStep === 1) {
        if (isOnlineMode && roomState?.id) {
          wsClient.sendShuffleProgress(roomState.id, 1, false);
        }
        setShuffleStep(2, false);
        scheduleTimeout(() => {
          setCurrentStep(2);
          resetCurrentCanvas();
        }, 500);
      } else if (currentStep === 2) {
        if (isOnlineMode && roomState?.id) {
          wsClient.sendShuffleProgress(roomState.id, 2, false);
        }
        setShuffleStep(3, false);
        scheduleTimeout(() => {
          setCurrentStep(3);
          resetCurrentCanvas();
        }, 500);
      } else {
        setStatusText('DEK TERKOCOK LENGKAP!');
        setShuffleStep(3, false);
        scheduleTimeout(() => {
          triggerRematchTransition(false);
        }, 700);
      }
    } else {
      const nextFail = failCount + 1;
      setFailCount(nextFail);
      setIsErrorLine(true);
      setStatusText(`POLA SALAH (${nextFail}/3)`);

      if (nextFail >= 3) {
        setIsAutoReshuffleTriggered(true);
        setStatusText('AUTO-RESHUFFLE AKTIF!');
        setShuffleStep(3, true);
        scheduleTimeout(() => {
          triggerRematchTransition(true);
        }, 800);
      } else {
        scheduleTimeout(() => {
          resetCurrentCanvas();
        }, 800);
      }
    }
  }, [
    TARGET_PATTERN,
    currentStep,
    failCount,
    isAutoReshuffleTriggered,
    isOnlineMode,
    resetCurrentCanvas,
    roomState?.id,
    scheduleTimeout,
    setShuffleStep,
    triggerCardShuffleAnim,
    triggerRematchTransition,
  ]);

  // Pointer event handlers for cross-platform drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rematchTriggeredRef.current || isAutoReshuffleTriggered || countdown === 0) return;
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handleDotHit(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current || !stageRef.current) return;
    handleDotHit(e.clientX, e.clientY);

    const stageRect = stageRef.current.getBoundingClientRect();
    setTempPointerPos({
      x: e.clientX - stageRect.left,
      y: e.clientY - stageRect.top,
    });
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setTempPointerPos(null);
    checkPattern();
  };

  // Build SVG polyline points string
  const polylinePoints = useMemo(() => {
    if (userSequence.length === 0) return '';
    const pts = userSequence.map((idx) => {
      const p = getDotCenter(idx);
      return `${p.x},${p.y}`;
    });
    if (tempPointerPos) {
      pts.push(`${tempPointerPos.x},${tempPointerPos.y}`);
    }
    return pts.join(' ');
  }, [userSequence, tempPointerPos, getDotCenter]);

  // =========================================================================
  // BRANCH B: Another Player or Bot IS Juru Kunci (Waiting Lounge - Santai Kawan)
  // Stitch Screen: 96b7f2bda2f94721ba330fac7f1f989a
  // =========================================================================
  const [shufflerActionIndex, setShufflerActionIndex] = useState<number>(0);

  const shufflerActions = useMemo(
    () => [
      'MENGACAK 52 KARTU...',
      'MEMBAGI POLA RIFLE SHUFFLE...',
      'MENYUSUN CUT PACKET...',
      'VERIFIKASI BLIND SEED...',
    ],
    []
  );

  // Shuffler text ticker
  useEffect(() => {
    if (isLocalUserJuruKunci) return;
    const interval = setInterval(() => {
      setShufflerActionIndex((prev) => (prev + 1) % shufflerActions.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [isLocalUserJuruKunci, shufflerActions.length]);

  // Automated step progression (~4.5 seconds total) ONLY in offline / standalone mode;
  // in online mode, progress is driven by backend shuffle_progress & room_state WS events.
  useEffect(() => {
    if (isLocalUserJuruKunci || isOnlineMode) return;

    setShuffleStep(1, false);
    const t1 = setTimeout(() => {
      setShuffleStep(2, false);
    }, 1500);

    const t2 = setTimeout(() => {
      setShuffleStep(3, false);
    }, 3000);

    const t3 = setTimeout(() => {
      triggerRematchTransition(false);
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isLocalUserJuruKunci, isOnlineMode, setShuffleStep, triggerRematchTransition]);

  // Interactive buttons in Waiting Lounge
  const handleCoffeeReaction = () => {
    if (isOnlineMode && roomState?.id) {
      wsClient.sendLoungeReaction(roomState.id, 'sruput', currentUserId);
    }
    triggerLoungeReaction({
      reaction: 'sruput',
      senderId: currentUserId,
      senderName: currentUserName,
    });
    showToast('☕', 'Slruurpp! Kopi diseruput hangat.');
  };

  const handleCheerReaction = () => {
    if (isOnlineMode && roomState?.id) {
      wsClient.sendLoungeReaction(roomState.id, 'cheer', currentUserId);
    } else {
      triggerLoungeReaction({
        reaction: 'cheer',
        senderId: currentUserId,
        senderName: currentUserName,
      });
    }
  };

  const isLocalSruputActive = Boolean(sruputActiveByPlayer[currentUserId]);

  // Other players waiting in lounge (excluding Juru Kunci)
  const waitingPlayers: Player[] = useMemo(() => {
    return playersSource.filter((p) => p.id !== loserId);
  }, [playersSource, loserId]);
  const totalTablePlayers = Math.max(4, playersSource.length || 4);

  return (
    <AppShell variant="surface">
      {/* (1) Fixed Header Bar */}
      <header
        className="fixed top-0 inset-x-0 z-50 pt-safe bg-[#10B981] border-b-[3px] border-black shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
        id="shuffle-ritual-header"
      >
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              id="btn-return-lobby"
              aria-label="Kembali"
              type="button"
              onClick={handleReturnToLobby}
              className="w-10 h-10 flex items-center justify-center text-black bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h1 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-black truncate">
              RITUAL KOCOK KARTU
            </h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-black text-[#FFE600] font-display text-[10px] font-bold uppercase tracking-wider border border-black whitespace-nowrap">
              RONDE {roundNumber + 1}
            </span>
            <span
              id="header-countdown-pill"
              className={clsx(
                'px-2 py-0.5 rounded font-display text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[1px_1px_0px_#000000] tabular-nums whitespace-nowrap',
                countdown <= 4
                  ? 'bg-[#FF4343] text-white animate-pulse'
                  : 'bg-white text-black'
              )}
            >
              ⏳ {formattedCountdown}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full pt-20 px-4 pb-12 select-none">
        {/* ========================================================================= */}
        {/* BRANCH A: Local User is Juru Kunci */}
        {/* ========================================================================= */}
        {isLocalUserJuruKunci ? (
          <div className="flex flex-col gap-4">
            {/* Status & Telemetry Bar */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-[#E1E7FF] text-[#131B2E] font-display text-[11px] font-bold uppercase tracking-wider border border-black">
                  ROOM #{displayRoomCode}
                </span>
                <span className="px-2 py-1 rounded bg-white text-[#131B2E] font-display text-[11px] font-bold border border-black">
                  RONDE {roundNumber + 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#BE091D] text-white border border-black shadow-[1px_1px_0px_#000000]">
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="font-display text-[11px] font-bold uppercase tracking-wide">
                  JURU KUNCI: {currentUserName}
                </span>
              </div>
            </div>

            {/* Banner Instruksi Utama (Neo-Brutalist Frame) */}
            <div className="flex flex-col p-4 rounded-xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#10B981] stroke-[2.5]" />
                  <h2 className="font-display text-base font-black tracking-tight text-[#131B2E] uppercase">
                    KOCOK KARTU MANUAL
                  </h2>
                </div>
                <div
                  id="round-badge"
                  className={clsx(
                    'px-2.5 py-1 rounded font-display text-xs font-black uppercase border border-black shadow-[1px_1px_0px_#000000]',
                    isAutoReshuffleTriggered
                      ? 'bg-[#FF4343] text-white'
                      : 'bg-[#FFE600] text-black'
                  )}
                >
                  {isAutoReshuffleTriggered
                    ? 'AUTO-RESHUFFLE!'
                    : `PUTARAN ${currentStep} / 3`}
                </div>
              </div>

              {/* Segmented 3-Block Progress */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <div
                  id="step-1"
                  className={clsx(
                    'h-3 rounded border border-black transition-all flex items-center justify-center',
                    isAutoReshuffleTriggered || rematchTriggered || currentStep > 1
                      ? 'bg-[#10B981]'
                      : 'bg-[#FFE600]'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
                <div
                  id="step-2"
                  className={clsx(
                    'h-3 rounded border border-black transition-all flex items-center justify-center',
                    isAutoReshuffleTriggered || rematchTriggered || currentStep > 2
                      ? 'bg-[#10B981]'
                      : currentStep === 2
                      ? 'bg-[#FFE600]'
                      : 'bg-[#DAE2FD]'
                  )}
                >
                  {currentStep >= 2 && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <div
                  id="step-3"
                  className={clsx(
                    'h-3 rounded border border-black transition-all flex items-center justify-center',
                    isAutoReshuffleTriggered || rematchTriggered
                      ? 'bg-[#10B981]'
                      : currentStep === 3
                      ? 'bg-[#FFE600]'
                      : 'bg-[#DAE2FD]'
                  )}
                >
                  {(currentStep === 3 || isAutoReshuffleTriggered || rematchTriggered) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  )}
                </div>
              </div>

              <p className="font-body text-xs text-slate-700 leading-snug">
                Tarik garis mengikuti pola 9 titik di bawah untuk memvalidasi acakan dek kartu taktikal ronde baru!
              </p>
            </div>

            {/* Target & Deck Shuffling Simulation Ribbon (12-column grid) */}
            <div className="grid grid-cols-12 gap-3 items-stretch">
              {/* Left 5 Cols: Mini Target Guide Card */}
              <div className="col-span-5 flex flex-col p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000000] justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] uppercase text-black tracking-wider font-bold">
                    TARGET POLA
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                </div>

                {/* Miniature 3x3 Target (Z-Shape) */}
                <div className="relative w-20 h-20 mx-auto my-1 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <polyline
                      id="target-svg-line"
                      points="20,20 80,20 20,80 80,80"
                      fill="none"
                      stroke="#10b981"
                      strokeDasharray="4 2"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="grid grid-cols-3 gap-2 w-full h-full p-2 place-items-center">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dotIdx) => {
                      const isTarget = (TARGET_PATTERN as readonly number[]).includes(dotIdx);
                      return (
                        <div
                          key={`target-dot-${dotIdx}`}
                          className={clsx(
                            'rounded-full',
                            isTarget
                              ? 'w-2.5 h-2.5 bg-[#10B981] ring-2 ring-[#4EDEA3]'
                              : 'w-2 h-2 bg-slate-300'
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="text-center font-display text-[10px] text-[#10B981] font-black tracking-tight uppercase">
                  POLA: TACTICAL-Z
                </div>
              </div>

              {/* Right 7 Cols: Live Card Shuffle Physical Feedback Stage */}
              <div className="col-span-7 flex flex-col p-3 rounded-xl bg-[#E1E7FF] border-2 border-black shadow-[2px_2px_0px_#000000] justify-between overflow-hidden relative">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] uppercase text-black font-bold tracking-wider">
                    STATUS TUMPUKAN
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                  </span>
                </div>

                {/* Tactical Deck Shuffle Visual Illustration */}
                <div className="relative h-20 w-full flex items-center justify-center py-1">
                  {/* Card 3 (Bottom Left) */}
                  <div
                    className={clsx(
                      'absolute w-12 h-16 rounded-lg bg-white border-2 border-black shadow-sm flex flex-col justify-between p-1 select-none transition-transform duration-300',
                      isShufflingCards ? '-translate-x-4 rotate-12' : 'translate-x-3 rotate-12'
                    )}
                  >
                    <span className="font-display text-[9px] text-[#FF4343] font-bold">♥ 7</span>
                    <span className="text-center text-[#FF4343] text-xs">♥</span>
                    <span className="font-display text-[9px] text-[#FF4343] font-bold self-end rotate-180">♥ 7</span>
                  </div>

                  {/* Card 2 (Bottom Right) */}
                  <div
                    className={clsx(
                      'absolute w-12 h-16 rounded-lg bg-white border-2 border-black shadow-sm flex flex-col justify-between p-1 select-none transition-transform duration-300',
                      isShufflingCards ? 'translate-x-4 -rotate-12' : '-translate-x-3 -rotate-8'
                    )}
                  >
                    <span className="font-display text-[9px] text-black font-bold">♠ K</span>
                    <span className="text-center text-black text-xs">♠</span>
                    <span className="font-display text-[9px] text-black font-bold self-end rotate-180">♠ K</span>
                  </div>

                  {/* Card 1 (Top Active) */}
                  <div
                    className={clsx(
                      'relative w-12 h-16 rounded-lg bg-[#10B981] text-black border-2 border-black shadow-md flex flex-col justify-between p-1 select-none transition-all duration-300 z-10',
                      isShufflingCards ? '-translate-y-3 rotate-6' : ''
                    )}
                  >
                    <div className="flex justify-between items-center leading-none">
                      <span className="font-display text-[9px] font-black">7♠</span>
                      <span className="font-display text-[8px] font-bold">#402</span>
                    </div>
                    <div className="self-center flex flex-col items-center">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                    </div>
                    <div className="text-[7px] uppercase font-black text-center tracking-tighter">
                      TACTICAL
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-700 font-display text-[10px]">
                  <span>
                    ACAKAN:{' '}
                    <strong className="text-black font-black">
                      {currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%'}
                    </strong>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white text-black border border-black font-bold">
                    52 KARTU
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive 9-Dot Canvas Tactical Area */}
            <div className="flex flex-col p-4 rounded-xl bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] relative gap-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-black tracking-wide uppercase text-[#131B2E]">
                  TOUCHPAD POLA INTERAKTIF
                </span>
                <div className="flex items-center gap-1 font-display text-[11px] text-slate-700 bg-slate-100 border border-black px-2 py-0.5 rounded-full font-bold">
                  <span>SENTUH & TARIK</span>
                </div>
              </div>

              {/* Active Interactive Board */}
              <div
                id="pattern-stage"
                ref={stageRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative w-full aspect-square max-w-[300px] mx-auto rounded-xl bg-[#F2F3FF] border-2 border-black p-4 flex items-center justify-center overflow-hidden touch-none select-none"
              >
                {/* SVG Overlay for Connecting Trajectory */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" id="pattern-svg">
                  <polyline
                    id="live-line"
                    points={polylinePoints}
                    fill="none"
                    stroke={isErrorLine ? '#be091d' : '#10b981'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="8"
                  />
                </svg>

                {/* 3x3 Dot Grid Structure */}
                <div className="grid grid-cols-3 gap-6 w-full h-full place-items-center relative z-10" id="dots-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dotIdx) => {
                    const isSelected = userSequence.includes(dotIdx);
                    return (
                      <div
                        key={`dot-cell-${dotIdx}`}
                        data-dot={dotIdx}
                        className={clsx(
                          'dot-cell w-12 h-12 rounded-full border-2 border-black shadow-md flex items-center justify-center cursor-pointer transition-all transform active:scale-95',
                          isSelected
                            ? isErrorLine
                              ? 'bg-[#FF4343] scale-110'
                              : 'bg-[#FFE600] scale-110'
                            : 'bg-white'
                        )}
                      >
                        <div
                          className={clsx(
                            'dot-core rounded-full transition-all',
                            isSelected
                              ? 'w-4 h-4 bg-black scale-125'
                              : 'w-3 h-3 bg-black'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Sequence Feed */}
              <div className="flex items-center justify-between px-1 pt-1 text-slate-700 font-display text-xs">
                <span className="flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  TITIK TERTANGKAP:{' '}
                  <strong className="text-black font-black" id="dots-count">
                    {userSequence.length}
                  </strong>
                  /4
                </span>
                <span
                  id="pattern-status-text"
                  className={clsx(
                    'font-black uppercase',
                    isErrorLine ? 'text-[#BE091D]' : 'text-[#10B981]'
                  )}
                >
                  {statusText}
                </span>
              </div>
            </div>

            {/* Footer Actions & Auto-Reshuffle Warning */}
            <div className="grid grid-cols-12 gap-2 mt-1">
              <button
                id="btn-reset"
                type="button"
                onClick={resetCurrentCanvas}
                className="col-span-4 py-3 px-2 rounded-lg bg-white hover:bg-slate-50 border-2 border-black shadow-[2px_2px_0px_#000000] text-black font-display text-xs font-bold uppercase flex items-center justify-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET</span>
              </button>

              <div className="col-span-8 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FFDAD6] border-2 border-black text-[#930012] shadow-[2px_2px_0px_#000000]">
                <AlertTriangle className="w-4 h-4 text-[#BE091D] shrink-0" />
                <span className="font-display text-[10px] uppercase font-bold tracking-tight">
                  AUTO-RESHUFFLE JIKA 3x SALAH
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* BRANCH B: Another Player or Bot is Juru Kunci (Waiting Lounge)           */
          /* ========================================================================= */
          <div
            className={clsx(
              'flex flex-col gap-4 rounded-2xl transition-all duration-300',
              isTableCheering && 'ring-4 ring-[#FFE600] bg-[#FFE600]/10 p-1 -m-1'
            )}
          >
            {/* Live Cheer Banner (1.5s highlight across the screen) */}
            {isTableCheering && (
              <div
                id="table-cheer-banner"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#FFE600] border-[3px] border-black shadow-[3px_3px_0px_#000000] animate-bounce"
              >
                <Flame className="w-4 h-4 text-[#FF4343] stroke-[2.5]" />
                <span className="font-display text-xs font-black uppercase text-black tracking-wide">
                  {lastCheeredBy || 'Kawan'} MENYEMANGATI PENGOCOK KARTU!
                </span>
              </div>
            )}

            {/* Status Room & Tactical Bar */}
            <div className="flex items-center justify-between bg-[#F2F3FF] p-3 rounded-xl border-[3px] border-black shadow-[3px_3px_0px_#000000]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#FFE600] text-black font-display text-xs uppercase tracking-wider border border-black font-black">
                  ROOM #{displayRoomCode}
                </span>
                <span className="px-2.5 py-1 rounded bg-white text-black font-display text-xs font-bold border border-black">
                  RONDE {roundNumber + 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="font-display text-[11px] text-black uppercase font-bold tracking-wide">
                  {isAutoReshuffleTriggered || shuffleAutoReshuffled
                    ? 'AUTO-RESHUFFLE AKTIF!'
                    : 'MENYIAPKAN RONDE'}
                </span>
              </div>
            </div>

            {/* Hero Neo-Brutalism Callout */}
            <div className="bg-[#FFE600] p-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000000] relative overflow-hidden">
              <div className="absolute -right-2 -bottom-4 opacity-15 pointer-events-none select-none font-display font-black text-[64px] leading-none text-black">
                ♠ 7 ♣
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded bg-white text-black font-display text-[10px] border-2 border-black uppercase font-black">
                  RITUAL WAJIB KALAH
                </span>
                <span
                  id="countdown-timer"
                  className={clsx(
                    'flex items-center gap-1 px-2 py-0.5 rounded border border-black font-display text-xs font-black tabular-nums',
                    countdown <= 4
                      ? 'bg-[#FF4343] text-white animate-pulse'
                      : 'bg-white/80 text-black'
                  )}
                >
                  <span>⏳ {formattedCountdown}</span>
                </span>
              </div>

              <h2 className="font-display text-base font-black text-black leading-tight uppercase tracking-tight mb-3">
                SANTAI KAWAN, {loserName} SEDANG MENGOCOK KARTU
              </h2>

              {/* Profil Shuffler */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000]">
                <div className="w-11 h-11 rounded-lg bg-[#FFDAD6] border-2 border-black flex items-center justify-center font-display text-base font-black text-black shadow-[1px_1px_0px_#000000] flex-shrink-0">
                  {loserInitials}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display text-sm text-black truncate font-bold">
                      {loserName}
                    </p>
                    {loserPlayer?.isBot && (
                      <span className="px-1.5 py-0.2 rounded bg-[#283044] text-white font-display text-[9px] border border-black uppercase font-bold">
                        BOT
                      </span>
                    )}
                    <span className="text-xs">😞</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFDAD6] text-[#930012] font-display text-[9px] uppercase font-bold border border-black whitespace-nowrap">
                      JURU KUNCI RONDE LALU
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 pl-2">
                  <span className="font-display text-[9px] text-slate-500 uppercase font-bold">
                    Poin Minus
                  </span>
                  <span className="font-display text-sm text-[#BE091D] font-black leading-none">
                    -{loserPenalty} PT
                  </span>
                </div>
              </div>
            </div>

            {/* Card Deck Shuffling Animation Showcase */}
            <div className="bg-[#EAEDFF] p-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000000] flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b-2 border-black">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#10B981]" />
                  <span className="font-display text-xs uppercase tracking-wider text-black font-black">
                    IDIH, IDIIIIIH.....
                  </span>
                </div>
                <span className="font-display text-[10px] text-slate-600 font-bold">
                  {shufflerActions[shufflerActionIndex]}
                </span>
              </div>

              {/* Animated Shuffling Deck Stage */}
              <div className="relative w-64 h-32 flex items-center justify-center my-1">
                {/* Felt table mat backdrop */}
                <div className="absolute inset-0 bg-[#10B981]/15 rounded-xl border-2 border-dashed border-black" />

                {/* Card Left */}
                <div
                  className="absolute w-16 h-24 bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between p-1.5 select-none transition-transform duration-500 ease-in-out"
                  style={{
                    transform:
                      shufflerActionIndex % 2 === 0
                        ? 'translate(-28px, 0px) rotate(-14deg)'
                        : 'translate(22px, -8px) rotate(8deg)',
                  }}
                >
                  <div className="flex items-center justify-between font-display text-[9px] font-bold text-[#FF4343]">
                    <span>A</span>
                    <span>♥</span>
                  </div>
                  <div className="text-center font-display text-base text-[#FF4343]">♥</div>
                  <div className="flex items-center justify-between font-display text-[9px] font-bold text-[#FF4343] rotate-180">
                    <span>A</span>
                    <span>♥</span>
                  </div>
                </div>

                {/* Card Center (Key 7 Spades) */}
                <div
                  className="absolute w-16 h-24 bg-[#FFE600] rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between p-1.5 select-none z-10 transition-transform duration-500 ease-in-out"
                  style={{
                    transform:
                      shufflerActionIndex % 2 === 0
                        ? 'scale(1.08) rotate(0deg)'
                        : 'scale(0.96) rotate(-4deg)',
                  }}
                >
                  <div className="flex items-center justify-between font-display text-[9px] font-bold text-black">
                    <span>7</span>
                    <span>♠</span>
                  </div>
                  <div className="text-center font-display text-lg text-black font-black">♠</div>
                  <div className="flex items-center justify-between font-display text-[9px] font-bold text-black rotate-180">
                    <span>7</span>
                    <span>♠</span>
                  </div>
                </div>

                {/* Card Right */}
                <div
                  className="absolute w-16 h-24 bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] flex flex-col justify-between p-1.5 select-none transition-transform duration-500 ease-in-out"
                  style={{
                    transform:
                      shufflerActionIndex % 2 === 0
                        ? 'translate(28px, -4px) rotate(14deg)'
                        : 'translate(-22px, 8px) rotate(-8deg)',
                  }}
                >
                  <div className="flex items-center justify-between font-display text-[9px] font-bold text-black">
                    <span>K</span>
                    <span>♣</span>
                  </div>
                  <div className="text-center font-display text-base text-black">♣</div>
                  <div className="flex items-center justify-between font-display text-[9px] font-bold text-black rotate-180">
                    <span>K</span>
                    <span>♣</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Realtime 9-Point Pattern Ritual Indicator */}
            <div className="bg-white p-3.5 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-xs text-black uppercase font-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#10B981]" />
                  RITUAL GESTUR 9 TITIK
                </span>
                <span
                  id="pattern-phase-label"
                  className={clsx(
                    'font-display text-[10px] font-bold px-2 py-0.5 rounded border border-black whitespace-nowrap',
                    isAutoReshuffleTriggered || shuffleAutoReshuffled
                      ? 'bg-[#FF4343] text-white'
                      : 'bg-[#FFE600] text-black'
                  )}
                >
                  {isAutoReshuffleTriggered || shuffleAutoReshuffled
                    ? 'AUTO-RESHUFFLE AKTIF!'
                    : shuffleStep === 1
                    ? 'Pola 1/3 Berjalan...'
                    : shuffleStep === 2
                    ? 'Pola 2/3 Berjalan...'
                    : 'Pola 3/3 Selesai!'}
                </span>
              </div>

              {/* 3-Segment Brutalist Progress Block */}
              <div className="grid grid-cols-3 gap-2">
                {/* Segment 1 */}
                <div
                  className={clsx(
                    'h-4 rounded border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all',
                    shuffleStep >= 2 || isAutoReshuffleTriggered || shuffleAutoReshuffled
                      ? 'bg-[#10B981]'
                      : 'bg-[#FFE600]'
                  )}
                >
                  {shuffleStep >= 2 || isAutoReshuffleTriggered || shuffleAutoReshuffled ? (
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-black animate-ping">●</span>
                  )}
                </div>
                {/* Segment 2 */}
                <div
                  className={clsx(
                    'h-4 rounded border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all relative overflow-hidden',
                    shuffleStep === 3 || isAutoReshuffleTriggered || shuffleAutoReshuffled
                      ? 'bg-[#10B981]'
                      : shuffleStep === 2
                      ? 'bg-[#FFE600]'
                      : 'bg-slate-200'
                  )}
                >
                  {shuffleStep === 3 || isAutoReshuffleTriggered || shuffleAutoReshuffled ? (
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  ) : shuffleStep === 2 ? (
                    <span className="text-[10px] font-black animate-ping">●</span>
                  ) : null}
                </div>
                {/* Segment 3 */}
                <div
                  className={clsx(
                    'h-4 rounded border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all',
                    shuffleStep === 3 || isAutoReshuffleTriggered || shuffleAutoReshuffled
                      ? 'bg-[#10B981]'
                      : 'bg-slate-200'
                  )}
                >
                  {(shuffleStep === 3 || isAutoReshuffleTriggered || shuffleAutoReshuffled) && (
                    <Check className="w-3 h-3 text-black stroke-[3]" />
                  )}
                </div>
              </div>
            </div>

            {/* Players Waiting Area (Relaxed Status Lounge) */}
            <div className="bg-[#F2F3FF] p-3.5 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000000]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-black">
                <span className="font-display text-xs uppercase font-black text-black flex items-center gap-1.5">
                  <span>☕</span>
                  KONDISI PEMAIN DI MEJA ({waitingPlayers.length}/{totalTablePlayers})
                </span>
                <span className="font-display text-[10px] bg-[#10B981] text-black px-2 py-0.5 rounded border border-black font-black whitespace-nowrap">
                  SEMUA SIAP
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {/* Local user card */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#10B981] text-black font-display text-xs flex items-center justify-center border-2 border-black flex-shrink-0 font-black">
                      {getInitials(currentUserName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-display text-xs font-bold text-black truncate">
                          {currentUserName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-black font-display text-[9px] border border-black uppercase font-bold">
                          ANDA
                        </span>
                      </div>
                      <span className="font-body text-[10px] text-[#10B981] flex items-center gap-0.5 font-bold leading-tight">
                        <Check className="w-3 h-3 stroke-[2.5]" /> SIAP DI MEJA
                      </span>
                    </div>
                  </div>

                  {/* Quick Sruput Reaction */}
                  <button
                    id="coffee-reaction-btn"
                    type="button"
                    onClick={handleCoffeeReaction}
                    className={clsx(
                      'px-2.5 py-1 rounded text-black border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1 font-display text-xs font-black flex-shrink-0 cursor-pointer transition-transform',
                      isLocalSruputActive ? 'bg-[#00D084] scale-105' : 'bg-[#FFE600]'
                    )}
                  >
                    <span>☕</span>
                    <span>{isLocalSruputActive ? 'Slruurpp!' : 'Sruput'}</span>
                  </button>
                </div>

                {/* Other waiting players / bots */}
                {waitingPlayers
                  .filter((p) => p.id !== currentUserId)
                  .map((p, pIdx) => {
                    const isPlayerSruput = Boolean(sruputActiveByPlayer[p.id]);
                    const quote = p.isBot
                      ? pIdx === 0
                        ? '🚬 Santuy di pojok kursi'
                        : '🥤 Menatap kartu lawan'
                      : '☕ Menunggu kocokan selesai';
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000000]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-8 h-8 rounded text-black font-display text-xs flex items-center justify-center border-2 border-black flex-shrink-0 font-black"
                            style={{ backgroundColor: p.avatarColor || '#3B82F6' }}
                          >
                            {p.initials || getInitials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-display text-xs font-bold text-black truncate">
                                {p.name}
                              </span>
                              {p.isBot && (
                                <span className="px-1.5 py-0.2 rounded bg-[#283044] text-white font-display text-[9px] border border-black uppercase font-bold">
                                  BOT
                                </span>
                              )}
                            </div>
                            <span className="font-body text-[10px] text-slate-600 flex items-center gap-0.5 leading-tight">
                              {quote}
                            </span>
                          </div>
                        </div>
                        {isPlayerSruput ? (
                          <span className="font-display text-[10px] px-2 py-0.5 rounded bg-[#FFE600] text-black border-2 border-black shadow-[1px_1px_0px_#000000] font-black flex-shrink-0 whitespace-nowrap animate-bounce">
                            ☕ Slruurpp!
                          </span>
                        ) : (
                          <span className="font-display text-[10px] px-2 py-0.5 rounded bg-[#4EDEA3] text-black border border-black font-bold flex-shrink-0 whitespace-nowrap">
                            SIAP DI MEJA
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quick Floating Action Cheer and Round Log Button */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="cheer-btn"
                type="button"
                onClick={handleCheerReaction}
                className={clsx(
                  'py-2.5 px-3 rounded-lg text-black font-display text-xs font-black uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer',
                  isTableCheering ? 'bg-[#FFE600]' : 'bg-white hover:bg-slate-50'
                )}
              >
                {isTableCheering ? (
                  <>
                    <Flame className="w-4 h-4 text-[#FF4343] stroke-[2.5]" />
                    <span>🔥 DISEMANGATI!</span>
                  </>
                ) : (
                  <>
                    <span>👋</span>
                    <span>SEMANGATIN!</span>
                  </>
                )}
              </button>

              <button
                id="peek-log-btn"
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="py-2.5 px-3 rounded-lg bg-[#10B981] hover:bg-emerald-400 text-black font-display text-xs font-black uppercase tracking-wider border-[3px] border-black shadow-[3px_3px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 stroke-[2.5]" />
                <span>LOG RONDE {roundNumber}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* Round Log Modal (Modal Log & Rekap Ronde)                                 */}
      {/* Stitch Screen: 77d196f887d548fc86fad1e789213006                          */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div
          id="modal-log-ronde"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
        >
          <div className="relative w-full max-w-md bg-[#FAF8FF] rounded-xl border-[3px] border-black shadow-[6px_6px_0px_#000000] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-[#FFE600] px-4 py-3 border-b-[3px] border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-black stroke-[2.5]" />
                <div>
                  <h3 className="font-display text-sm text-black font-black uppercase tracking-tight leading-none">
                    LOG & REKAP RONDE {roundNumber}
                  </h3>
                  <span className="font-display text-[10px] text-black uppercase font-bold tracking-wider">
                    ROOM #{displayRoomCode}
                  </span>
                </div>
              </div>
              <button
                id="close-modal-x"
                aria-label="Tutup Modal"
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center font-bold text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-transform cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 max-h-[75vh] overflow-y-auto flex flex-col gap-3.5">
              {/* Telemetry 2-col Grid: Kartu Pembuka & Status As */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
                  <span className="font-display text-[10px] text-slate-500 uppercase block font-bold">
                    Kartu Pembuka
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base font-black text-black leading-none">
                      7 {SUIT_SYMBOLS[openerSuit]}
                    </span>
                    <span className="font-display text-[10px] font-bold text-slate-600">
                      (Otomatis Meja)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#10B981]/15 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  <span className="font-display text-[10px] text-[#006C49] uppercase block font-bold">
                    Status Nilai As
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Lock className="w-3.5 h-3.5 text-[#006C49] stroke-[2.5]" />
                    <span className="font-display text-[10px] font-bold text-[#006C49]">
                      {aceMode === 'LOW'
                        ? 'As Rendah (1 Poin)'
                        : aceMode === 'HIGH'
                        ? 'As Tinggi (15 Poin)'
                        : 'Belum Terbuka (0 Poin)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leaderboard Table List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase font-black text-black flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-[#10B981]" />
                    HASIL AKHIR & POIN PENALTI
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {rankedScores.map((scoreEntry) => {
                    const isLoser = scoreEntry.isJuruKunci || scoreEntry.rankPosition === 4;
                    const isWinner = scoreEntry.isWinner || scoreEntry.rankPosition === 1;
                    const matchedPlayer = playersSource.find(
                      (p) => p.id === scoreEntry.playerId
                    );
                    const isMe = scoreEntry.playerId === currentUserId;
                    const isBotPlayer = Boolean(matchedPlayer?.isBot);

                    // Detail folded cards label
                    const foldedSummary =
                      scoreEntry.foldedCards && scoreEntry.foldedCards.length > 0
                        ? `Tutup: ${scoreEntry.foldedCards
                            .map((fc) => {
                              const rLabel = RANK_LABELS[fc.card.rank];
                              const sSym = SUIT_SYMBOLS[fc.card.suit];
                              return isKeyCard(fc.card) || fc.isKeyCardPenalty
                                ? `${rLabel}${sSym} 🔑 (+30)`
                                : `${rLabel}${sSym}`;
                            })
                            .join(' ')}`
                        : isWinner
                        ? 'Menang • Kartu Habis'
                        : '✨ PERFECT CLEAR';

                    return (
                      <div
                        key={scoreEntry.playerId}
                        className={clsx(
                          'p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between',
                          isLoser
                            ? 'bg-[#FFDAD6]/50'
                            : 'bg-white'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={clsx(
                              'w-6 h-6 rounded font-display font-black text-xs flex items-center justify-center border border-black flex-shrink-0',
                              isWinner
                                ? 'bg-[#10B981] text-black'
                                : isLoser
                                ? 'bg-[#BE091D] text-white'
                                : 'bg-slate-200 text-black'
                            )}
                          >
                            {scoreEntry.rankPosition}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-display text-xs font-bold text-black truncate">
                                {scoreEntry.playerName}
                              </span>
                              {isMe ? (
                                <span className="px-1 rounded bg-[#E1E7FF] text-black text-[9px] font-bold border border-black uppercase">
                                  Anda
                                </span>
                              ) : isBotPlayer ? (
                                <span className="px-1 rounded bg-[#283044] text-white text-[9px] font-bold border border-black uppercase">
                                  BOT
                                </span>
                              ) : (
                                <span className="px-1 rounded bg-white text-black text-[9px] font-bold border border-black uppercase">
                                  PEMAIN
                                </span>
                              )}
                              {isLoser && (
                                <span className="px-1 rounded bg-[#BE091D] text-white text-[9px] font-black border border-black uppercase">
                                  Juru Kunci
                                </span>
                              )}
                            </div>
                            <span
                              className={clsx(
                                'font-body text-[10px] block truncate',
                                isWinner
                                  ? 'text-[#006C49] font-bold'
                                  : isLoser
                                  ? 'text-[#BE091D] font-bold'
                                  : 'text-slate-600'
                              )}
                            >
                              {foldedSummary}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-2">
                          <span
                            className={clsx(
                              'font-display text-xs font-black block',
                              isWinner ? 'text-[#006C49]' : isLoser ? 'text-[#BE091D]' : 'text-black'
                            )}
                          >
                            {scoreEntry.totalPenalty === 0 ? '0 PT' : `-${scoreEntry.totalPenalty} PT`}
                          </span>
                          {isLoser && (
                            <span className="font-display text-[8px] text-black font-black uppercase">
                              Wajib Kocok!
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close Button */}
              <button
                id="close-modal-btn"
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="w-full py-2.5 px-3 rounded-lg bg-[#10B981] hover:bg-emerald-400 text-black font-display text-xs font-black uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition-transform cursor-pointer mt-1"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>TUTUP LOG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default ShuffleRitualScreen;
