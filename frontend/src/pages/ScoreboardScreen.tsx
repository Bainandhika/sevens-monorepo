import React, { useMemo } from 'react';
import { ArrowLeft, RotateCcw, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { Card, Player, PlayerScoreDetail } from '../types/game';
import { useGameStore, getInitials } from '../store/useGameStore';
import {
  RANK_LABELS,
  SUIT_SYMBOLS,
  calculateCardPenalty,
  isKeyCard,
} from '../constants/designTokens';
import { AppShell } from '../components/layout/AppShell';
import { BrutalToast } from '../components/ui/BrutalToast';

export interface ScoreboardScreenProps {
  onRequestRematch?: () => void;
  onReturnToLobby?: () => void;
}

interface ProcessedScoreEntry {
  player: Player;
  rankPosition: 1 | 2 | 3 | 4;
  totalPenalty: number;
  foldedDetails: Array<{
    card: Card;
    points: number;
    isKeyCardPenalty?: boolean;
    isAceLocked?: boolean;
  }>;
  isWinner: boolean;
  isJuruKunci: boolean;
  lossesCount: number;
  consecutiveLosses: number;
  statusRtRw: 'NONE' | 'RT' | 'RW';
}

/**
 * Helper to safely extract 2-character uppercase initials for a player
 */
function getPlayerInitials(player: Player): string {
  if (player.initials && player.initials.trim().length > 0) {
    return player.initials.trim().slice(0, 2).toUpperCase();
  }
  return getInitials(player.name || '');
}

/**
 * Screen 4: Final Scoreboard & Room Accumulation Screen (Papan Skor Akhir & Akumulasi Room)
 * Strictly matches Google Stitch Screen b2b54aed839d4334871e34c6065f6019 & PRD Bab 6 Layar 4:
 *
 * (1) Header: Mint green (bg-[#10b981] border-b-[3px] border-black) with back button (leaveRoom),
 *     title 'PAPAN SKOR', and room code pill #XXXXXX.
 * (2) Subheader bar: Left badge 'RONDE {roundNumber}', right badge '🔒 STATUS AS: {aceModeLabel}'.
 * (3) Section 1 ('RINCIAN KARTU PEMAIN'): Compact 4-player cards sorted by rankPosition (1..4).
 *     Each row shows avatar initials (1ST tag on rank 1), player name, ANDA/BOT badge, rank pill
 *     (PEMENANG, #2, #3, JURU KUNCI), total penalty points ({totalPenalty} POIN), bottom strip with
 *     inline folded card chips (Tutup: 4♦ 10♥ or ✨ PERFECT CLEAR), Kalah: {lossesCount}x, and an
 *     animated RT! / RW! badge if the player holds RT/RW.
 * (4) Section 2 ('STATUS RT / RW #{roomCode}'): Exclusive Neo-Brutalist card at the bottom of the
 *     main scroll area (border-[3px] border-black shadow-[4px_4px_0px_#000000]).
 *     - If holder exists: avatar (w-12 h-12), name, BOT/ANDA tag, pulsing red badge (KEPALA RW / RT),
 *       and description.
 *     - If no holder: neutral state ('BELUM ADA KEPALA RT / RW').
 * (5) Fixed Footer: Primary yellow button 'MAIN LAGI (REMATCH)' (onClick={triggerRematch}) and
 *     secondary white button 'KEMBALI KE MENU' (onClick={leaveRoom}).
 */
export const ScoreboardScreen: React.FC<ScoreboardScreenProps> = ({
  onRequestRematch,
  onReturnToLobby,
}) => {
  const {
    roomState,
    playerId,
    playerName,
    roomCodeInput,
    triggerRematch,
    leaveToLobby,
    toast,
  } = useGameStore();

  const displayRoomCode =
    (roomState?.id || roomCodeInput || 'IB9GVM').toUpperCase();
  const roundNumber = roomState?.roundNumber || 1;

  // Ace mode formatted for subheader telemetry pill (Stitch: STATUS AS: LOW / HIGH / BELUM TERBUKA)
  const aceModeLabel = useMemo(() => {
    const mode = roomState?.aceMode || 'LOCKED_NONE';
    if (mode === 'LOW') return 'LOW';
    if (mode === 'HIGH') return 'HIGH';
    return 'BELUM TERBUKA';
  }, [roomState?.aceMode]);

  // Leave room handler (returns to lobby)
  const leaveRoom = () => {
    if (onReturnToLobby) {
      onReturnToLobby();
    } else {
      leaveToLobby();
    }
  };

  // Rematch action handler
  const handleRematchClick = () => {
    triggerRematch();
    if (onRequestRematch) {
      onRequestRematch();
    }
  };

  // Default fallback data directly matching Stitch Screen b2b54aed839d4334871e34c6065f6019
  const defaultFallbackScores: ProcessedScoreEntry[] = useMemo(() => {
    const userDisplayName = playerName || 'Sekop07';
    return [
      {
        player: {
          id: playerId || 'p1',
          name: userDisplayName,
          initials: getInitials(userDisplayName),
          avatarColor: '#10B981',
          isBot: false,
          isReady: true,
          hand: [],
          foldedCards: [],
          penaltyPoints: 0,
          lossesCount: 0,
          consecutiveLosses: 0,
          statusRtRw: 'NONE',
          isConnected: true,
        },
        rankPosition: 1,
        totalPenalty: 0,
        foldedDetails: [],
        isWinner: true,
        isJuruKunci: false,
        lossesCount: 0,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
      },
      {
        player: {
          id: 'bot_wajik',
          name: 'Wajik99',
          initials: 'W9',
          avatarColor: '#F59E0B',
          isBot: true,
          isReady: true,
          hand: [],
          foldedCards: [
            { suit: 'diamonds', rank: 4 },
            { suit: 'hearts', rank: 10 },
          ],
          penaltyPoints: 14,
          lossesCount: 1,
          consecutiveLosses: 0,
          statusRtRw: 'NONE',
          isConnected: true,
        },
        rankPosition: 2,
        totalPenalty: 14,
        foldedDetails: [
          {
            card: { suit: 'diamonds', rank: 4 },
            points: 4,
            isKeyCardPenalty: false,
            isAceLocked: false,
          },
          {
            card: { suit: 'hearts', rank: 10 },
            points: 10,
            isKeyCardPenalty: false,
            isAceLocked: false,
          },
        ],
        isWinner: false,
        isJuruKunci: false,
        lossesCount: 1,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
      },
      {
        player: {
          id: 'bot_taktik',
          name: 'Taktik7',
          initials: 'T7',
          avatarColor: '#38BDF8',
          isBot: true,
          isReady: true,
          hand: [],
          foldedCards: [
            { suit: 'spades', rank: 11 },
            { suit: 'clubs', rank: 13 },
            { suit: 'hearts', rank: 5 },
          ],
          penaltyPoints: 28,
          lossesCount: 2,
          consecutiveLosses: 0,
          statusRtRw: 'NONE',
          isConnected: true,
        },
        rankPosition: 3,
        totalPenalty: 28,
        foldedDetails: [
          {
            card: { suit: 'spades', rank: 11 },
            points: 11,
            isKeyCardPenalty: false,
            isAceLocked: false,
          },
          {
            card: { suit: 'clubs', rank: 13 },
            points: 13,
            isKeyCardPenalty: false,
            isAceLocked: false,
          },
          {
            card: { suit: 'hearts', rank: 5 },
            points: 5,
            isKeyCardPenalty: false,
            isAceLocked: false,
          },
        ],
        isWinner: false,
        isJuruKunci: false,
        lossesCount: 2,
        consecutiveLosses: 0,
        statusRtRw: 'NONE',
      },
      {
        player: {
          id: 'bot_cermat',
          name: 'Cermat8',
          initials: 'BA',
          avatarColor: '#FB7185',
          isBot: true,
          isReady: true,
          hand: [],
          foldedCards: [
            { suit: 'spades', rank: 6 },
            { suit: 'hearts', rank: 8 },
          ],
          penaltyPoints: 52,
          lossesCount: 6,
          consecutiveLosses: 6,
          statusRtRw: 'RW',
          isConnected: true,
        },
        rankPosition: 4,
        totalPenalty: 52,
        foldedDetails: [
          {
            card: { suit: 'spades', rank: 6 },
            points: 30,
            isKeyCardPenalty: true,
            isAceLocked: false,
          },
          {
            card: { suit: 'hearts', rank: 8 },
            points: 30,
            isKeyCardPenalty: true,
            isAceLocked: false,
          },
        ],
        isWinner: false,
        isJuruKunci: true,
        lossesCount: 6,
        consecutiveLosses: 6,
        statusRtRw: 'RW',
      },
    ];
  }, [playerId, playerName]);

  // Compute processed leaderboard rankings from live roomState or fallback
  const rankedScores: ProcessedScoreEntry[] = useMemo(() => {
    if (!roomState || !roomState.players || roomState.players.length === 0) {
      return defaultFallbackScores;
    }

    const aceMode = roomState.aceMode || 'LOCKED_NONE';
    const rawScores = roomState.scores as
      | Record<string, PlayerScoreDetail>
      | undefined;

    const mapped = roomState.players.map((p) => {
      const existingScore = rawScores ? rawScores[p.id] : undefined;

      let foldedDetails: Array<{
        card: Card;
        points: number;
        isKeyCardPenalty?: boolean;
        isAceLocked?: boolean;
      }>;
      let totalPenalty: number;
      let rankPosition: 1 | 2 | 3 | 4 | undefined = existingScore?.rankPosition;

      if (existingScore) {
        foldedDetails = existingScore.foldedCards;
        totalPenalty = existingScore.totalPenalty;
      } else {
        foldedDetails = (p.foldedCards || []).map((card) => ({
          card,
          ...calculateCardPenalty(card, aceMode),
        }));
        totalPenalty = foldedDetails.reduce(
          (sum, item) => sum + item.points,
          0
        );
      }

      const lossesCount =
        p.lossesCount ?? existingScore?.lossesCount ?? 0;
      const consecutiveLosses =
        p.consecutiveLosses ?? existingScore?.consecutiveLosses ?? 0;
      const statusRtRw =
        p.statusRtRw ?? existingScore?.statusRtRw ?? 'NONE';

      return {
        player: p,
        totalPenalty,
        foldedDetails,
        rankPosition,
        lossesCount,
        consecutiveLosses,
        statusRtRw,
      };
    });

    // Sort by rankPosition if assigned, otherwise by totalPenalty ascending
    mapped.sort((a, b) => {
      if (a.rankPosition && b.rankPosition) {
        return a.rankPosition - b.rankPosition;
      }
      return a.totalPenalty - b.totalPenalty;
    });

    return mapped.map((entry, index) => {
      const rankPosition = (index + 1) as 1 | 2 | 3 | 4;
      const isWinner = rankPosition === 1;
      const isJuruKunci = rankPosition === 4;

      return {
        player: entry.player,
        rankPosition,
        totalPenalty: entry.totalPenalty,
        foldedDetails: entry.foldedDetails,
        isWinner,
        isJuruKunci,
        lossesCount: entry.lossesCount,
        consecutiveLosses: entry.consecutiveLosses,
        statusRtRw: entry.statusRtRw,
      };
    });
  }, [roomState, defaultFallbackScores]);

  // Find the single active RT/RW status holder in the room
  const rtRwHolder = useMemo(() => {
    // 1. Check if roomState explicitly defines an active rtRwHolderId & status
    if (
      roomState?.rtRwHolderId &&
      roomState?.rtRwStatus &&
      roomState.rtRwStatus !== 'NONE'
    ) {
      const found = roomState.players.find(
        (p) => p.id === roomState.rtRwHolderId
      );
      if (found) {
        return {
          ...found,
          statusRtRw: roomState.rtRwStatus,
        };
      }
    }

    // 2. Check rankedScores players
    const activeScoreEntry = rankedScores.find(
      (e) => e.statusRtRw === 'RT' || e.statusRtRw === 'RW'
    );
    if (activeScoreEntry) {
      return {
        ...activeScoreEntry.player,
        statusRtRw: activeScoreEntry.statusRtRw,
        consecutiveLosses: activeScoreEntry.consecutiveLosses,
      };
    }

    // 3. Check raw roomState players
    if (roomState?.players) {
      const rawHolder = roomState.players.find(
        (p) => p.statusRtRw === 'RT' || p.statusRtRw === 'RW'
      );
      if (rawHolder) return rawHolder;
    }

    return null;
  }, [roomState, rankedScores]);

  // Helper to render compact folded card chips matching Stitch Screen b2b54aed839d4334871e34c6065f6019
  const renderFoldedCardChip = (
    detail: {
      card: Card;
      points: number;
      isKeyCardPenalty?: boolean;
      isAceLocked?: boolean;
    },
    idx: number
  ) => {
    const { card } = detail;
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const suitSymbol = SUIT_SYMBOLS[card.suit] || '♠';
    const rankLabel = RANK_LABELS[card.rank] || String(card.rank);
    const isKey = isKeyCard(card);

    return (
      <span
        key={`folded-${card.suit}-${card.rank}-${idx}`}
        className={clsx(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-black text-[11px] font-display font-bold shadow-[1px_1px_0px_#000000]',
          isRed ? 'text-red-600' : 'text-slate-900'
        )}
      >
        <span>
          {rankLabel}
          {suitSymbol}
        </span>
        {isKey && <span className="text-[10px]">🔑</span>}
      </span>
    );
  };

  return (
    <AppShell variant="surface">
      {/* (1) Fixed Header Bar: Mint green with back button, title 'PAPAN SKOR', and room code pill */}
      <header
        className="fixed top-0 inset-x-0 z-40 bg-[#10b981] border-b-[3px] border-black pt-safe"
        id="main-header"
      >
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Kembali ke Menu"
              onClick={leaveRoom}
              className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black hover:bg-slate-50 transition-transform active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" />
            </button>
            <h1 className="font-display font-black text-lg sm:text-xl uppercase tracking-tight text-white">
              PAPAN SKOR
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-white text-black font-display text-xs font-bold border-2 border-black shadow-[1.5px_1.5px_0px_#000000]">
              #{displayRoomCode}
            </span>
          </div>
        </div>
      </header>

      {/* Main Scoreboard Content Container */}
      <main
        className="flex flex-col relative w-full pt-20 px-4 flex-grow"
        style={{ paddingBottom: '160px' }}
        id="main-content"
      >
        {/* (2) Subheader / Bar Info Neo-Brutalist */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3 pt-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white text-black font-display text-xs font-bold border-2 border-black shadow-[1.5px_1.5px_0px_#000000]">
            RONDE {roundNumber}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black font-display text-xs font-bold border-2 border-black shadow-[1.5px_1.5px_0px_#000000]">
            <span>🔒</span>
            <span>STATUS AS: {aceModeLabel}</span>
          </span>
        </div>

        {/* Section 1 Header: Rincian Kartu Pemain */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[#006c49] text-lg font-bold">📋</span>
            <h2 className="font-display font-black text-sm uppercase tracking-tight text-black">
              RINCIAN KARTU PEMAIN
            </h2>
          </div>
        </div>

        {/* (3) Section 1: Compact 4-Player Cards List sorted by rankPosition (1..4) */}
        <div className="flex flex-col gap-2 mb-4">
          {rankedScores.map((entry) => {
            const {
              player,
              rankPosition,
              totalPenalty,
              foldedDetails,
              isWinner,
              isJuruKunci,
              lossesCount,
            } = entry;

            const initials = getPlayerInitials(player);
            const isMe = player.id === playerId;

            return (
              <div
                key={`rank-${player.id}-${rankPosition}`}
                className={clsx(
                  'w-full border-[2.5px] border-black rounded-xl p-2.5 shadow-[3px_3px_0px_#000000]',
                  isJuruKunci ? 'bg-[#FFF5F5]' : 'bg-white'
                )}
              >
                {/* Top Row: Avatar, Name + Badges, Rank Pill, and Total Penalty */}
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b-[1.5px] border-black/15">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Avatar with initials & 1ST tag for rank 1 */}
                    <div className="relative shrink-0">
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center font-display text-[13px] font-black text-black shadow-[1px_1px_0px_#000000]"
                        style={{
                          backgroundColor: player.avatarColor || '#FFE600',
                        }}
                      >
                        {initials}
                      </div>
                      {rankPosition === 1 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#FFE600] text-black border border-black rounded text-[7px] font-display font-black px-0.5 leading-none shadow-[0.5px_0.5px_0px_#000]">
                          1ST
                        </span>
                      )}
                    </div>

                    {/* Name and Tags */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-[13px] sm:text-[14px] text-black truncate max-w-[120px]">
                          {player.name}
                        </span>

                        {/* ANDA / BOT badge */}
                        {isMe ? (
                          <span className="px-1 py-0.2 rounded bg-[#10b981]/20 text-[#006c49] text-[9px] font-display font-bold border border-[#10b981]">
                            ANDA
                          </span>
                        ) : player.isBot ? (
                          <span className="bg-[#121212] text-white text-[7px] px-1 py-0.5 rounded font-display font-bold uppercase shrink-0">
                            BOT
                          </span>
                        ) : null}

                        {/* Rank Pill: PEMENANG, #2, #3, JURU KUNCI */}
                        {rankPosition === 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-[#10b981] text-white text-[9px] font-display font-black border border-black uppercase">
                            PEMENANG
                          </span>
                        )}
                        {rankPosition === 2 && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 text-black text-[9px] font-display font-bold border border-black">
                            #2
                          </span>
                        )}
                        {rankPosition === 3 && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 text-black text-[9px] font-display font-bold border border-black">
                            #3
                          </span>
                        )}
                        {rankPosition === 4 && (
                          <span className="px-1.5 py-0.2 rounded bg-[#ba1a1a] text-white text-[9px] font-display font-black border border-black uppercase">
                            JURU KUNCI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total Penalty Points */}
                  <div className="text-right shrink-0">
                    <span
                      className={clsx(
                        'font-display font-bold text-[15px] sm:text-[16px] leading-none',
                        isWinner
                          ? 'text-[#006c49]'
                          : isJuruKunci
                          ? 'text-[#ba1a1a]'
                          : 'text-black'
                      )}
                    >
                      {totalPenalty}{' '}
                      <span className="text-[10px] text-black/60 font-semibold">
                        POIN
                      </span>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Inline Folded Card Chips or PERFECT CLEAR, RT!/RW! badge, and Kalah: Nx */}
                <div className="flex items-center justify-between pt-1.5 text-[12px] gap-2">
                  {foldedDetails.length === 0 ? (
                    <div className="flex items-center gap-1.5 text-[#006c49] font-bold text-xs">
                      <span className="text-[14px]">✨</span>
                      <span>PERFECT CLEAR</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[11px] text-black/60 font-semibold">
                        Tutup:
                      </span>
                      {foldedDetails.map((detail, idx) =>
                        renderFoldedCardChip(detail, idx)
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Animated RT! / RW! badge if player holds RT/RW */}
                    {(entry.statusRtRw === 'RT' ||
                      entry.statusRtRw === 'RW') && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#8b0000] text-[#ffe600] border border-black animate-pulse shadow-[1px_1px_0px_#000]">
                        {entry.statusRtRw}!
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-black whitespace-nowrap">
                      Kalah: {lossesCount}x
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* (4) Section 2: Exclusive Status RT / RW Holder Card */}
        <div className="w-full bg-white border-[3px] border-black rounded-xl p-3 shadow-[4px_4px_0px_#000000] mb-4">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b-2 border-black">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-black text-white font-display text-[11px] font-black tracking-tight uppercase">
                STATUS RT / RW
              </span>
              <span className="font-display font-bold text-[13px] text-black">
                #{displayRoomCode}
              </span>
            </div>
          </div>

          {rtRwHolder ? (
            <div className="p-2.5 rounded-xl bg-rose-50/80 border-2 border-black shadow-[2px_2px_0px_#000000]">
              <div className="flex items-center justify-between pb-1.5 border-b-[1.5px] border-black/15">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center font-display text-sm font-black text-white shadow-[1px_1px_0px_#000] shrink-0"
                    style={{
                      backgroundColor: rtRwHolder.avatarColor || '#E11D48',
                    }}
                  >
                    {getPlayerInitials(rtRwHolder)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-[14px] sm:text-[15px] text-black">
                        {rtRwHolder.name}
                      </span>
                      {rtRwHolder.id === playerId ? (
                        <span className="bg-[#10b981] text-white text-[8px] px-1.5 py-0.5 rounded font-display font-bold uppercase">
                          ANDA
                        </span>
                      ) : rtRwHolder.isBot ? (
                        <span className="bg-[#121212] text-white text-[8px] px-1.5 py-0.5 rounded font-display font-bold uppercase">
                          BOT
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[11px] text-black/60 font-semibold block mt-0.5">
                      {rtRwHolder.statusRtRw === 'RW'
                        ? 'Gelar: Kepala RW Room'
                        : 'Gelar: Kepala RT Room'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#8b0000] text-white font-display font-black text-[11px] tracking-wide border border-black shadow-[1.5px_1.5px_0px_#000000] animate-pulse">
                    <span>📢</span>
                    <span>KEPALA {rtRwHolder.statusRtRw}</span>
                  </span>
                </div>
              </div>

              <div className="pt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-black/70 font-medium">
                  {rtRwHolder.statusRtRw === 'RW'
                    ? 'Mencapai 2x status RT beruntun (6x Kalah Beruntun)'
                    : 'Kalah 3x berturut-turut di room yang sama'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-black/40 flex flex-col items-center justify-center text-center">
              <span className="text-2xl mb-1">🏛️</span>
              <span className="font-display font-bold text-xs text-black uppercase tracking-wide">
                BELUM ADA KEPALA RT / RW
              </span>
              <span className="text-[11px] text-black/60 font-medium mt-0.5">
                Belum ada pemain yang kalah 3x berturut-turut di meja ini.
              </span>
            </div>
          )}
        </div>
      </main>

      {/* (5) Fixed Footer: Primary yellow button 'MAIN LAGI (REMATCH)' and secondary white button 'KEMBALI KE MENU' */}
      <footer
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t-[2.5px] border-black shadow-[0_-8px_20px_rgba(0,0,0,0.1)] pb-safe"
        id="scoreboard-footer"
      >
        <div className="max-w-md mx-auto px-4 py-3 flex flex-col gap-2">
          <button
            id="btn-play-again"
            type="button"
            onClick={handleRematchClick}
            className="w-full py-3 px-4 rounded-xl bg-[#FFE600] hover:bg-yellow-300 active:translate-x-[2px] active:translate-y-[2px] text-black font-display text-[15px] font-black uppercase tracking-wide border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-2 transition-transform cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>MAIN LAGI (REMATCH)</span>
          </button>
          <button
            id="btn-back-menu"
            type="button"
            onClick={leaveRoom}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:translate-x-[2px] active:translate-y-[2px] text-black font-display text-[14px] font-bold uppercase tracking-wide border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5 transition-transform cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>KEMBALI KE MENU</span>
          </button>
        </div>
      </footer>

      {/* In-Game Toast Notifications if rendered in isolation */}
      {toast?.visible && (
        <BrutalToast
          message={toast.message}
          icon={toast.icon}
          visible={toast.visible}
        />
      )}
    </AppShell>
  );
};

export default ScoreboardScreen;
