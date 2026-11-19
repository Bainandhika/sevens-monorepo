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
 * Adheres strictly to Google Stitch lobi_utama_7_an_tactical (code.html):
 * - Fixed bottom max-w-md shell with safe-area padding for mobile PWA
 * - Cream surface (#F6F3EB) and solid border-t-[2.5px] border-black
 * - Active tab icon sits inside a #FFE600 rounded-xl pill with 2px black border and 2px brutal shadow,
 *   with uppercase Space Grotesk label cleanly underneath.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectLobby,
  onOpenRules,
  className,
}) => {
  const isLobbyActive = activeTab === 'lobby';
  const isRulesActive = activeTab === 'rules';

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 pb-safe bg-[#F6F3EB] border-t-[2.5px] border-black',
        className
      )}
      role="navigation"
      aria-label="Navigasi Bawah Utama"
      data-purpose="bottom-nav"
    >
      <div className="h-16 px-6 flex items-center justify-around">
        {/* Tab Menu Utama */}
        <button
          type="button"
          onClick={onSelectLobby}
          aria-current={isLobbyActive ? 'page' : undefined}
          aria-label="Halaman Menu"
          className={clsx(
            'flex flex-col items-center justify-center group cursor-pointer focus:outline-none select-none min-w-[56px] min-h-[44px] active:translate-x-0 active:translate-y-0 active:shadow-none transition',
            !isLobbyActive && 'opacity-70 hover:opacity-100'
          )}
        >
          <div
            className={clsx(
              'w-12 h-9 flex items-center justify-center mb-1 group-active:scale-95 transition',
              isLobbyActive &&
                'bg-[#FFE600] border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000]'
            )}
          >
            <Gamepad2
              className={clsx('text-black', isLobbyActive ? 'w-5 h-5' : 'w-6 h-6')}
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <span
            className={clsx(
              'font-display text-[11px] uppercase tracking-wider leading-none',
              isLobbyActive ? 'font-black text-black' : 'font-extrabold text-neutral-700'
            )}
          >
            MENU
          </span>
        </button>

        {/* Tab Modal Panduan Aturan */}
        <button
          type="button"
          onClick={onOpenRules}
          aria-current={isRulesActive ? 'page' : undefined}
          aria-label="Aturan Permainan"
          id="tab-nav-aturan"
          className={clsx(
            'flex flex-col items-center justify-center group cursor-pointer focus:outline-none select-none min-w-[56px] min-h-[44px] active:translate-x-0 active:translate-y-0 active:shadow-none transition',
            !isRulesActive && 'opacity-70 hover:opacity-100'
          )}
        >
          <div
            className={clsx(
              'w-12 h-9 flex items-center justify-center mb-1 group-active:scale-95 transition',
              isRulesActive &&
                'bg-[#FFE600] border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000]'
            )}
          >
            <BookOpen
              className={clsx('text-black', isRulesActive ? 'w-5 h-5' : 'w-6 h-6')}
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <span
            className={clsx(
              'font-display text-[11px] uppercase tracking-wider leading-none',
              isRulesActive ? 'font-black text-black' : 'font-extrabold text-neutral-700'
            )}
          >
            ATURAN
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;

