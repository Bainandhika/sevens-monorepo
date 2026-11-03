import React, { useEffect } from 'react';
import clsx from 'clsx';

export interface ColdStartModalProps {
  isOpen: boolean;
  retryCount: number;
  elapsedSeconds: number;
  onCancelAndPlayOffline: () => void;
  onClose: () => void;
}

/**
 * ColdStartModal
 *
 * Render Free Tier Server Wake-Up Modal (PRD F3):
 * - Triggered when a player attempts to create/join an online room while the
 *   backend Render container is in cold hibernation (~20-30s wake-up time).
 * - Segmented black-green loading bar displaying wake-up progress.
 * - Auto-retry status indicator every 3 seconds.
 * - Neo-brutalist tactile styling with solid borders and hard shadows.
 * - Option to abort and jump directly into Offline Single-Player vs AI.
 */
export const ColdStartModal: React.FC<ColdStartModalProps> = ({
  isOpen,
  retryCount,
  elapsedSeconds,
  onCancelAndPlayOffline,
  onClose,
}) => {
  // Support Escape key to dismiss modal
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

  // Segmented progress calculation (10 blocks based on ~20s estimate)
  const TOTAL_SEGMENTS = 10;
  const ESTIMATED_TOTAL_SECONDS = 20;
  const activeSegments = Math.min(
    TOTAL_SEGMENTS,
    Math.max(1, Math.floor((elapsedSeconds / ESTIMATED_TOTAL_SECONDS) * TOTAL_SEGMENTS))
  );

  // Time remaining until the next 3-second retry attempt
  const nextRetryInSeconds = Math.max(1, 3 - (elapsedSeconds % 3));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cold-start-modal-title"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Modal Dialog Container */}
      <div
        className={clsx(
          'w-full max-w-sm bg-[#FAF8FF] border-[3px] border-black rounded-2xl p-5',
          'shadow-[6px_6px_0px_#000000] flex flex-col gap-4 text-center relative select-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button '✕' */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white hover:bg-[#FF4343] hover:text-white border-2 border-black flex items-center justify-center font-display font-black text-sm shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all select-none"
        >
          ✕
        </button>

        {/* Server Wake-Up Icon Graphic */}
        <div className="flex flex-col items-center pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center text-3xl mb-3">
            ⚡
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFE600] border-2 border-black text-[10px] font-display font-black text-black shadow-[1.5px_1.5px_0px_#000000] uppercase tracking-wider mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            RENDER FREE TIER COLD START
          </div>

          {/* Headline Teks Wajib PRD */}
          <h2
            id="cold-start-modal-title"
            className="font-display font-black text-base sm:text-lg text-black leading-snug px-1"
          >
            Sedang menyiapkan server gratisan (~20 detik)...
          </h2>

          <p className="text-xs font-sans font-medium text-black/75 mt-1 leading-relaxed px-2">
            Server backend memasuki mode tidur untuk menghemat sumber daya saat tidak aktif. Harap tunggu selagi container dinyalakan.
          </p>
        </div>

        {/* Segmented Loading Bar (Hitam - Hijau) */}
        <div className="bg-white rounded-xl border-2 border-black p-3 shadow-[2.5px_2.5px_0px_#000000] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-display font-black text-black">
            <span className="flex items-center gap-1">
              <span>PROSES BANGUN</span>
              <span className="text-[#00D084]">●</span>
            </span>
            <span className="font-mono text-black/70">
              {Math.min(100, Math.round((elapsedSeconds / ESTIMATED_TOTAL_SECONDS) * 100))}%
            </span>
          </div>

          {/* 10-Segmented Grid Bar */}
          <div
            className="grid grid-cols-10 gap-1 bg-[#F5F0EA] p-1.5 rounded-lg border-2 border-black"
            role="progressbar"
            aria-valuenow={elapsedSeconds}
            aria-valuemin={0}
            aria-valuemax={ESTIMATED_TOTAL_SECONDS}
          >
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
              const isFilled = idx < activeSegments;
              const isCurrentLeading = idx === activeSegments - 1;

              return (
                <div
                  key={idx}
                  className={clsx(
                    'h-6 rounded-[3px] border-[1.5px] border-black transition-all duration-300',
                    isFilled ? 'bg-[#00D084]' : 'bg-white',
                    isCurrentLeading && 'animate-pulse'
                  )}
                  title={`Segment ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Elapsed & Estimated Time Tracker */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-black/80 px-0.5">
            <span>Berjalan: {elapsedSeconds}s</span>
            <span>Target: ~{ESTIMATED_TOTAL_SECONDS}s</span>
          </div>
        </div>

        {/* Indikator Percobaan Ulang Otomatis Setiap 3 Detik */}
        <div className="bg-[#FAF8FF] rounded-xl border-2 border-black p-3 shadow-[2.5px_2.5px_0px_#000000] flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-[#00D084] animate-ping absolute opacity-75" />
              <span className="w-3 h-3 rounded-full bg-[#00D084] border border-black relative" />
            </div>

            <div className="flex flex-col">
              <span className="font-display font-extrabold text-[11px] text-black uppercase leading-tight">
                Mencoba ulang otomatis setiap 3 detik...
              </span>
              <span className="text-[10px] font-sans font-bold text-black/60 mt-0.5">
                Percobaan #{retryCount} (berikutnya dalam {nextRetryInSeconds}s)
              </span>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-md bg-white border border-black text-[10px] font-mono font-black text-black shrink-0">
            {nextRetryInSeconds}s
          </div>
        </div>

        {/* Primary Action Button: 'Batal / Main Offline Saja' */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onCancelAndPlayOffline}
            className="w-full py-3 px-4 rounded-xl bg-[#FFE600] hover:bg-[#ebd300] border-[2.5px] border-black font-display font-black text-sm text-black uppercase tracking-wider shadow-[3.5px_3.5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 select-none"
          >
            <span className="text-base">🎮</span>
            <span>Batal / Main Offline Saja</span>
          </button>

          {/* Secondary Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-display font-bold text-black/60 hover:text-black py-1 underline underline-offset-2 transition-colors select-none"
          >
            Tetap Tunggu di Lobi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColdStartModal;

