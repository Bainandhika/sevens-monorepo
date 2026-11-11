import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal
 *
 * Tactical Game Settings Modal matching Stitch Screen c671e98ed0c445598c672e438d7144f0:
 * - Neo-brutalist styling with Canary Yellow header and hard-edge drop shadows.
 * - Toggle Switch 1: 'Efek Audio & Suara' bound to audioEnabled / toggleAudio.
 * - Toggle Switch 2: 'Tap 2 Kali Main / Tutup' bound to doubleTapEnabled / toggleDoubleTap.
 * - Tactical Info Box with persistence explanation.
 * - Mint green 'SIMPAN & TUTUP' button.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const audioEnabled = useGameStore((state) => state.audioEnabled);
  const doubleTapEnabled = useGameStore((state) => state.doubleTapEnabled);
  const toggleAudio = useGameStore((state) => state.toggleAudio);
  const toggleDoubleTap = useGameStore((state) => state.toggleDoubleTap);

  // Close on Escape key
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
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-[390px] bg-[#FAF8FF] border-[2.5px] border-black rounded-2xl shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#FFE600] border-b-[2.5px] border-black px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-black"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2
              id="settings-modal-title"
              className="font-display font-black text-lg tracking-tight text-black uppercase"
            >
              PENGATURAN PERMAINAN
            </h2>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengaturan"
            className="w-8 h-8 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-black stroke-[3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex flex-col gap-4">
          {/* Setting Item 1: Audio Switch */}
          <div className="bg-white rounded-xl border-2 border-black p-3.5 shadow-[2.5px_2.5px_0px_#000000] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8FF] border-2 border-black flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-display font-bold text-sm text-black uppercase tracking-tight truncate">
                  Efek Audio & Suara
                </h3>
                <span
                  className={`text-[10px] font-display font-bold uppercase tracking-wider ${
                    audioEnabled ? 'text-[#10B981]' : 'text-neutral-500'
                  }`}
                >
                  {audioEnabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
            </div>

            {/* Switch On/Off */}
            <button
              type="button"
              role="switch"
              aria-checked={audioEnabled}
              aria-label="Toggle Efek Audio & Suara"
              onClick={toggleAudio}
              className={`relative flex-shrink-0 w-[62px] h-[34px] border-[2.5px] border-black rounded-full cursor-pointer transition-colors duration-200 shadow-[2px_2px_0px_#000000] ${
                audioEnabled ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
              }`}
            >
              <span
                className={`absolute top-[2.5px] left-[3px] w-6 h-6 border-2 border-black rounded-full transition-transform duration-200 shadow-[1px_1px_0px_#000000] flex items-center justify-center ${
                  audioEnabled
                    ? 'translate-x-[28px] bg-[#FFE600]'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* Setting Item 2: Double Tap Gesture Switch */}
          <div className="bg-white rounded-xl border-2 border-black p-3.5 shadow-[2.5px_2.5px_0px_#000000] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8FF] border-2 border-black flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-display font-bold text-sm text-black uppercase tracking-tight truncate">
                  Tap 2 Kali Main / Tutup
                </h3>
                <span
                  className={`text-[10px] font-display font-bold uppercase tracking-wider ${
                    doubleTapEnabled ? 'text-[#10B981]' : 'text-neutral-500'
                  }`}
                >
                  {doubleTapEnabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
            </div>

            {/* Switch On/Off */}
            <button
              type="button"
              role="switch"
              aria-checked={doubleTapEnabled}
              aria-label="Toggle Tap 2 Kali Main / Tutup"
              onClick={toggleDoubleTap}
              className={`relative flex-shrink-0 w-[62px] h-[34px] border-[2.5px] border-black rounded-full cursor-pointer transition-colors duration-200 shadow-[2px_2px_0px_#000000] ${
                doubleTapEnabled ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'
              }`}
            >
              <span
                className={`absolute top-[2.5px] left-[3px] w-6 h-6 border-2 border-black rounded-full transition-transform duration-200 shadow-[1px_1px_0px_#000000] flex items-center justify-center ${
                  doubleTapEnabled
                    ? 'translate-x-[28px] bg-[#FFE600]'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* Info Box Tip Taktis */}
          <div className="bg-[#F2F3FF] border-2 border-black rounded-xl p-3 flex items-start gap-2.5">
            <span className="text-base leading-none select-none">💡</span>
            <p className="text-xs text-neutral-700 leading-relaxed text-justify">
              Pengaturan ini disimpan secara lokal di perangkat Anda dan langsung berlaku di meja ronde aktif maupun mode offline.
            </p>
          </div>

          {/* Save / Close Action Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#10B981] hover:bg-[#0ea372] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000] text-black font-display font-black text-sm uppercase py-3.5 px-4 rounded-xl border-[2.5px] border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center gap-2 mt-1 cursor-pointer transition-all select-none"
          >
            <span>SIMPAN & TUTUP</span>
            <svg
              className="w-4 h-4 stroke-[3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

