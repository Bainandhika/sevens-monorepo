import React, { useEffect } from 'react';
import { Card } from '../../types/game';
import {
  RANK_LABELS,
  SUIT_SYMBOLS,
  SUIT_NAMES_ID,
  KEY_CARD_PENALTY_POINTS,
} from '../../constants/designTokens';

export interface KeyCardWarningModalProps {
  isOpen: boolean;
  targetCard: Card | null;
  onConfirmFold: (card: Card) => void;
  onCancel: () => void;
}

/**
 * KeyCardWarningModal
 *
 * High-Risk Key Card Warning Modal (6 & 8) adhering to Stitch Dialog Kunci specifications:
 * - Warns player of the guaranteed flat +30 penalty points when folding key card 6 or 8.
 * - Neo-brutalist styling with hard borders, high-contrast badges, and tactile slapdown buttons.
 */
export const KeyCardWarningModal: React.FC<KeyCardWarningModalProps> = ({
  isOpen,
  targetCard,
  onConfirmFold,
  onCancel,
}) => {
  // Handle ESC key press to cancel/dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !targetCard) {
    return null;
  }

  const rankLabel = RANK_LABELS[targetCard.rank];
  const suitSymbol = SUIT_SYMBOLS[targetCard.suit];
  const suitName = SUIT_NAMES_ID[targetCard.suit];
  const isRedSuit = targetCard.suit === 'hearts' || targetCard.suit === 'diamonds';

  const handleConfirm = () => {
    onConfirmFold(targetCard);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="key-warning-title"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      {/* Modal Dialog Container */}
      <div
        className="w-full max-w-xs bg-[#F5F0EA] border-[3px] border-black rounded-2xl p-4 shadow-[5px_5px_0px_#000000] flex flex-col gap-3 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4343] border-2 border-black flex items-center justify-center text-xl shrink-0 shadow-[2px_2px_0px_#000000] select-none">
            ⚠️
          </div>
          <div className="flex flex-col">
            <h2
              id="key-warning-title"
              className="font-display font-black text-base text-black tracking-wide leading-tight"
            >
              PERINGATAN KUNCI!
            </h2>
            <span className="text-[11px] font-display font-extrabold text-[#FF4343] uppercase tracking-wider">
              Tindakan Berisiko Tinggi
            </span>
          </div>
        </div>

        {/* Banner Kuning Target Kartu Tutup */}
        <div className="bg-[#FFE600] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-display font-black text-black uppercase tracking-tight">
              Target Kartu Tutup:
            </span>
            <span className="inline-flex items-center gap-1 bg-[#FF4343] text-white text-[10px] font-display font-black px-2 py-0.5 rounded-md border border-black shadow-[1px_1px_0px_#000000] tracking-wider select-none shrink-0">
              🔑 ANGKA KUNCI
            </span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/70 rounded-lg p-2 border border-black/30">
            {/* Visual Card Chip */}
            <div
              className="w-9 h-11 bg-white border-2 border-black rounded-md flex flex-col items-center justify-center font-display font-black leading-none shadow-[1.5px_1.5px_0px_#000000] shrink-0 select-none"
              style={{ color: isRedSuit ? '#FF4343' : '#000000' }}
            >
              <span className="text-sm font-black">{rankLabel}</span>
              <span className="text-xs leading-none">{suitSymbol}</span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-display font-black text-sm text-black truncate">
                Kunci {rankLabel}{suitSymbol} ({suitName})
              </span>
              <span className="text-[10px] font-sans font-bold text-black/75 leading-tight">
                Kartu gerbang pilar {suitName}
              </span>
            </div>
          </div>
        </div>

        {/* Penjelasan Tegas Denda Flat +30 */}
        <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">💥</span>
            <span className="font-display font-black text-xs text-[#FF4343] tracking-wider uppercase">
              Denda Pasti +{KEY_CARD_PENALTY_POINTS} Poin
            </span>
          </div>
          <p className="text-[11px] font-sans text-black leading-snug font-medium">
            Menutup kartu <strong>6</strong> atau <strong>8</strong> dikenakan denda pasti flat{' '}
            <strong className="text-[#FF4343] font-black underline decoration-2">
              +{KEY_CARD_PENALTY_POINTS} Poin Denda
            </strong>{' '}
            per kartu di akhir permainan.
          </p>
          <p className="text-[10px] font-sans text-black/70 italic leading-tight">
            Pastikan Anda benar-benar buntu sebelum mengorbankan kartu kunci ini!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-2.5 px-3 bg-[#FF4343] text-white border-2 border-black rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-[3.5px_3.5px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all hover:bg-[#ea3a3a] flex items-center justify-center gap-1.5 select-none"
          >
            <span>🛡️</span>
            <span>Tetap Tutup (+{KEY_CARD_PENALTY_POINTS} Poin)</span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-3 bg-white text-black border-2 border-black rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-[3.5px_3.5px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] transition-all hover:bg-[#f2f2f2] flex items-center justify-center gap-1.5 select-none"
          >
            <span>Batal (Pilih Kartu Lain)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyCardWarningModal;

