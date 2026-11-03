import React, { useEffect } from 'react';
import {
  KEY_CARD_PENALTY_POINTS,
  ANCHOR_RANK,
  SUIT_SYMBOLS,
} from '../../constants/designTokens';

export interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * RulesModal
 *
 * Universal 7-an Tactical Game Rules Modal:
 * Shared uniformly across Lobby and Gameplay screens.
 * Clearly articulates the 5 core PRD game mechanics:
 * 1. Buka 7 (Anchor)
 * 2. Urutan Sambungan (Sequential ascending / descending)
 * 3. Wajib Tutup jika Buntu & Aturan Anti-Bohong
 * 4. Denda Flat 30 Poin Kartu Kunci (6 & 8) & Mekanika Status As
 * 5. Penentuan Juara (Poin Penalti Terendah)
 */
export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  // Support Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal Dialog Container */}
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#F5F0EA] border-[3px] border-black rounded-2xl p-4 sm:p-5 shadow-[5px_5px_0px_#000000] flex flex-col gap-3.5 max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-lg shrink-0 shadow-[2px_2px_0px_#000000] select-none">
              📜
            </div>
            <div className="flex flex-col">
              <h2
                id="rules-modal-title"
                className="font-display font-black text-base text-black tracking-wide leading-tight"
              >
                PANDUAN ATURAN 7-AN
              </h2>
              <span className="text-[10px] font-sans font-bold text-black/70 uppercase tracking-wider">
                Taktik Kartu Neo-Brutalis
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="w-8 h-8 rounded-lg bg-white hover:bg-[#FF4343] hover:text-white border-2 border-black flex items-center justify-center font-display font-black text-sm shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all select-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Rules Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 text-xs text-black font-sans">
          {/* Rule 1: Buka Kartu 7 */}
          <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display font-black text-xs text-black">
                <span className="w-5 h-5 rounded-md bg-[#00D084] border border-black flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                BUKA KARTU {ANCHOR_RANK} (PONDASI JALUR)
              </span>
              <span className="text-xs font-mono select-none">
                {SUIT_SYMBOLS.spades} {SUIT_SYMBOLS.hearts} {SUIT_SYMBOLS.clubs} {SUIT_SYMBOLS.diamonds}
              </span>
            </div>
            <p className="text-[11px] text-black/85 leading-snug">
              Hanya kartu berangka <strong>7</strong> yang dapat mengawali jalur tiap suit di atas meja.
              Tanpa kartu 7, kartu lain dari suit tersebut tidak dapat dimainkan.
            </p>
          </div>

          {/* Rule 2: Sambungan Urut */}
          <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display font-black text-xs text-black">
                <span className="w-5 h-5 rounded-md bg-[#FFE600] border border-black flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                SAMBUNGAN BERURUTAN
              </span>
              <span className="text-[10px] bg-black/5 font-mono px-1.5 py-0.5 rounded border border-black/20">
                8-K / 6-A
              </span>
            </div>
            <p className="text-[11px] text-black/85 leading-snug">
              Kartu selanjutnya harus bersambung berurutan langsung dari kartu yang sudah ada di meja pada suit yang sama:
            </p>
            <div className="flex flex-col gap-1 text-[10px] bg-slate-50 p-2 rounded-lg border border-black/10 font-mono">
              <div>🔼 <strong>Naik:</strong> 8 → 9 → 10 → J → Q → K</div>
              <div>🔽 <strong>Turun:</strong> 6 → 5 → 4 → 3 → 2 → As</div>
            </div>
          </div>

          {/* Rule 3: Wajib Tutup jika Buntu & Anti-Bohong */}
          <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display font-black text-xs text-black">
                <span className="w-5 h-5 rounded-md bg-[#FF4343] text-white border border-black flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                WAJIB TUTUP JIKA BUNTU (FOLD)
              </span>
              <span className="text-[9px] bg-[#FF4343] text-white font-black px-1.5 py-0.5 rounded border border-black">
                ANTI-BOHONG
              </span>
            </div>
            <p className="text-[11px] text-black/85 leading-snug">
              Jika tidak ada kartu di tangan yang dapat dimainkan, Anda <strong>wajib menutup 1 kartu</strong>.
            </p>
            <ul className="list-disc pl-4 text-[10px] text-black/80 flex flex-col gap-0.5">
              <li>
                <strong>Aturan Anti-Bohong:</strong> Dilarang menutup kartu jika masih ada kartu di tangan yang sah dimainkan.
              </li>
              <li>
                <strong>Anti-Sabotase:</strong> Kartu 7 dilarang ditutup dalam situasi apa pun.
              </li>
            </ul>
          </div>

          {/* Rule 4: Denda Flat 30 Poin (6 & 8) & Status Kartu As */}
          <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display font-black text-xs text-[#FF4343]">
                <span className="w-5 h-5 rounded-md bg-[#FF4343] text-white border border-black flex items-center justify-center text-[10px] font-black">
                  4
                </span>
                DENDA KARTU KUNCI (6 & 8) & AS
              </span>
              <span className="text-[9px] bg-[#FFE600] font-black px-1.5 py-0.5 rounded border border-black">
                +{KEY_CARD_PENALTY_POINTS} POIN
              </span>
            </div>
            <p className="text-[11px] text-black/85 leading-snug">
              Setiap kartu tertutup menyumbang poin penalti di akhir putaran:
            </p>
            <div className="flex flex-col gap-1 text-[10px] bg-amber-50/70 p-2 rounded-lg border border-black/15">
              <div className="flex items-baseline justify-between">
                <span>🔑 <strong>Kartu Kunci 6 & 8:</strong></span>
                <span className="font-mono font-bold text-[#FF4343]">Flat +{KEY_CARD_PENALTY_POINTS} Poin / kartu</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span>🅰️ <strong>As Rendah (di bawah 2):</strong></span>
                <span className="font-mono font-bold text-black">1 Poin</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span>🅰️ <strong>As Tinggi (di atas K):</strong></span>
                <span className="font-mono font-bold text-[#FF4343]">15 Poin</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span>🅰️ <strong>As Belum Terkunci:</strong></span>
                <span className="font-mono font-bold text-black/60">0 Poin</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-black/10 pt-1">
                <span>🃏 <strong>Kartu Biasa (2–K):</strong></span>
                <span className="font-mono text-black/80">Sesuai nominal (J=11, Q=12, K=13)</span>
              </div>
            </div>
          </div>

          {/* Rule 5: Pemenang Poin Penalti Terendah */}
          <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2px_2px_0px_#000000] flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-display font-black text-xs text-black">
                <span className="w-5 h-5 rounded-md bg-[#00D084] text-black border border-black flex items-center justify-center text-[10px] font-black">
                  5
                </span>
                PEMENANG POIN PENALTI TERENDAH
              </span>
              <span className="text-xs">🏆</span>
            </div>
            <p className="text-[11px] text-black/85 leading-snug">
              Pemenang (Juara 1) adalah pemain dengan <strong>total akumulasi poin penalti terendah</strong>.
              Pemain dengan total poin penalti tertinggi dinyatakan kalah (<strong>Juru Kunci</strong> / Posisi 4).
            </p>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#FFE600] text-black border-2 border-black rounded-xl font-display font-black text-sm uppercase tracking-wider shadow-[3.5px_3.5px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000] hover:bg-[#ebd300] transition-all flex items-center justify-center gap-2 select-none"
          >
            <span>MENGERTI</span>
            <span>👍</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;

