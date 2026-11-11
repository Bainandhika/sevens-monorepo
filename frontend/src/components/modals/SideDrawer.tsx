import React, { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import { useGameStore } from '../../store/useGameStore';

export interface SideDrawerProps {
  isOpen: boolean;
  roomCode: string;
  playerName: string;
  playerInitials: string;
  isOnline: boolean;
  pingMs: number;
  elapsedSeconds?: number;
  onClose: () => void;
  onOpenRules: () => void;
  onOpenSettings?: () => void;
  onOpenTempScoreboard?: () => void;
  onExitToLobby: () => void;
}

/**
 * SideDrawer
 *
 * Tactical Side Navigation Drawer for Gameplay Screen matching Stitch Screen 66629f4390b5447f954186e461da5763:
 * - Adheres strictly to PRD v1.0 and Stitch specifications.
 * - Neo-brutalist tactile aesthetic with bold borders and hard offset shadows.
 * - Provides quick access to Game Rules, Game Settings, Room ID & Elapsed Match Timer, and Lobby Exit.
 */
export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  roomCode,
  playerName,
  playerInitials,
  isOnline,
  pingMs,
  elapsedSeconds,
  onClose,
  onOpenRules,
  onOpenSettings,
  onExitToLobby,
}) => {
  const setModal = useGameStore((state) => state.setModal);

  // Live match elapsed timer tracking
  const matchStartTimeRef = useRef<number>(Date.now());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

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

  const elapsed = elapsedSeconds ?? Math.max(0, Math.floor((now - matchStartTimeRef.current) / 1000));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleOpenRules = () => {
    onClose();
    onOpenRules();
  };

  const handleOpenSettings = () => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setModal('settings');
    }
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
      className="fixed inset-0 z-50 flex animate-in fade-in duration-150 select-none"
    >
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer Container */}
      <aside
        className={clsx(
          'relative w-[82%] max-w-[340px] h-full bg-[#FAF8FF] border-r-[3px] border-black z-50',
          'flex flex-col justify-between shadow-[6px_0px_0px_#000000] overflow-y-auto select-none',
          'animate-in slide-in-from-left duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP SECTION: Header + Profile Card + Menu Items */}
        <div className="flex flex-col">
          {/* Drawer Header with Yellow Canary Banner */}
          <div className="bg-[#FFE600] p-3.5 border-b-[2.5px] border-black relative">
            {/* Top bar with brand tag & close button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm tracking-tight bg-black text-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000000]">
                  7-an
                </span>
                <span className="font-display font-black text-xs text-black uppercase tracking-wider">
                  MENU
                </span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Menu"
                className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center font-display font-black text-sm shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-transform hover:bg-neutral-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Player Profile Card inside Header */}
            <div className="bg-white rounded-xl border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000] flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-[#00D084] border-2 border-black flex items-center justify-center font-display font-black text-base text-black shrink-0 shadow-[1px_1px_0px_#000000]">
                {initials}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs text-black truncate leading-tight">
                    {playerName || 'Pemain'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-bold">(Anda)</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00D084] border border-black text-[9px] font-display font-black text-black shadow-[1px_1px_0px_#000000] uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                      ONLINE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 border border-black text-[9px] font-display font-black text-black shadow-[1px_1px_0px_#000000] uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      OFFLINE AI
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="p-3 flex flex-col gap-2.5">
            {/* Item 1: Aturan Ringkas */}
            <button
              type="button"
              onClick={handleOpenRules}
              className="w-full text-left bg-white rounded-xl border-2 border-black p-2.5 flex items-center gap-2.5 shadow-[2px_2px_0px_#000000] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000000] text-lg">
                📜
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-display font-bold text-xs text-black group-hover:text-emerald-700 transition-colors uppercase">
                  ATURAN
                </span>
                <span className="text-[10px] font-sans font-bold text-black/70 truncate">
                  Panduan denda 6 & 8, urutan, & As
                </span>
              </div>
              <svg
                className="w-4 h-4 text-black opacity-60 stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Item 2: Pengaturan Permainan */}
            <button
              type="button"
              onClick={handleOpenSettings}
              className="w-full text-left bg-white rounded-xl border-2 border-black p-2.5 flex items-center gap-2.5 shadow-[2px_2px_0px_#000000] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#E2E8F0] border-2 border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#000000] text-lg">
                ⚙️
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-display font-bold text-xs text-black group-hover:text-emerald-700 transition-colors uppercase">
                  PENGATURAN
                </span>
                <span className="text-[10px] font-sans font-bold text-black/70 truncate">
                  Efek audio & preferensi kontrol tap
                </span>
              </div>
              <svg
                className="w-4 h-4 text-black opacity-60 stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Room & Match Metadata Info Card */}
            <div className="bg-[#EDEBE6] rounded-xl border-2 border-black p-2.5 flex flex-col gap-1.5 shadow-[2px_2px_0px_#000000] mt-1">
              <div className="flex items-center justify-between text-[11px] font-display">
                <span className="font-bold text-neutral-600 uppercase tracking-wider">
                  KODE RUANG
                </span>
                <span className="font-black bg-[#FFE600] px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000000]">
                  #{formattedRoomCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-display pt-1 border-t border-black/20">
                <span className="font-bold text-neutral-600 uppercase tracking-wider">
                  WAKTU BERJALAN
                </span>
                <span className="font-bold font-mono text-black bg-white px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000000]">
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Exit Button */}
            <button
              type="button"
              onClick={handleExitToLobby}
              className="w-full py-2.5 px-3 bg-[#FF4343] hover:bg-[#ea3a3a] rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-2 text-white font-display font-black text-xs uppercase tracking-wider hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer mt-1 select-none"
              id="btn-exit-game"
            >
              <svg
                className="w-4 h-4 text-white stroke-[2.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>KELUAR DARI PERMAINAN</span>
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
