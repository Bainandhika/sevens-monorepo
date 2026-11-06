import React from 'react';
import clsx from 'clsx';
import { BoardState, Card, Rank, Suit } from '../../types/game';
import { PlayingCard, SuitPlaceholder } from './PlayingCard';
import {
  RANK_LABELS,
  SUIT_NAMES_ID,
  SUIT_SYMBOLS,
} from '../../constants/designTokens';

export interface CentralBoardProps {
  board: BoardState;
  selectedCard: Card | null;
  isMyTurn: boolean;
  onPlaySelectedCard?: (card: Card) => void;
  className?: string;
}

/**
 * Standard 4-Column Suit Lane Order for 7-an Tactical:
 * ♠ Sekop, ♥ Hati, ♣ Keriting, ♦ Wajik
 */
export const SUIT_COLUMNS: readonly Suit[] = [
  'spades',
  'hearts',
  'clubs',
  'diamonds',
] as const;

/**
 * Central 4-Column Representative Board Component
 *
 * Spec (PRD Bab 6 Layar 3 & Stitch Gameplay):
 * - Terdiri dari 4 kolom vertikal representatif (♠ Sekop, ♥ Hati, ♣ Keriting, ♦ Wajik).
 * - Setiap kolom menampilkan maksimal 3 kartu vertikal (masing-masing h-[76px] sm:h-20):
 *   (1) Slot Atas: jika maxPlayed > 7, tampilkan PlayingCard(variant='board', rank=maxPlayed);
 *       jika belum ada kartu di atas 7, tampilkan div h-[76px] sm:h-20 opacity-0 pointer-events-none
 *       (atau slot dashed jika pemain sedang memilih kartu valid maxPlayed+1).
 *   (2) Slot Tengah (Jangkar 7): jika hasSeven=true, tampilkan PlayingCard(variant='board', rank=7)
 *       dengan background '#FFE600' border-[2.5px] border-black;
 *       jika hasSeven=false, tampilkan placeholder slot semi-transparan dengan ikon lambang (♠/♥/♣/♦).
 *   (3) Slot Bawah: jika minPlayed < 7, tampilkan PlayingCard(variant='board', rank=minPlayed);
 *       jika belum ada kartu di bawah 7, tampilkan div h-[76px] sm:h-20 opacity-0.
 *
 * Desain proporsional persegi-potret kompak agar pas di satu layar ponsel tanpa scrolling.
 */
export const CentralBoard: React.FC<CentralBoardProps> = ({
  board,
  selectedCard,
  isMyTurn,
  onPlaySelectedCard,
  className,
}) => {
  const suitsState = board?.suits ?? ({} as Partial<Record<Suit, any>>);

  return (
    <div
      role="region"
      aria-label="Papan Meja Permainan"
      className={clsx(
        'grid grid-cols-4 gap-2 sm:gap-2.5 px-1 items-center w-full max-w-[360px] sm:max-w-md mx-auto my-auto select-none',
        className
      )}
    >
      {SUIT_COLUMNS.map((suit) => {
        const suitState = suitsState[suit] ?? {
          minPlayed: 7,
          maxPlayed: 7,
          hasSeven: false,
          hasAce: false,
        };

        const { minPlayed, maxPlayed, hasSeven } = suitState;

        // Validasi apakah kartu yang sedang dipilih pemain cocok disambung ke slot atas (maxPlayed + 1)
        const canPlayAbove = Boolean(
          isMyTurn &&
            selectedCard &&
            selectedCard.suit === suit &&
            hasSeven &&
            selectedCard.rank === maxPlayed + 1 &&
            maxPlayed < 13
        );

        // Validasi apakah kartu 7 lambang ini sedang dipilih dan siap diturunkan ke slot tengah
        const canPlaySeven = Boolean(
          isMyTurn &&
            selectedCard &&
            selectedCard.suit === suit &&
            selectedCard.rank === 7 &&
            !hasSeven
        );

        // Validasi apakah kartu yang sedang dipilih pemain cocok disambung ke slot bawah (minPlayed - 1)
        const canPlayBelow = Boolean(
          isMyTurn &&
            selectedCard &&
            selectedCard.suit === suit &&
            hasSeven &&
            selectedCard.rank === minPlayed - 1 &&
            minPlayed > 1
        );

        return (
          <div
            key={suit}
            data-testid={`board-column-${suit}`}
            aria-label={`Kolom ${SUIT_NAMES_ID[suit]}`}
            className="flex flex-col gap-2 w-full items-center"
          >
            {/* =========================================================================
             * (1) Slot Atas: Ujung Tertinggi (maxPlayed > 7)
             * ========================================================================= */}
            {hasSeven && maxPlayed > 7 ? (
              <div
                className={clsx(
                  'w-full h-[76px] sm:h-20 relative rounded-xl transition-all',
                  canPlayAbove &&
                    'ring-2 ring-[#00D084] shadow-[0_0_8px_rgba(0,208,132,0.6)] cursor-pointer'
                )}
                title={
                  canPlayAbove && selectedCard
                    ? `Klik untuk memainkan ${RANK_LABELS[selectedCard.rank]}${SUIT_SYMBOLS[suit]}`
                    : undefined
                }
              >
                <PlayingCard
                  card={{ suit, rank: maxPlayed as Rank }}
                  variant="board"
                  onSelect={
                    canPlayAbove && selectedCard && onPlaySelectedCard
                      ? () => onPlaySelectedCard(selectedCard)
                      : undefined
                  }
                />
              </div>
            ) : canPlayAbove && selectedCard ? (
              <button
                type="button"
                role="button"
                data-testid={`slot-dashed-above-${suit}`}
                aria-label={`Mainkan ${RANK_LABELS[selectedCard.rank]} ${SUIT_NAMES_ID[suit]}`}
                title={`Mainkan ${RANK_LABELS[selectedCard.rank]}${SUIT_SYMBOLS[suit]} ke Meja`}
                onClick={() => onPlaySelectedCard?.(selectedCard)}
                className={clsx(
                  'w-full h-[76px] sm:h-20 rounded-xl border-2 border-dashed border-[#00D084] bg-[#00D084]/20',
                  'flex flex-col items-center justify-center gap-0.5 cursor-pointer animate-pulse select-none font-display font-black',
                  'hover:bg-[#00D084]/35 active:scale-95 transition-all text-black shadow-[2px_2px_0px_#000000]'
                )}
              >
                <span className="text-sm sm:text-base font-black text-emerald-950 leading-none">
                  {RANK_LABELS[selectedCard.rank]}
                </span>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-tight leading-none">
                  +{SUIT_SYMBOLS[suit]}
                </span>
              </button>
            ) : (
              <div
                className="w-full h-[76px] sm:h-20 opacity-0 pointer-events-none select-none"
                aria-hidden="true"
              />
            )}

            {/* =========================================================================
             * (2) Slot Tengah: Jangkar 7 (Anchor Card 7)
             * ========================================================================= */}
            {hasSeven ? (
              <div className="w-full h-[76px] sm:h-20">
                <PlayingCard
                  card={{ suit, rank: 7 as Rank }}
                  variant="board"
                />
              </div>
            ) : (
              <div className="w-full h-[76px] sm:h-20">
                <SuitPlaceholder
                  suit={suit}
                  className={clsx(
                    canPlaySeven &&
                      'border-2 border-dashed border-[#00D084] bg-[#00D084]/25 ring-2 ring-[#00D084] animate-pulse cursor-pointer hover:bg-[#00D084]/35'
                  )}
                  onClick={
                    canPlaySeven && selectedCard && onPlaySelectedCard
                      ? () => onPlaySelectedCard(selectedCard)
                      : undefined
                  }
                  label={
                    canPlaySeven && selectedCard
                      ? `Mainkan 7 ${SUIT_NAMES_ID[suit]}`
                      : undefined
                  }
                />
              </div>
            )}

            {/* =========================================================================
             * (3) Slot Bawah: Ujung Terendah (minPlayed < 7)
             * ========================================================================= */}
            {hasSeven && minPlayed < 7 ? (
              <div
                className={clsx(
                  'w-full h-[76px] sm:h-20 relative rounded-xl transition-all',
                  canPlayBelow &&
                    'ring-2 ring-[#00D084] shadow-[0_0_8px_rgba(0,208,132,0.6)] cursor-pointer'
                )}
                title={
                  canPlayBelow && selectedCard
                    ? `Klik untuk memainkan ${RANK_LABELS[selectedCard.rank]}${SUIT_SYMBOLS[suit]}`
                    : undefined
                }
              >
                <PlayingCard
                  card={{ suit, rank: minPlayed as Rank }}
                  variant="board"
                  onSelect={
                    canPlayBelow && selectedCard && onPlaySelectedCard
                      ? () => onPlaySelectedCard(selectedCard)
                      : undefined
                  }
                />
              </div>
            ) : canPlayBelow && selectedCard ? (
              <button
                type="button"
                role="button"
                data-testid={`slot-dashed-below-${suit}`}
                aria-label={`Mainkan ${RANK_LABELS[selectedCard.rank]} ${SUIT_NAMES_ID[suit]}`}
                title={`Mainkan ${RANK_LABELS[selectedCard.rank]}${SUIT_SYMBOLS[suit]} ke Meja`}
                onClick={() => onPlaySelectedCard?.(selectedCard)}
                className={clsx(
                  'w-full h-[76px] sm:h-20 rounded-xl border-2 border-dashed border-[#00D084] bg-[#00D084]/20',
                  'flex flex-col items-center justify-center gap-0.5 cursor-pointer animate-pulse select-none font-display font-black',
                  'hover:bg-[#00D084]/35 active:scale-95 transition-all text-black shadow-[2px_2px_0px_#000000]'
                )}
              >
                <span className="text-sm sm:text-base font-black text-emerald-950 leading-none">
                  {RANK_LABELS[selectedCard.rank]}
                </span>
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-tight leading-none">
                  -{SUIT_SYMBOLS[suit]}
                </span>
              </button>
            ) : (
              <div
                className="w-full h-[76px] sm:h-20 opacity-0 pointer-events-none select-none"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CentralBoard;

