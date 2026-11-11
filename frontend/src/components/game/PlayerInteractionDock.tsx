import React from 'react';
import clsx from 'clsx';
import { Card } from '../../types/game';
import { PlayingCard } from './PlayingCard';
import {
  RANK_LABELS,
  SUIT_SYMBOLS,
  isKeyCard,
} from '../../constants/designTokens';

export interface PlayerInteractionDockProps {
  hand: Card[];
  foldedCards: Card[];
  currentPenaltyPoints: number;
  validMoves: Card[];
  selectedCard: Card | null;
  isMyTurn: boolean;
  onSelectCard: (card: Card) => void;
  onPlayCard: (card: Card) => void;
  onRequestFoldCard: (card: Card) => void;
  className?: string;
}

/**
 * PlayerInteractionDock
 *
 * Bottom interaction dock adhering to Tujuhan Tactical (7-an) Neo-Brutalist & Stitch Gameplay specs:
 * 3-Tier Vertical Layout:
 * - Tier 1 (Top Action Buttons): grid grid-cols-2 gap-2 with 'TUTUP' (bg-[#FF5A5F]) and 'MAINKAN' (bg-[#00D084]).
 * - Tier 2 (Middle 'KARTU TANGAN' Rack): Full-width container (bg-[#1B4332] border-2 border-black rounded-xl p-1.5 shadow-[2px_2px_0px_#000000])
 *   with header ('KARTU TANGAN ({hand.length})' + status pill) and a 2-row no-scroll grid:
 *     Row 1 (grid grid-cols-7 gap-1): hand.slice(0, 7)
 *     Row 2 (grid grid-cols-6 gap-1 px-3 mt-1): hand.slice(7, 13)
 * - Tier 3 (Bottom 'KARTU TUTUP' Strip): Compact horizontal bar (bg-[#1B4332] border-2 border-black rounded-xl py-1 px-2.5 flex items-center justify-between gap-2)
 *   with label 'KARTU TUTUP', penalty badge 'Total: -{totalFoldPenalty} Poin', and horizontally scrollable mini-chips of foldedCards.
 */
export const PlayerInteractionDock: React.FC<PlayerInteractionDockProps> = ({
  hand,
  foldedCards,
  currentPenaltyPoints,
  validMoves,
  selectedCard,
  isMyTurn,
  onSelectCard,
  onPlayCard,
  onRequestFoldCard,
  className,
}) => {
  // Check if selected card is playable
  const isSelectedPlayable = Boolean(
    isMyTurn &&
      selectedCard &&
      validMoves.some(
        (vm) => vm.suit === selectedCard.suit && vm.rank === selectedCard.rank
      )
  );

  // Aturan Anti-Bohong & Anti-Sabotase Kartu 7:
  // Cannot fold if player still has legal moves (validMoves.length > 0)
  // or if selected card is rank 7
  const isFoldDisabled = Boolean(
    !isMyTurn ||
      !selectedCard ||
      validMoves.length > 0 ||
      selectedCard.rank === 7
  );

  const isPlayDisabled = !isSelectedPlayable;

  // Selected card glyph badge
  const selectedCardLabel = selectedCard
    ? `${RANK_LABELS[selectedCard.rank]}${SUIT_SYMBOLS[selectedCard.suit]}`
    : '';

  const isSelectedKey = selectedCard ? isKeyCard(selectedCard) : false;

  // Label formatting
  let foldButtonLabel = 'TUTUP';
  if (selectedCard) {
    if (isSelectedKey && !isFoldDisabled) {
      foldButtonLabel = `⚠️ TUTUP (${selectedCardLabel})`;
    } else {
      foldButtonLabel = `TUTUP (${selectedCardLabel})`;
    }
  }

  const playButtonLabel = selectedCard
    ? `MAINKAN (${selectedCardLabel})`
    : 'MAINKAN';

  // Tooltip hints for players
  let foldTitle = 'Tutup kartu yang dipilih';
  if (!isMyTurn) {
    foldTitle = 'Bukan giliran Anda';
  } else if (!selectedCard) {
    foldTitle = 'Pilih kartu di tangan terlebih dahulu';
  } else if (validMoves.length > 0) {
    foldTitle =
      'Dilarang menutup kartu jika masih memiliki langkah sah di meja (Aturan Anti-Bohong)';
  } else if (selectedCard.rank === 7) {
    foldTitle = 'Kartu 7 dilarang ditutup (Anti-Sabotase Kartu 7)';
  } else if (isSelectedKey) {
    foldTitle = 'Peringatan: Menutup kartu kunci dikenakan denda flat 30 poin!';
  }

  let playTitle = 'Mainkan kartu ke meja';
  if (!isMyTurn) {
    playTitle = 'Bukan giliran Anda';
  } else if (!selectedCard) {
    playTitle = 'Pilih kartu di tangan terlebih dahulu';
  } else if (!isSelectedPlayable) {
    playTitle = 'Kartu ini belum dapat dimainkan di meja saat ini';
  }

  const handleFoldClick = () => {
    if (isFoldDisabled || !selectedCard) return;
    onRequestFoldCard(selectedCard);
  };

  const handlePlayClick = () => {
    if (isPlayDisabled || !selectedCard) return;
    onPlayCard(selectedCard);
  };

  // Support double-tap gesture to quickly play or request fold
  const handleDoubleTapHandCard = (card: Card) => {
    if (!isMyTurn) return;

    const isPlayable = validMoves.some(
      (vm) => vm.suit === card.suit && vm.rank === card.rank
    );

    if (isPlayable) {
      onPlayCard(card);
      return;
    }

    const canFold = validMoves.length === 0 && card.rank !== 7;
    if (canFold) {
      onRequestFoldCard(card);
      return;
    }

    onSelectCard(card);
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Area Interaksi Pemain"
      className={clsx(
        'w-full bg-[#EDEBE6] border-t-[3px] border-black p-2 sm:p-2.5 flex flex-col gap-2 z-20 select-none shrink-0',
        className
      )}
    >
      <div className="flex flex-col gap-2 max-w-[480px] w-full mx-auto">
        {/* Tier 1: Action Buttons (TUTUP & MAINKAN) */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {/* Tombol Kiri: TUTUP */}
          <button
            type="button"
            onClick={handleFoldClick}
            disabled={isFoldDisabled}
            title={foldTitle}
            aria-label={foldButtonLabel}
            className={clsx(
              'w-full py-2.5 sm:py-3 rounded-xl border-2 border-black font-display font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-150',
              'bg-[#FF5A5F] text-white',
              isFoldDisabled
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'shadow-[2px_2px_0px_#000000] hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5'
            )}
          >
            TUTUP
          </button>

          {/* Tombol Kanan: MAINKAN */}
          <button
            type="button"
            onClick={handlePlayClick}
            disabled={isPlayDisabled}
            title={playTitle}
            aria-label={playButtonLabel}
            className={clsx(
              'w-full py-2.5 sm:py-3 rounded-xl border-2 border-black font-display font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-150',
              'bg-[#00D084] text-black',
              isPlayDisabled
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'shadow-[2px_2px_0px_#000000] hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5'
            )}
          >
            MAINKAN
          </button>
        </div>

        {/* Tier 2: Middle 'KARTU TANGAN' Rack */}
        <div
          role="region"
          aria-label="Rak Kartu Tangan"
          className="bg-[#1B4332] border-2 border-black rounded-xl p-1.5 shadow-[2px_2px_0px_#000000] flex flex-col"
        >
          {/* Header Kartu Tangan */}
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="font-display font-black text-xs uppercase tracking-tight text-white">
              KARTU TANGAN ({hand.length})
            </span>
            {isMyTurn ? (
              validMoves.length > 0 ? (
                <span className="bg-[#00D084] text-black font-display font-black text-[10.5px] px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] leading-none">
                  {validMoves.length} BISA MAIN
                </span>
              ) : (
                <span className="bg-[#FF5A5F] text-white font-display font-black text-[10.5px] px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] leading-none">
                  WAJIB TUTUP
                </span>
              )
            ) : (
              <span className="bg-[#FFE600] text-black font-display font-black text-[10.5px] px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] leading-none">
                MENUNGGU
              </span>
            )}
          </div>

          {/* 2-Row No-Scroll Hand Cards Grid */}
          {hand.length === 0 ? (
            <div className="h-14 flex items-center justify-center text-center rounded-lg border border-dashed border-white/20 text-white/60 text-xs font-display font-bold">
              Tangan Kosong
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Baris 1 (7 kolom): hand.slice(0, 7) */}
              <div className="grid grid-cols-7 gap-1">
                {hand.slice(0, 7).map((card) => {
                  const isSelected = Boolean(
                    selectedCard &&
                      selectedCard.suit === card.suit &&
                      selectedCard.rank === card.rank
                  );

                  const isPlayable = validMoves.some(
                    (vm) => vm.suit === card.suit && vm.rank === card.rank
                  );

                  return (
                    <PlayingCard
                      key={`hand-${card.suit}-${card.rank}`}
                      card={card}
                      variant="hand"
                      isSelected={isSelected}
                      isPlayable={isPlayable}
                      disabled={!isMyTurn}
                      onSelect={() => onSelectCard(card)}
                      onDoubleTap={() => handleDoubleTapHandCard(card)}
                    />
                  );
                })}
              </div>

              {/* Baris 2 (6 kolom): hand.slice(7, 13) */}
              {hand.length > 7 && (
                <div className="grid grid-cols-6 gap-1 px-3 mt-1">
                  {hand.slice(7, 13).map((card) => {
                    const isSelected = Boolean(
                      selectedCard &&
                        selectedCard.suit === card.suit &&
                        selectedCard.rank === card.rank
                    );

                    const isPlayable = validMoves.some(
                      (vm) => vm.suit === card.suit && vm.rank === card.rank
                    );

                    return (
                      <PlayingCard
                        key={`hand-${card.suit}-${card.rank}`}
                        card={card}
                        variant="hand"
                        isSelected={isSelected}
                        isPlayable={isPlayable}
                        disabled={!isMyTurn}
                        onSelect={() => onSelectCard(card)}
                        onDoubleTap={() => handleDoubleTapHandCard(card)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tier 3: Bottom 'KARTU TUTUP' Strip */}
        <div
          role="region"
          aria-label="Kotak Kartu Tutup"
          className="bg-[#1B4332] border-2 border-black rounded-xl py-1 px-2.5 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000000]"
        >
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-display font-black text-xs uppercase tracking-tight text-white">
              KARTU TUTUP
            </span>
            <span className="bg-[#FF5A5F] text-white font-display font-black text-[10px] px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000000] leading-none">
              Total: -{currentPenaltyPoints} Poin
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[60%] sm:max-w-[70%]">
            {foldedCards.length === 0 ? (
              <span className="text-white/40 text-[10px] font-bold italic">
                0 kartu
              </span>
            ) : (
              foldedCards.map((card, idx) => {
                const isKey = isKeyCard(card);
                const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
                const textColor = isKey ? '#FFFFFF' : (isRed ? '#FF4343' : '#000000');
                const rankLabel = RANK_LABELS[card.rank] ?? String(card.rank);
                const suitSymbol = SUIT_SYMBOLS[card.suit] ?? '';

                return (
                  <div
                    key={`folded-${card.suit}-${card.rank}-${idx}`}
                    className={clsx(
                      'h-7 px-1.5 rounded-lg border-2 border-black flex items-center justify-between gap-1 shrink-0 select-none font-display font-black text-xs shadow-[1px_1px_0px_#000000]',
                      isKey ? 'bg-[#FF4D4D]' : 'bg-white'
                    )}
                    style={{ color: textColor }}
                    title={`Kartu Tutup: ${rankLabel}${suitSymbol}${isKey ? ' (Denda 30 Poin)' : ''}`}
                  >
                    <span className="leading-none">{rankLabel}</span>
                    {isKey && <span className="text-[9px] leading-none">🔑</span>}
                    <span className="text-sm font-bold leading-none">{suitSymbol}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlayerInteractionDock;
