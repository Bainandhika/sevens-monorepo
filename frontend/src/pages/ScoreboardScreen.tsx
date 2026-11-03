import React, { useState, useEffect, useMemo } from 'react';
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
import { RematchModal } from '../components/modals/RematchModal';
import { BrutalToast } from '../components/ui/BrutalToast';

export interface ScoreboardScreenProps {
  onRequestRematch: () => void;
  onReturnToLobby: () => void;
}

interface ProcessedScoreEntry {
  player: Player;
  rankPosition: 1 | 2 | 3 | 4;
  totalPenalty: number;
  foldedDetails: Array<{
    card: Card;
    points: number;
    isKeyCardPenalty: boolean;
    isAceLocked: boolean;
  }>;
  isWinner: boolean;
  isJuruKunci: boolean;
  lossesCount: number;
}

/**
 * Screen 4: Final Scoreboard & Rematch Screen (Papan Skor Akhir Neo-Brutalism)
 * Strictly follows PRD Bab 6 Layar 4 and Google Stitch Screen f0929f7d41dd4a3f82fdb77e65683df9:
 *
 * (1) Header fixed h-16 bg-[#FAF8FF] border-b-[2.5px] border-black dengan tombol kembali kotak putih dan judul 'PAPAN SKOR AKHIR'.
 * (2) Baris Peringkat 1 (Juara): card kuning bg-[#FFE600] rounded-xl p-3.5 border-[2.5px] border-black, nomor '1' bg-black text-white, nama pemain, badge hijau bg-[#10B981] 'PEMENANG', dan Total Penalti terendah.
 * (3) Baris Peringkat 2 & 3: card putih bg-white rounded-xl p-3.5 border-[2.5px] border-black.
 * (4) Baris Peringkat 4 (Kalah): card putih/merah dengan nomor '4' bg-[#FF4D4D] text-white, badge hitam bg-black text-white 'JURU KUNCI', badge '+1 Kalah (Total: Nx)', dan Total Penalti tertinggi berwarna merah '#FF4D4D'.
 * (5) Setiap baris pemain yang memiliki kartu tertutup menampilkan strip 'bg-[#FAF8FF] rounded-lg p-2 border-2 border-black flex flex-wrap gap-2': kartu 6 & 8 dirender dengan chip merah 'bg-[#FF4D4D] text-white border-2 border-black' + badge hitam '30 POIN'; kartu As dirender dengan badge kuning '0 / 1 / 15 Poin'; kartu biasa dirender dengan chip putih.
 * (6) Tombol bawah: 'MAIN LAGI' (bg-[#10B981] h-12 border-[2.5px] border-black shadow-[4px_4px_0px_#000]) yang membuka RematchModal 3 detik, dan 'KEMBALI KE LOBI' (bg-white h-12 border-[2.5px] border-black shadow-[4px_4px_0px_#000]).
 */
export const ScoreboardScreen: React.FC<ScoreboardScreenProps> = ({
  onRequestRematch,
  onReturnToLobby,
}) => {
  const {
    roomState,
    playerId,
    playerName,
    startRematch,
    leaveToLobby,
    toast,
  } = useGameStore();

  const [isRematchOpen, setIsRematchOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Fallback player data directly matching Stitch Screen f0929f7d41dd4a3f82fdb77e65683df9
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
          isConnected: true,
        },
        rankPosition: 1,
        totalPenalty: 0,
        foldedDetails: [],
        isWinner: true,
        isJuruKunci: false,
        lossesCount: 0,
      },
      {
        player: {
          id: 'bot_elena',
          name: 'Elena_F',
          initials: 'EF',
          avatarColor: '#4F46E5',
          isBot: true,
          isReady: true,
          hand: [],
          foldedCards: [
            { suit: 'spades', rank: 4 },
            { suit: 'hearts', rank: 5 },
          ],
          penaltyPoints: 9,
          lossesCount: 0,
          isConnected: true,
        },
        rankPosition: 2,
        totalPenalty: 9,
        foldedDetails: [
          {
            card: { suit: 'spades', rank: 4 },
            points: 4,
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
        lossesCount: 0,
      },
      {
        player: {
          id: 'bot_pitmrtn',
          name: 'PitMrtn',
          initials: 'PM',
          avatarColor: '#F59E0B',
          isBot: true,
          isReady: true,
          hand: [],
          foldedCards: [
            { suit: 'diamonds', rank: 6 },
            { suit: 'clubs', rank: 8 },
          ],
          penaltyPoints: 38,
          lossesCount: 0,
          isConnected: true,
        },
        rankPosition: 3,
        totalPenalty: 38,
        foldedDetails: [
          {
            card: { suit: 'diamonds', rank: 6 },
            points: 30,
            isKeyCardPenalty: true,
            isAceLocked: false,
          },
          {
            card: { suit: 'clubs', rank: 8 },
            points: 8,
            isKeyCardPenalty: false,
            isAceLocked: false,
          },
        ],
        isWinner: false,
        isJuruKunci: false,
        lossesCount: 0,
      },
      {
        player: {
          id: 'bot_bagus',
          name: 'Bagus_K',
          initials: 'BK',
          avatarColor: '#FF4D4D',
          isBot: true,
          isReady: true,
          hand: [],
          foldedCards: [
            { suit: 'spades', rank: 6 },
            { suit: 'hearts', rank: 8 },
            { suit: 'spades', rank: 1 },
          ],
          penaltyPoints: 75,
          lossesCount: 1,
          isConnected: true,
        },
        rankPosition: 4,
        totalPenalty: 75,
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
          {
            card: { suit: 'spades', rank: 1 },
            points: 15,
            isKeyCardPenalty: false,
            isAceLocked: true,
          },
        ],
        isWinner: false,
        isJuruKunci: true,
        lossesCount: 1,
      },
    ];
  }, [playerId, playerName]);

  // Compute processed leaderboard rankings from live roomState or fallback
  const rankedScores: ProcessedScoreEntry[] = useMemo(() => {
    if (!roomState || !roomState.players || roomState.players.length === 0) {
      return defaultFallbackScores;
    }

    const aceMode = roomState.aceMode || 'LOCKED_NONE';
    const rawScores = roomState.scores as Record<string, PlayerScoreDetail> | undefined;

    // Derive score entries for all players in roomState
    const mapped = roomState.players.map((p) => {
      const existingScore = rawScores ? rawScores[p.id] : undefined;

      let foldedDetails: Array<{
        card: Card;
        points: number;
        isKeyCardPenalty: boolean;
        isAceLocked: boolean;
      }>;
      let totalPenalty: number;

      if (existingScore) {
        foldedDetails = existingScore.foldedCards;
        totalPenalty = existingScore.totalPenalty;
      } else {
        foldedDetails = (p.foldedCards || []).map((card) => ({
          card,
          ...calculateCardPenalty(card, aceMode),
        }));
        totalPenalty = foldedDetails.reduce((sum, item) => sum + item.points, 0);
      }

      return {
        player: p,
        totalPenalty,
        foldedDetails,
        lossesCount: p.lossesCount || 0,
      };
    });

    // Sort ascending by total penalty: lowest penalty first (Rank 1 -> Winner)
    mapped.sort((a, b) => a.totalPenalty - b.totalPenalty);

    return mapped.map((entry, index) => {
      const rankPosition = (index + 1) as 1 | 2 | 3 | 4;
      const isWinner = rankPosition === 1;
      const isJuruKunci = rankPosition === 4;
      const lossesCount = isJuruKunci
        ? entry.lossesCount > 0
          ? entry.lossesCount
          : 1
        : entry.lossesCount;

      return {
        player: entry.player,
        rankPosition,
        totalPenalty: entry.totalPenalty,
        foldedDetails: entry.foldedDetails,
        isWinner,
        isJuruKunci,
        lossesCount,
      };
    });
  }, [roomState, defaultFallbackScores]);

  // Extract raw players list for RematchModal
  const modalPlayers: Player[] = useMemo(() => {
    return rankedScores.map((r) => r.player);
  }, [rankedScores]);

  // Rematch 3-second countdown timer interval
  useEffect(() => {
    if (!isRematchOpen) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 850);

    return () => clearInterval(timer);
  }, [isRematchOpen, countdown]);

  const handleOpenRematch = () => {
    setCountdown(3);
    setIsRematchOpen(true);
  };

  const handleCancelRematch = () => {
    setIsRematchOpen(false);
    setCountdown(3);
  };

  const handleCompleteRematch = () => {
    setIsRematchOpen(false);
    startRematch();
    onRequestRematch();
  };

  const handleReturnToLobby = () => {
    leaveToLobby();
    onReturnToLobby();
  };

  // Helper to render exposed folded card chips according to ui_rules (5)
  const renderFoldedCardChip = (
    foldedItem: {
      card: Card;
      points: number;
      isKeyCardPenalty: boolean;
      isAceLocked: boolean;
    },
    index: number
  ) => {
    const { card, points } = foldedItem;
    const rankLabel = RANK_LABELS[card.rank] || String(card.rank);
    const suitSymbol = SUIT_SYMBOLS[card.suit] || '♠';
    const isRedSuit = card.suit === 'hearts' || card.suit === 'diamonds';
    const isKey = isKeyCard(card);
    const isAce = card.rank === 1;

    // Rule (5a): Key cards 6 & 8 - Red chip with black badge '30 POIN'
    if (isKey) {
      return (
        <div
          key={`chip-${card.suit}-${card.rank}-${index}`}
          className="bg-[#FF4D4D] text-white px-2 py-1 rounded-md border-2 border-black flex items-center gap-1.5"
        >
          <span className="font-grotesk text-sm font-bold text-white">
            {rankLabel}
            {suitSymbol}
          </span>
          <span className="font-jakarta text-[10px] font-bold px-1.5 py-0.5 rounded bg-black text-white flex items-center gap-0.5 uppercase tracking-tight">
            30 POIN
          </span>
        </div>
      );
    }

    // Rule (5b): Ace card (1) - White chip with yellow badge '0 / 1 / 15 Poin'
    if (isAce) {
      return (
        <div
          key={`chip-${card.suit}-${card.rank}-${index}`}
          className="bg-white px-2 py-1 rounded-md border-2 border-black flex items-center gap-1.5"
        >
          <span
            className={clsx(
              'font-grotesk text-sm font-bold',
              isRedSuit ? 'text-[#FF4D4D]' : 'text-black'
            )}
          >
            A{suitSymbol}
          </span>
          <span className="font-jakarta text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#FFE600] border border-black text-black">
            {points} Poin
          </span>
        </div>
      );
    }

    // Rule (5c): Standard cards - White chip with soft background badge
    return (
      <div
        key={`chip-${card.suit}-${card.rank}-${index}`}
        className="bg-white px-2 py-1 rounded-md border-2 border-black flex items-center gap-1.5"
      >
        <span
          className={clsx(
            'font-grotesk text-sm font-bold',
            isRedSuit ? 'text-[#FF4D4D]' : 'text-black'
          )}
        >
          {rankLabel}
          {suitSymbol}
        </span>
        <span className="font-jakarta text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#FAF8FF] border border-black text-black">
          {points} Poin
        </span>
      </div>
    );
  };

  return (
    <AppShell variant="surface">
      {/* (1) Fixed Header Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-[#FAF8FF]/95 backdrop-blur border-b-[2.5px] border-black transition-transform duration-300"
        id="main-header"
      >
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Kembali ke Lobi"
              onClick={handleReturnToLobby}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000] transition-all text-black cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" />
            </button>
            <h1 className="font-grotesk text-xl font-extrabold tracking-tight uppercase text-black flex items-center gap-2">
              PAPAN SKOR AKHIR
            </h1>
          </div>
          <div className="flex items-center" />
        </div>
      </header>

      {/* Main Scoreboard Content Container */}
      <main
        className="flex flex-col relative w-full pt-20 px-4 pb-8 flex-grow transition-all duration-300"
        id="main-content"
      >
        <div className="relative z-10 w-full flex flex-col gap-4">
          {/* Players Final Leaderboard Rows (Ranks 1 to 4) */}
          <div className="flex flex-col gap-3.5 w-full">
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

              // (2) Baris Peringkat 1 (Juara): card kuning bg-[#FFE600]
              if (isWinner) {
                return (
                  <div
                    key={`rank-${player.id}-${rankPosition}`}
                    className="w-full bg-[#FFE600] rounded-xl p-3.5 border-[2.5px] border-black flex flex-col gap-2.5 shadow-[2px_2px_0px_#000]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-black text-white font-grotesk text-sm font-bold flex items-center justify-center border border-black">
                          1
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-grotesk text-lg font-bold text-black">
                              {player.name}
                            </span>
                            <span className="font-grotesk text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-[#10B981] text-black font-extrabold border-2 border-black uppercase">
                              PEMENANG
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-jakarta text-[11px] font-bold text-black/80 uppercase tracking-wide block">
                          Total Penalti
                        </span>
                        <span className="font-grotesk text-2xl font-extrabold text-black">
                          {totalPenalty}{' '}
                          <span className="text-sm font-bold">Poin</span>
                        </span>
                      </div>
                    </div>

                    {/* Strip kartu tertutup jika ada */}
                    {foldedDetails.length > 0 && (
                      <div className="bg-[#FAF8FF] rounded-lg p-2 border-2 border-black flex flex-wrap gap-2 items-center">
                        {foldedDetails.map((detail, idx) =>
                          renderFoldedCardChip(detail, idx)
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // (4) Baris Peringkat 4 (Kalah / Juru Kunci): nomor 4 merah, badge JURU KUNCI & +1 Kalah
              if (isJuruKunci) {
                return (
                  <div
                    key={`rank-${player.id}-${rankPosition}`}
                    className="w-full bg-white rounded-xl p-3.5 border-[2.5px] border-black flex flex-col gap-2.5 shadow-[2px_2px_0px_#000]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#FF4D4D] text-white font-grotesk text-sm font-bold flex items-center justify-center border-2 border-black">
                          4
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-grotesk text-base font-bold text-black">
                              {player.name}
                            </span>
                            <span className="font-grotesk text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-black text-white font-extrabold border border-black uppercase">
                              JURU KUNCI
                            </span>
                            <span className="font-grotesk text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-[#FF4D4D]/10 text-[#FF4D4D] font-extrabold border border-[#FF4D4D] uppercase">
                              +1 Kalah (Total: {lossesCount}x)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-jakarta text-[11px] font-bold text-black/70 uppercase tracking-wide block">
                          Total Penalti
                        </span>
                        <span className="font-grotesk text-2xl font-extrabold text-[#FF4D4D]">
                          {totalPenalty}{' '}
                          <span className="text-sm font-bold">Poin</span>
                        </span>
                      </div>
                    </div>

                    {/* Strip kartu tertutup */}
                    {foldedDetails.length > 0 && (
                      <div className="bg-[#FAF8FF] rounded-lg p-2 border-2 border-black flex flex-wrap gap-2 items-center">
                        {foldedDetails.map((detail, idx) =>
                          renderFoldedCardChip(detail, idx)
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // (3) Baris Peringkat 2 & 3: card putih bg-white rounded-xl
              return (
                <div
                  key={`rank-${player.id}-${rankPosition}`}
                  className="w-full bg-white rounded-xl p-3.5 border-[2.5px] border-black flex flex-col gap-2.5 shadow-[2px_2px_0px_#000]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#FAF8FF] text-black font-grotesk text-sm font-bold flex items-center justify-center border-2 border-black">
                        {rankPosition}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-grotesk text-base font-bold text-black">
                          {player.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-jakarta text-[11px] font-bold text-black/70 uppercase tracking-wide block">
                        Total Penalti
                      </span>
                      <span
                        className={clsx(
                          'font-grotesk text-lg font-bold',
                          totalPenalty >= 30 ? 'text-[#FF4D4D]' : 'text-black'
                        )}
                      >
                        {totalPenalty}{' '}
                        <span className="text-xs font-semibold text-black/70">
                          Poin
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Strip kartu tertutup */}
                  {foldedDetails.length > 0 && (
                    <div className="bg-[#FAF8FF] rounded-lg p-2 border-2 border-black flex flex-wrap gap-2 items-center">
                      {foldedDetails.map((detail, idx) =>
                        renderFoldedCardChip(detail, idx)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* (6) Bottom Action Dock Buttons */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              id="btn-play-again"
              type="button"
              onClick={handleOpenRematch}
              className="w-full h-12 rounded-xl bg-[#10B981] hover:bg-[#0ea372] text-black font-grotesk text-base font-extrabold border-[2.5px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              <span>Main Lagi</span>
            </button>
            <button
              id="btn-back-lobby"
              type="button"
              onClick={handleReturnToLobby}
              className="w-full h-12 rounded-xl bg-white hover:bg-slate-50 text-black font-grotesk text-base font-extrabold border-[2.5px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              <LogOut className="w-5 h-5 stroke-[2.5]" />
              <span>Kembali ke Lobi</span>
            </button>
          </div>
        </div>
      </main>

      {/* Rematch Synchronization Modal with 3-Second Countdown */}
      <RematchModal
        isOpen={isRematchOpen}
        countdown={countdown}
        players={modalPlayers}
        onCompleteCountdown={handleCompleteRematch}
        onCancel={handleCancelRematch}
      />

      {/* Global In-Game Toast Notifications */}
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

