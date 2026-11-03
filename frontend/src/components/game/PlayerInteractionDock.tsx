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
 * 1. Action Buttons Row:
 *    - Left Button: "TUTUP" (bg-[#FF4343] text-white).
 *      Disabled if:
 *        - validMoves.length > 0 (Aturan Anti-Bohong: cannot fold if legal moves exist)
 *        - selectedCard.rank === 7 (Anti-Sabotase: 7 cannot be folded)
 *        - !isMyTurn or !selectedCard
 *      Warning label "⚠️ TUTUP (6♥/8♠)" shown when key card 6 or 8 is selected and folding is allowed.
 *    - Right Button: "MAINKAN" (bg-[#00D084] text-black).
 *      Enabled ONLY if selectedCard is within validMoves and isMyTurn.
 * 2. Bottom Tray Area:
 *    - Left Tray (110px): Folded cards 2-column grid with header 'TUTUP' and red penalty badge 'P: XX'.
 *    - Center Separator: Vertical black divider (w-0.5 bg-black/30).
 *    - Right Tray (flex-1): Player Hand 4-column grid with header 'KARTU TANGAN' and yellow count badge.
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
        'w-full bg-[#F5F0EA] border-t-[3px] border-black pt-2 pb-5 px-2 flex flex-col gap-2 z-20 select-none',
        className
      )}
    >
      {/* Baris Tombol Aksi (TUTUP & MAINKAN) */}
      <div className="flex items-center gap-2 w-full">
        {/* Tombol Kiri: TUTUP (Kartu) */}
        <button
          type="button"
          onClick={handleFoldClick}
          disabled={isFoldDisabled}
          title={foldTitle}
          aria-label={foldButtonLabel}
          className={clsx(
            'flex-1 py-2 px-3 rounded-xl border-2 border-black font-display font-black text-xs uppercase tracking-wider transition-all duration-150',
            'bg-[#FF4343] text-white',
            isFoldDisabled
              ? 'opacity-50 cursor-not-allowed shadow-none'
              : 'neo-box-shadow hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5'
          )}
        >
          {foldButtonLabel}
        </button>

        {/* Tombol Kanan: MAINKAN (Kartu) */}
        <button
          type="button"
          onClick={handlePlayClick}
          disabled={isPlayDisabled}
          title={playTitle}
          aria-label={playButtonLabel}
          className={clsx(
            'flex-1 py-2 px-3 rounded-xl border-2 border-black font-display font-black text-xs uppercase tracking-wider transition-all duration-150',
            'bg-[#00D084] text-black',
            isPlayDisabled
              ? 'opacity-50 cursor-not-allowed shadow-none'
              : 'neo-box-shadow hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5'
          )}
        >
          {playButtonLabel}
        </button>
      </div>

      {/* Area Bawah: Kiri (Folded Tray), Tengah (Separator), Kanan (Hand Grid) */}
      <div className="flex items-stretch gap-2 w-full min-h-[140px]">
        {/* Area Kiri: Kartu Tutup (Tray Folded) */}
        <div
          role="region"
          aria-label="Kotak Kartu Tutup"
          className="w-[110px] shrink-0 bg-black/5 rounded-xl border border-black/20 p-1.5 flex flex-col gap-1.5"
        >
          {/* Header Tray Tutup */}
          <div className="flex items-center justify-between px-0.5">
            <span className="font-display font-black text-[11px] uppercase tracking-wider text-black">
              TUTUP
            </span>
            <span
              title={`Total Poin Penalti Anda: ${currentPenaltyPoints}`}
              className="bg-[#FF4343] text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded leading-none shadow-[1px_1px_0px_#000000]"
            >
              P: {currentPenaltyPoints}
            </span>
          </div>

          {/* Grid 2 Kolom Kartu Tertutup */}
          <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[125px] pr-0.5">
            {foldedCards.length === 0 ? (
              <div className="col-span-2 h-16 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-black/20 text-black/40 text-[10px] font-display font-bold leading-tight px-1">
                <span>0 KARTU</span>
                <span className="text-[9px]">TERTUTUP</span>
              </div>
            ) : (
              foldedCards.map((card, idx) => (
                <PlayingCard
                  key={`folded-${card.suit}-${card.rank}-${idx}`}
                  card={card}
                  variant="folded"
                />
              ))
            )}
          </div>
        </div>

        {/* Garis Separator Hitam Tengah */}
        <div
          className="w-0.5 bg-black/30 shrink-0 self-stretch rounded-full my-0.5"
          aria-hidden="true"
        />

        {/* Area Kanan: Grid 4 Kolom Kartu Tangan */}
        <div
          role="region"
          aria-label="Daftar Kartu Tangan Pemain"
          className="flex-1 min-w-0 bg-black/5 rounded-xl border border-black/20 p-1.5 flex flex-col gap-1.5"
        >
          {/* Header Kartu Tangan */}
          <div className="flex items-center justify-between px-0.5">
            <span className="font-display font-black text-[11px] uppercase tracking-wider text-black">
              KARTU TANGAN
            </span>
            <span className="bg-[#FFE600] text-black border border-black/30 font-mono font-black text-[10px] px-1.5 py-0.5 rounded leading-none shadow-[1px_1px_0px_#000000]">
              {hand.length} KARTU
            </span>
          </div>

          {/* Grid 4 Kolom Kartu Tangan */}
          <div className="grid grid-cols-4 gap-1 overflow-y-auto max-h-[125px] pr-0.5">
            {hand.length === 0 ? (
              <div className="col-span-4 h-16 flex items-center justify-center text-center rounded-lg border border-dashed border-black/20 text-black/40 text-xs font-display font-bold">
                Tangan Kosong
              </div>
            ) : (
              hand.map((card) => {
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
              })
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlayerInteractionDock;

