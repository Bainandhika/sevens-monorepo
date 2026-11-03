import React, { useEffect } from 'react';
import clsx from 'clsx';

export interface SideDrawerProps {
  isOpen: boolean;
  roomCode: string;
  playerName: string;
  playerInitials: string;
  isOnline: boolean;
  pingMs: number;
  onClose: () => void;
  onOpenRules: () => void;
  onOpenTempScoreboard: () => void;
  onExitToLobby: () => void;
}

/**
 * SideDrawer
 *
 * Tactical Side Navigation Drawer for Gameplay Screen:
 * - Adheres strictly to PRD v1.0 (Bab 6 Layar 3) and Stitch specifications.
 * - ZERO-COIN MVP: Strictly prohibits displaying coin/bet balances.
 * - Neo-brutalist tactile aesthetic with bold borders and hard offset shadows.
 * - Provides quick access to Game Rules, Temporary Scoreboard, and Lobby Exit.
 */
export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  roomCode,
  playerName,
  playerInitials,
  isOnline,
  pingMs,
  onClose,
  onOpenRules,
  onOpenTempScoreboard,
  onExitToLobby,
}) => {
  // Handle ESC key press to close drawer
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

  const initials = playerInitials || (playerName ? playerName.slice(0, 2).toUpperCase() : 'P1');
  const formattedRoomCode = roomCode ? roomCode.toUpperCase() : 'LOKAL';

  const handleOpenRules = () => {
    onClose();
    onOpenRules();
  };

  const handleOpenTempScoreboard = () => {
    onClose();
    onOpenTempScoreboard();
  };

  const handleExitToLobby = () => {
    onClose();
    onExitToLobby();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu Samping Meja Permainan"
      className="fixed inset-0 z-50 flex animate-in fade-in duration-150"
    >
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Drawer Panel (aside w-[300px] max-w-[85%] bg-[#F5F0EA] border-r-[3px] border-black z-50 flex flex-col justify-between) */}
      <aside
        className={clsx(
          'relative w-[300px] max-w-[85%] h-full bg-[#F5F0EA] border-r-[3px] border-black z-50',
          'flex flex-col justify-between shadow-[6px_0px_0px_#000000] overflow-y-auto select-none',
          'animate-in slide-in-from-left duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP SECTION: Header + Profile Card */}
        <div className="flex flex-col">
          {/* Header Bar */}
          <div className="bg-[#FFE600] p-4 border-b-[2.5px] border-black flex flex-col gap-3.5">
            {/* Logo, Title, Room Code, and Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Logo '7' */}
                <div className="w-9 h-9 rounded-xl bg-black text-[#FFE600] border-2 border-black flex items-center justify-center font-display font-black text-xl shadow-[2px_2px_0px_#000000] select-none">
                  7
                </div>

                <div className="flex flex-col">
                  {/* Judul '7-an' */}
                  <h2 className="font-display font-black text-xl text-black tracking-wider leading-none">
                    7-an
                  </h2>
                  {/* Kode 'Meja #XXXXXX' */}
                  <span className="font-mono font-bold text-xs text-black/90 mt-0.5">
                    Meja #{formattedRoomCode}
                  </span>
                </div>
              </div>

              {/* Tombol Tutup '✕' */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup menu"
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#FF4343] hover:text-white border-2 border-black flex items-center justify-center font-display font-black text-sm shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all select-none"
              >
                ✕
              </button>
            </div>

            {/* Kartu Ringkasan Profil Pemain (Tanpa Saldo Koin) */}
            <div className="bg-white rounded-xl border-2 border-black p-2.5 shadow-[2.5px_2.5px_0px_#000000] flex items-center gap-3">
              {/* Avatar Inisial bg-[#00D084] */}
              <div className="w-11 h-11 rounded-xl bg-[#00D084] border-2 border-black flex items-center justify-center font-display font-black text-base text-black shadow-[2px_2px_0px_#000000] shrink-0 select-none">
                {initials}
              </div>

              {/* Player Info & Online/Offline Badge */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-display font-black text-sm text-black truncate leading-tight">
                  {playerName || 'Pemain'}
                </span>

                <div className="mt-1">
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#00D084] border border-black text-[10px] font-display font-black text-black shadow-[1px_1px_0px_#000000] uppercase">
                      <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                      ONLINE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF8FF] border border-black text-[10px] font-display font-black text-black/80 shadow-[1px_1px_0px_#000000] uppercase">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      OFFLINE AI
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Menu Action Buttons */}
          <div className="p-4 flex flex-col gap-3">
            <span className="text-[10px] font-display font-extrabold text-black/60 uppercase tracking-widest px-1">
              Navigasi Meja
            </span>

            {/* Tombol: 'ATURAN RINGKAS' (bg-[#FFE600]) */}
            <button
              type="button"
              onClick={handleOpenRules}
              className="w-full bg-[#FFE600] hover:bg-[#ebd300] text-black border-2 border-black rounded-xl p-3 shadow-[3.5px_3.5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-3 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-black flex items-center justify-center text-base shadow-[1.5px_1.5px_0px_#000000] shrink-0">
                📜
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-black text-xs text-black tracking-wider uppercase">
                  ATURAN RINGKAS
                </span>
                <span className="text-[10px] font-sans font-bold text-black/70">
                  Panduan denda 6 & 8, urutan, & As
                </span>
              </div>
            </button>

            {/* Tombol: 'PAPAN SKOR SEMENTARA' (bg-[#00D084]) */}
            <button
              type="button"
              onClick={handleOpenTempScoreboard}
              className="w-full bg-[#00D084] hover:bg-[#00ba76] text-black border-2 border-black rounded-xl p-3 shadow-[3.5px_3.5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-3 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-black flex items-center justify-center text-base shadow-[1.5px_1.5px_0px_#000000] shrink-0">
                📊
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-black text-xs text-black tracking-wider uppercase">
                  PAPAN SKOR SEMENTARA
                </span>
                <span className="text-[10px] font-sans font-bold text-black/70">
                  Rekor kalah & akumulasi denda
                </span>
              </div>
            </button>

            {/* Tombol: 'KELUAR KE LOBI' (bg-[#FF4343] text-white) */}
            <button
              type="button"
              onClick={handleExitToLobby}
              className="w-full bg-[#FF4343] hover:bg-[#ea3a3a] text-white border-2 border-black rounded-xl p-3 shadow-[3.5px_3.5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-3 text-left group mt-2"
            >
              <div className="w-8 h-8 rounded-lg bg-white text-black border border-black flex items-center justify-center text-base shadow-[1.5px_1.5px_0px_#000000] shrink-0">
                🚪
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-black text-xs text-white tracking-wider uppercase">
                  KELUAR KE LOBI
                </span>
                <span className="text-[10px] font-sans font-bold text-white/80">
                  Tinggalkan meja permainan saat ini
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: Footer Putih */}
        <div className="bg-white p-3 border-t-[2.5px] border-black flex items-center justify-between">
          <span className="font-display font-black text-xs text-black/80 tracking-wider">
            Versi 1.0 MVP
          </span>

          {/* Indikator Latensi 'Ping: XX ms' dengan titik hijau */}
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-black bg-[#F5F0EA] px-2 py-1 rounded-md border border-black shadow-[1px_1px_0px_#000000]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D084] border border-black animate-pulse" />
            <span>Ping: {pingMs} ms</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SideDrawer;

