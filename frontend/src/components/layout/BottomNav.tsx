import React from 'react';
import clsx from 'clsx';
import { Gamepad2, BookOpen } from 'lucide-react';

export interface BottomNavProps {
  activeTab: 'lobby' | 'rules';
  onSelectLobby: () => void;
  onOpenRules: () => void;
  className?: string;
}

/**
 * Neo-Brutalist Bottom Navigation Component
 * Adheres strictly to Google Stitch Screen 0221fbfd1989462bb4e2c90f69a13336:
 * - Fixed bottom with safe-area padding for mobile PWA
 * - Hard-edge black border-t-[2.5px] border-black
 * - Active tab with bold yellow badge (#FFE600), 2px black border, and 2px brutal box-shadow
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectLobby,
  onOpenRules,
  className,
}) => {
  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 w-full z-40 pb-safe bg-[#F5F0EA] border-t-[2.5px] border-black',
        className
      )}
      role="navigation"
      aria-label="Navigasi Bawah Utama"
    >
      <div className="w-full max-w-md mx-auto h-16 px-4 flex items-center justify-around">
        {/* Tab Menu Utama */}
        <button
          type="button"
          onClick={onSelectLobby}
          aria-current={activeTab === 'lobby' ? 'page' : undefined}
          aria-label="Tab Menu Utama"
          className={clsx(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-transform select-none',
            activeTab === 'lobby'
              ? 'px-3 py-1 rounded-lg bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] text-black font-display font-extrabold text-[11px] uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5'
              : 'px-3 py-1 rounded-lg text-black/70 hover:text-black font-display font-bold text-[11px] uppercase tracking-wider transition-colors active:translate-x-0.5 active:translate-y-0.5'
          )}
        >
          <Gamepad2 className="w-5 h-5 mb-0.5 text-current" aria-hidden="true" />
          <span>MENU</span>
        </button>

        {/* Tab Modal Panduan Aturan */}
        <button
          type="button"
          onClick={onOpenRules}
          aria-current={activeTab === 'rules' ? 'page' : undefined}
          aria-label="Tab Panduan Aturan"
          id="tab-nav-aturan"
          className={clsx(
            'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-transform select-none',
            activeTab === 'rules'
              ? 'px-3 py-1 rounded-lg bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000000] text-black font-display font-extrabold text-[11px] uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5'
              : 'px-3 py-1 rounded-lg text-black/70 hover:text-black font-display font-bold text-[11px] uppercase tracking-wider transition-colors active:translate-x-0.5 active:translate-y-0.5'
          )}
        >
          <BookOpen className="w-5 h-5 mb-0.5 text-current" aria-hidden="true" />
          <span>Aturan</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;

