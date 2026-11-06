import React, { useRef } from 'react';
import clsx from 'clsx';
import { Card, Suit } from '../../types/game';
import {
  RANK_LABELS,
  SUIT_SYMBOLS,
  SUIT_COLOR_HEX,
  isKeyCard,
  isAnchorCard,
} from '../../constants/designTokens';

export interface PlayingCardProps {
  card: Card;
  variant?: 'hand' | 'board' | 'folded' | 'score-chip';
  isPlayable?: boolean;
  isSelected?: boolean;
  showKeyIcon?: boolean;
  penaltyBadgeText?: string;
  isKeyPenaltyHighlighted?: boolean;
  disabled?: boolean;
  onSelect?: (card: Card) => void;
  onDoubleTap?: (card: Card) => void;
}

export interface SuitPlaceholderProps {
  suit?: Suit;
  symbol?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Placeholder slot for CentralBoard when anchor card 7 is not yet placed
 * Spec: w-full h-[76px] sm:h-20 rounded-xl border-2 border-white/15 bg-black/20 flex items-center justify-center.
 */
export function SuitPlaceholder({
  suit,
  symbol,
  label,
  className,
  onClick,
}: SuitPlaceholderProps) {
  const displaySymbol = symbol || (suit ? SUIT_SYMBOLS[suit] : '');
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const color = isRed ? '#FF4343' : '#000000';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={clsx(
        'w-full h-[76px] sm:h-20 rounded-xl border-2 border-white/15 bg-black/20 flex items-center justify-center select-none font-display font-black transition-all',
        onClick && 'cursor-pointer hover:border-black/60 hover:bg-white/25 active:scale-95',
        className
      )}
      style={{ color }}
      aria-label={label || (suit ? `Slot ${suit}` : 'Slot kartu kosong')}
    >
      {displaySymbol && (
        <span className="text-xl sm:text-2xl opacity-85 font-bold leading-none">
          {displaySymbol}
        </span>
      )}
    </div>
  );
}

export const PlaceholderSuit = SuitPlaceholder;

/**
 * Tactical PlayingCard component adhering to Neo-Brutalist Stitch Gameplay specs:
 * - Hand: h-8 atau h-9 bg-white rounded-md border-2 border-black flex items-center justify-between px-1.5 select-none cursor-pointer;
 *   warna teks '#000000' untuk ♠/♣ dan '#FF4343' untuk ♥/♦.
 *   Jika selected=true: bg-[#FFE600] border-[2.5px] border-black ring-2 ring-black -translate-y-2 z-20 shadow-[2.5px_2.5px_0px_#000000].
 *   Jika kartu adalah angka 6 atau 8 (isKeyCard), tampilkan indikator ikon kunci kecil '🔑' di sebelah lambang.
 * - Board: w-full h-[76px] sm:h-20 rounded-xl border-[2.5px] border-black p-1.5 sm:p-2 flex flex-col justify-between items-center font-display font-black shadow-[3px_3px_0px_#000000];
 *   khusus angka 7 (Anchor): bg-[#FFE600]; angka lain: bg-white. Menampilkan rank di kiri atas, simbol lambang di tengah, dan rank kecil di kanan bawah (tanpa ikon kunci).
 * - Folded: w-full h-8 rounded-md border-2 border-black flex items-center justify-between px-1.5 select-none font-display font-black text-xs.
 * - Score-chip: compact strip chip for final scoreboard (red for key cards 6/8 + '30 POIN', yellow for Ace, white for others).
 */
export function PlayingCard({
  card,
  variant = 'hand',
  isPlayable = false,
  isSelected = false,
  showKeyIcon,
  penaltyBadgeText,
  isKeyPenaltyHighlighted = false,
  disabled = false,
  onSelect,
  onDoubleTap,
}: PlayingCardProps) {
  const lastTapRef = useRef<number>(0);

  const rankLabel = RANK_LABELS[card.rank] ?? String(card.rank);
  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? '?';
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const textColor = SUIT_COLOR_HEX[card.suit] ?? (isRed ? '#FF4343' : '#000000');
  const isKey = showKeyIcon !== undefined ? showKeyIcon : isKeyCard(card);
  const isAnchor = isAnchorCard(card);

  const handleClick = () => {
    if (disabled) return;
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD_MS = 300;

    if (onDoubleTap && now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS) {
      onDoubleTap(card);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      onSelect?.(card);
    }
  };

  const handleDoubleClick = () => {
    if (disabled) return;
    onDoubleTap?.(card);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(card);
    }
  };

  // Variant 1: Score Chip (Used in Final Scoreboard)
  if (variant === 'score-chip') {
    const isKeyPenalty = isKeyPenaltyHighlighted || isKeyCard(card);
    const isAce = card.rank === 1;

    if (isKeyPenalty) {
      return (
        <div
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect && !disabled ? 0 : undefined}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          title={`Kartu Kunci ${rankLabel}${suitSymbol} (Denda 30 Poin)`}
          className={clsx(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-black font-display font-black text-xs select-none shadow-[1.5px_1.5px_0px_#000000]',
            'bg-[#FF4D4D] text-white',
            disabled && 'opacity-60 cursor-not-allowed',
            (onSelect || onDoubleTap) && !disabled && 'cursor-pointer hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5'
          )}
        >
          <span className="font-black text-xs tracking-tight">{rankLabel}</span>
          <span className="text-sm font-bold leading-none">{suitSymbol}</span>
          <span className="text-[10px] leading-none" title="Kartu Kunci">
            🔑
          </span>
          <span className="ml-1 bg-black text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
            {penaltyBadgeText || '30 POIN'}
          </span>
        </div>
      );
    }

    if (isAce) {
      return (
        <div
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect && !disabled ? 0 : undefined}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          title={`Kartu As ${rankLabel}${suitSymbol}`}
          className={clsx(
            'inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-black font-display font-black text-xs select-none shadow-[1.5px_1.5px_0px_#000000]',
            'bg-[#FFE600] text-black',
            disabled && 'opacity-60 cursor-not-allowed',
            (onSelect || onDoubleTap) && !disabled && 'cursor-pointer hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5'
          )}
        >
          <span className="font-black text-xs tracking-tight">{rankLabel}</span>
          <span className="text-sm font-bold leading-none" style={{ color: textColor }}>
            {suitSymbol}
          </span>
          <span className="ml-1 bg-black text-[#FFE600] text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
            {penaltyBadgeText || 'As'}
          </span>
        </div>
      );
    }

    return (
      <div
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect && !disabled ? 0 : undefined}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        title={`Kartu ${rankLabel}${suitSymbol}`}
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-black font-display font-black text-xs select-none shadow-[1.5px_1.5px_0px_#000000]',
          'bg-white text-black',
          disabled && 'opacity-60 cursor-not-allowed',
          (onSelect || onDoubleTap) && !disabled && 'cursor-pointer hover:bg-slate-50 active:translate-x-0.5 active:translate-y-0.5'
        )}
      >
        <span className="font-black text-xs tracking-tight" style={{ color: textColor }}>
          {rankLabel}
        </span>
        <span className="text-sm font-bold leading-none" style={{ color: textColor }}>
          {suitSymbol}
        </span>
        {penaltyBadgeText && (
          <span className="ml-1 bg-black/10 text-black text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
            {penaltyBadgeText}
          </span>
        )}
      </div>
    );
  }

  // Variant 2: Folded Card (Used in Player Interaction Dock Left Column)
  if (variant === 'folded') {
    const isKeyPenalty = isKeyPenaltyHighlighted || isKeyCard(card);

    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Kartu Tutup ${rankLabel} ${card.suit}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={clsx(
          'w-full h-8 rounded-md border-2 border-black flex items-center justify-between px-1.5 select-none transition-transform duration-150 font-display font-black text-xs',
          isKeyPenalty ? 'bg-[#FF4D4D] text-white' : 'bg-white',
          isSelected && 'ring-2 ring-black -translate-y-1 shadow-[2px_2px_0px_#000000]',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
        )}
        style={{ color: isKeyPenalty ? '#FFFFFF' : textColor }}
      >
        <span className="font-display font-black text-xs leading-none">
          {rankLabel}
        </span>
        <div className="flex items-center gap-1">
          {isKey && (
            <span className="text-[10px] leading-none" title="Kartu Kunci">
              🔑
            </span>
          )}
          <span className="text-sm leading-none font-bold">
            {suitSymbol}
          </span>
          {penaltyBadgeText && (
            <span
              className={clsx(
                'text-[9px] font-mono font-black px-1 py-0.5 rounded leading-none',
                isKeyPenalty ? 'bg-black text-white' : 'bg-black/10 text-black'
              )}
            >
              {penaltyBadgeText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variant 3: Board Card (Used in Central 3-Slot Columns on Felt Table)
  if (variant === 'board') {
    return (
      <div
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect && !disabled ? 0 : undefined}
        aria-label={`Kartu Meja ${rankLabel} ${card.suit}`}
        onClick={onSelect || onDoubleTap ? handleClick : undefined}
        onDoubleClick={onDoubleTap ? handleDoubleClick : undefined}
        onKeyDown={onSelect ? handleKeyDown : undefined}
        className={clsx(
          'w-full h-[76px] sm:h-20 rounded-xl border-[2.5px] border-black p-1.5 sm:p-2 relative flex flex-col justify-between items-center font-display font-black select-none transition-all duration-150 shadow-[3px_3px_0px_#000000]',
          isAnchor ? 'bg-[#FFE600]' : 'bg-white',
          isSelected && '-translate-y-1 shadow-[4px_4px_0px_#000000] ring-2 ring-black',
          (onSelect || onDoubleTap) && !disabled ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        style={{ color: textColor }}
      >
        <span className="self-start text-xs sm:text-sm font-black tracking-tight leading-none">
          {rankLabel}
        </span>
        <span className="text-lg sm:text-xl font-black leading-none my-auto">
          {suitSymbol}
        </span>
        <span className="self-end text-[10px] sm:text-xs font-bold tracking-tight leading-none opacity-65">
          {rankLabel}
        </span>
      </div>
    );
  }

  // Variant 4: Hand Card (Default in Player Hand 4-Column Grid)
  return (
    <button
      type="button"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Kartu Tangan ${rankLabel} ${card.suit}`}
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        'w-full h-8 md:h-9 rounded-md flex items-center justify-between px-1.5 select-none transition-all duration-150 font-display font-black text-xs md:text-sm tracking-tight',
        isSelected
          ? 'bg-[#FFE600] border-[2.5px] border-black ring-2 ring-black -translate-y-2 z-20 shadow-[2.5px_2.5px_0px_#000000]'
          : 'bg-white border-2 border-black',
        isPlayable && !isSelected && 'hover:-translate-y-1 hover:shadow-[2px_2px_0px_#000000]',
        !disabled && 'cursor-pointer active:translate-y-0',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      style={{ color: textColor }}
    >
      <span className="font-display font-black text-xs md:text-sm leading-none">
        {rankLabel}
      </span>
      <div className="flex items-center gap-0.5">
        {isKey && (
          <span
            className="text-[10px] md:text-[11px] leading-none"
            title="Kartu Kunci (Denda 30 Poin jika ditutup)"
            aria-label="Kartu Kunci"
          >
            🔑
          </span>
        )}
        <span className="text-sm md:text-base leading-none font-bold">
          {suitSymbol}
        </span>
      </div>
    </button>
  );
}

export default PlayingCard;
