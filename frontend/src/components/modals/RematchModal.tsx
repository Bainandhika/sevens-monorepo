import React, { useEffect } from 'react';
import { Player } from '../../types/game';

export interface RematchModalProps {
  isOpen: boolean;
  countdown: number;
  players: Player[];
  onCompleteCountdown: () => void;
  onCancel: () => void;
}

/**
 * RematchModal
 *
 * 4-Player Rematch Synchronization Modal with 3-Second Countdown Overlay:
 * - Adheres strictly to Stitch #rematch-overlay specification and PRD Bab 6 Layar 4.
 * - Neo-Brutalist container with hard black borders, high-contrast badges, and tactile slapdown shadows.
 * - Dynamic visual box featuring game icons and countdown progression (3 -> 2 -> 1 -> GO!).
 * - Dynamic titles and subtitles guiding players through the rematch sequence:
 *   ('Menyiapkan Meja Baru...' -> 'Menghubungkan Pemain...' -> 'Mengocok Kartu Permainan...' -> 'Memasuki Meja Permainan!').
 * - Segmented progress bar with green/yellow fills and solid right border.
 * - Real-time 4-player readiness indicators with green status pips.
 * - Abort option ('Batalkan & Tetap Di Sini') to cancel rematch and stay on the scoreboard.
 */
export const RematchModal: React.FC<RematchModalProps> = ({
  isOpen,
  countdown,
  players,
  onCompleteCountdown,
  onCancel,
}) => {
  // Support Escape key to cancel / dismiss modal
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

  // Trigger onCompleteCountdown when countdown hits 0 or below
  useEffect(() => {
    if (!isOpen) return;

    if (countdown <= 0) {
      const timer = setTimeout(() => {
        onCompleteCountdown();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown, onCompleteCountdown]);

  if (!isOpen) {
    return null;
  }

  // Derive dynamic visual states and step copy based on countdown value
  const getStepDetails = (count: number) => {
    if (count >= 3) {
      return {
        counterText: '3',
        title: 'Menyiapkan Meja Baru...',
        progressWidth: '25%',
        isGo: false,
        iconEmoji: '🎮',
      };
    }
    if (count === 2) {
      return {
        counterText: '2',
        title: 'Menghubungkan Pemain...',
        progressWidth: '60%',
        isGo: false,
        iconEmoji: '👥',
      };
    }
    if (count === 1) {
      return {
        counterText: '1',
        title: 'Mengocok Kartu Permainan...',
        progressWidth: '90%',
        isGo: false,
        iconEmoji: '🃏',
      };
    }
    return {
      counterText: 'GO!',
      title: 'Memasuki Meja Permainan!',
      progressWidth: '100%',
      isGo: true,
      iconEmoji: '🚀',
    };
  };

  const stepDetails = getStepDetails(countdown);

  // Dynamic contextual subtitle matching Stitch prototype
  const getSubtitle = () => {
    if (countdown >= 3) {
      if (players && players.length >= 2) {
        const p1 = players[0]?.name || 'Pemain 1';
        const p2 = players[1]?.name || 'Pemain 2';
        return `Sinkronisasi kursi dengan ${p1} & ${p2}`;
      }
      return 'Sinkronisasi kursi dengan semua pemain...';
    }
    if (countdown === 2) {
      return 'Semua 4 pemain mengonfirmasi rematch!';
    }
    if (countdown === 1) {
      return 'Menyiapkan Putaran 1';
    }
    return 'Putaran 1 Dimulai... Meja Siap!';
  };

  const subtitle = getSubtitle();

  // Ensure exactly 4 player slots are presented with ready status
  const displayPlayers: Array<{ id: string; name: string }> = Array.from({ length: 4 }).map(
    (_, idx) => {
      if (players && players[idx] && players[idx].name) {
        return {
          id: players[idx].id || `player-${idx}`,
          name: players[idx].name,
        };
      }
      return {
        id: `slot-${idx + 1}`,
        name: `Pemain ${idx + 1}`,
      };
    }
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rematch-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      onClick={onCancel}
    >
      {/* Box Dialog Container */}
      <div
        className="w-full max-w-sm bg-[#FAF8FF] border-[3px] border-black rounded-2xl p-5 shadow-[6px_6px_0px_#000000] flex flex-col items-center text-center gap-4 relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: titik hijau + label 'REMATCH SINKRONISASI' + tombol '✕' */}
        <div className="w-full flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] border border-black" />
            </span>
            <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase text-black">
              REMATCH SINKRONISASI
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Batalkan rematch"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-[#FF4343] hover:text-white border-2 border-black flex items-center justify-center font-display font-black text-xs sm:text-sm shadow-[1.5px_1.5px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer select-none"
          >
            ✕
          </button>
        </div>

        {/* Visual tengah: kotak w-20 h-20 rounded-2xl bg-[#FFE600] border-[2.5px] border-black menampilkan ikon game dan angka hitung mundur (3 -> 2 -> 1 -> GO!) */}
        <div className="w-20 h-20 rounded-2xl bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] flex flex-col items-center justify-center relative overflow-hidden select-none">
          <span className="text-3xl leading-none" role="img" aria-label="Ikon Game">
            {stepDetails.iconEmoji}
          </span>
          <div
            id="rematch-counter"
            className="absolute bottom-1 font-display text-[11px] font-black tracking-widest text-black"
          >
            {stepDetails.counterText}
          </div>
        </div>

        {/* Judul dinamis ('Menyiapkan Meja Baru...' -> 'Menghubungkan Pemain...' -> 'Mengocok Kartu Permainan...') */}
        <div className="flex flex-col gap-1 w-full">
          <h3
            id="rematch-title"
            className="font-display text-base sm:text-lg font-black uppercase text-black leading-tight"
          >
            {stepDetails.title}
          </h3>
          <p className="font-sans text-xs font-semibold text-black/70 leading-snug">
            {subtitle}
          </p>
        </div>

        {/* Progress bar Neo-Brutalist (w-full bg-white h-5 rounded-lg border-2 border-black p-0.5 dengan fill bg-[#10B981] border-r-2 border-black) */}
        <div
          className="w-full bg-white h-5 rounded-lg border-2 border-black p-0.5 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.max(0, 4 - countdown)}
          aria-valuemin={0}
          aria-valuemax={3}
        >
          <div
            id="rematch-progressbar"
            className={`h-full ${
              stepDetails.isGo ? 'bg-[#FFE600]' : 'bg-[#10B981]'
            } border-r-2 border-black transition-all duration-500 ease-out`}
            style={{ width: stepDetails.progressWidth }}
          />
        </div>

        {/* Daftar 4 pemain dengan titik hijau siap */}
        <div className="w-full bg-white rounded-xl border-2 border-black p-2.5 flex items-center justify-around text-[11px] font-display font-bold">
          {displayPlayers.map((player) => (
            <span
              key={player.id}
              className="flex items-center gap-1 text-[#10B981] truncate"
              title={player.name}
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
              <span className="truncate max-w-[65px] text-black font-extrabold">
                {player.name}
              </span>
            </span>
          ))}
        </div>

        {/* Tombol 'Batalkan & Tetap Di Sini' */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-black font-display font-extrabold text-xs uppercase shadow-[2.5px_2.5px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer select-none"
        >
          Batalkan &amp; Tetap Di Sini
        </button>
      </div>
    </div>
  );
};

export default RematchModal;

