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
 * Shared uniformly across Lobby, Waiting Room, and Gameplay screens.
 * Clearly articulates the core PRD game mechanics matching Stitch Screen c9368a7ad8f846b28491d6128e42cd73:
 * 1. Alur Dasar & Pembuka (Buka 7)
 * 2. Kartu Valid & Anti-Bohong
 * 3. State Machine Kartu As (Locked None / Low / High)
 * 4. Denda Flat 30 Poin Kartu Kunci (6 & 8)
 * 5. Penentuan Juara (Poin Penalti Terendah)
 * 6. Status Rekor RT & RW (Eksklusif 1 Pemegang)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal Dialog Container */}
      <div
        className="w-full max-w-md max-h-[88vh] bg-[#FAF8FF] border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_#000000] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#FFE600] border-b-2 border-black px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-lg select-none">📜</span>
            <h2
              id="rules-modal-title"
              className="font-display font-black text-base text-black tracking-wide uppercase"
            >
              ATURAN BERMAIN 7-AN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Aturan"
            className="w-8 h-8 bg-white hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#000000] cursor-pointer transition font-mono font-black text-sm text-black select-none"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Rules Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
          {/* Section 1: Alur Dasar & Pembuka */}
          <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#10b981] text-black font-display font-black text-[11px] flex items-center justify-center border border-black">
                  1
                </span>
                <h3 className="font-display font-black text-xs text-black uppercase tracking-wide">
                  ALUR DASAR & PEMBUKA
                </h3>
              </div>
              <span className="text-xs font-mono select-none">
                {SUIT_SYMBOLS.spades} {SUIT_SYMBOLS.hearts} {SUIT_SYMBOLS.clubs} {SUIT_SYMBOLS.diamonds}
              </span>
            </div>
            <ul className="space-y-1 pl-2 text-neutral-800 font-medium leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">•</span>
                <span>
                  <strong>52 Kartu Standar</strong> tanpa Joker dibagi rata kepada 4 pemain (masing-masing 13 kartu).
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">•</span>
                <span>
                  Salah satu kartu <strong>{ANCHOR_RANK} (♠/♥/♣/♦)</strong> turun otomatis sebagai jangkar pembuka di tengah meja.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">•</span>
                <span>Giliran berjalan searah jarum jam secara taktis bergantian.</span>
              </li>
            </ul>
          </div>

          {/* Section 2: Kartu Valid & Anti-Bohong */}
          <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#10b981] text-black font-display font-black text-[11px] flex items-center justify-center border border-black">
                  2
                </span>
                <h3 className="font-display font-black text-xs text-black uppercase tracking-wide">
                  KARTU VALID & ANTI-BOHONG
                </h3>
              </div>
              <span className="text-[9px] bg-[#FF4343] text-white font-display font-black px-1.5 py-0.5 rounded border border-black">
                ANTI-BOHONG
              </span>
            </div>
            <ul className="space-y-1 pl-2 text-neutral-800 font-medium leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">•</span>
                <span>
                  Kartu valid adalah yang <strong>melanjutkan urutan (+1 atau -1)</strong> pada lambang yang sudah ada di meja, atau membuka lambang baru dengan <strong>kartu 7 lainnya</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">•</span>
                <span>
                  <strong className="text-[#FF4343] font-bold">Anti-Bohong Taktis:</strong> Jika ada kartu valid di tangan, tombol TUTUP terkunci! Pemain WAJIB menurunkan kartu ke meja.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">•</span>
                <span>
                  <strong>Kartu 7 haram ditutup</strong> dalam kondisi apa pun.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3: State Machine Kartu As */}
          <div className="bg-[#F2F3FF] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FFE600] text-black font-display font-black text-[11px] flex items-center justify-center border border-black">
                  3
                </span>
                <h3 className="font-display font-black text-xs text-black uppercase tracking-wide">
                  STATE MACHINE KARTU AS
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#FF7B6B]/30 border border-black text-[10px] font-display font-black uppercase rounded">
                PENTING
              </span>
            </div>
            <div className="space-y-1.5 text-neutral-800 font-medium leading-relaxed pl-1">
              <div className="bg-white border border-black rounded-lg p-2">
                <p className="font-bold text-black font-display">Status Awal: Belum Terbuka (0 Poin)</p>
                <p className="text-[11px] text-neutral-600">
                  Jika sampai akhir ronde tak ada As yang turun di meja, semua As tertutup tetap bernilai <strong>0 Poin</strong>.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-emerald-50 border border-black rounded-lg p-1.5">
                  <p className="font-black text-black font-display">AS RENDAH (LOW)</p>
                  <p className="text-neutral-700">
                    Turun di bawah 2. Nilai As terkunci = <span className="font-black text-black">1 Poin</span>. Dilarang pasang di atas King!
                  </p>
                </div>
                <div className="bg-amber-50 border border-black rounded-lg p-1.5">
                  <p className="font-black text-black font-display">AS TINGGI (HIGH)</p>
                  <p className="text-neutral-700">
                    Turun di atas King. Nilai As terkunci = <span className="font-black text-black">15 Poin</span>. Dilarang pasang di bawah 2!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Denda Kartu Kunci (6 & 8) */}
          <div className="bg-red-50 border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FF4343] text-white font-display font-black text-[11px] flex items-center justify-center border border-black">
                  4
                </span>
                <h3 className="font-display font-black text-xs text-[#be091d] uppercase tracking-wide">
                  DENDA KARTU KUNCI (6 & 8)
                </h3>
              </div>
              <span className="text-[9px] bg-[#FFE600] font-display font-black px-1.5 py-0.5 rounded border border-black">
                +{KEY_CARD_PENALTY_POINTS} POIN
              </span>
            </div>
            <p className="pl-2 text-neutral-800 font-medium leading-relaxed">
              Kartu 6 dan 8 adalah <em>kartu kunci</em> pengunci laju lawan. Jika kartu 6 atau 8 tertutup / gagal turun hingga ronde usai, pemilik dikenakan denda{' '}
              <strong className="text-[#be091d] font-black underline decoration-2">
                FLAT {KEY_CARD_PENALTY_POINTS} POIN
              </strong>{' '}
              per kartu!
            </p>
          </div>

          {/* Section 5: Penentuan Juara (Penalti Terendah) */}
          <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-[#10b981] text-black font-display font-black text-[11px] flex items-center justify-center border border-black">
                5
              </span>
              <h3 className="font-display font-black text-xs text-black uppercase tracking-wide">
                PENENTUAN JUARA (PENALTI TERENDAH)
              </h3>
            </div>
            <ul className="space-y-1 pl-2 text-neutral-800 font-medium leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">👑</span>
                <span>
                  <strong>Juara 1 (Pemenang):</strong> Pemain dengan total poin penalti kartu tertutup <em>TERENDAH</em>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">☠️</span>
                <span>
                  <strong>Juru Kunci (Posisi 4):</strong> Pemain dengan poin penalti <em>TERTINGGI</em> (mendapat Kalah +1).
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-black font-bold">📊</span>
                <span>
                  Nilai penalti: 2–10 (sesuai nominal), J=11, Q=12, K=13. As: 0, 1, atau 15 poin. Kartu 6/8 tertutup: Flat {KEY_CARD_PENALTY_POINTS} poin.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 6: Rekor Komunitas RT & RW */}
          <div className="bg-[#FAF8FF] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000000] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#FFE600] text-black font-display font-black text-[11px] flex items-center justify-center border border-black">
                  6
                </span>
                <h3 className="font-display font-black text-xs text-black uppercase tracking-wide">
                  STATUS REKOR RT & RW
                </h3>
              </div>
              <span className="text-[9px] bg-[#8B0000] text-white font-display font-black px-1.5 py-0.5 rounded border border-black uppercase tracking-wider">
                Eksklusif Meja
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
              <div className="bg-[#FF5A5F] text-white border-2 border-black rounded-lg p-2 text-center shadow-[1.5px_1.5px_0px_#000000]">
                <p className="font-black font-display text-xs uppercase tracking-wide">
                  STATUS RT
                </p>
                <p className="text-[10px] text-white/95 mt-0.5 leading-snug">
                  Kalah <strong>3x berturut-turut</strong> di room yang sama
                </p>
              </div>
              <div className="bg-[#8B0000] text-[#FFE600] border-2 border-black rounded-lg p-2 text-center shadow-[1.5px_1.5px_0px_#000000]">
                <p className="font-black font-display text-xs uppercase tracking-wide">
                  STATUS RW
                </p>
                <p className="text-[10px] text-yellow-100 mt-0.5 leading-snug">
                  Kalah <strong>6x berturut-turut</strong> di room yang sama
                </p>
              </div>
            </div>
            <p className="text-[10px] text-neutral-600 leading-tight pt-0.5">
              * <strong>Eksklusivitas Tunggal:</strong> Maksimal 1 pemegang gelar di room. Ketika ada pemain lain yang mencapai 3x kalah beruntun, gelar pemegang lama langsung dicabut dan di-reset. Finis peringkat 1–3 mereset rekor kalah beruntun ke 0.
            </p>
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="bg-white border-t-2 border-black p-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#00D084] hover:bg-[#00c57c] active:translate-x-0.5 active:translate-y-0.5 text-black font-display font-black text-sm uppercase rounded-xl border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-2 transition select-none cursor-pointer"
          >
            <span>SAYA MENGERTI / TUTUP</span>
            <svg
              className="w-4 h-4 text-black stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
