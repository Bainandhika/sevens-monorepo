import React from 'react';
import clsx from 'clsx';

export interface BrutalBadgeProps {
  variant?: 'yellow' | 'mint' | 'coral' | 'black' | 'white' | 'cream';
  pill?: boolean;
  pulseDotColor?: 'green' | 'yellow' | 'red';
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const variantStyles: Record<NonNullable<BrutalBadgeProps['variant']>, string> = {
  yellow: 'bg-[#FFE600] text-black',
  mint: 'bg-[#00D084] text-black',
  coral: 'bg-[#FF4343] text-white',
  black: 'bg-[#000000] text-white',
  white: 'bg-[#FFFFFF] text-black',
  cream: 'bg-[#F5F0EA] text-black',
};

const pulseDotStyles: Record<NonNullable<BrutalBadgeProps['pulseDotColor']>, { ping: string; core: string }> = {
  green: {
    ping: 'bg-emerald-500',
    core: 'bg-emerald-600',
  },
  yellow: {
    ping: 'bg-amber-400',
    core: 'bg-amber-500',
  },
  red: {
    ping: 'bg-rose-500',
    core: 'bg-rose-600',
  },
};

/**
 * Tactical Neo-Brutalist Status Badge Component
 * Used for room status (HOST, SIAP), bot difficulty (BOT HARD), ace indicators, penalties (Kalah: Nx), and server connectivity.
 */
export const BrutalBadge: React.FC<BrutalBadgeProps> = ({
  variant = 'yellow',
  pill = false,
  pulseDotColor,
  children,
  className,
  title,
}) => {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 border-2 border-black font-display font-black uppercase text-[10px] py-0.5 leading-none select-none tracking-wide shadow-[1px_1px_0px_#000000]',
        pill ? 'rounded-full px-2.5' : 'rounded-md px-2',
        variantStyles[variant],
        className
      )}
    >
      {pulseDotColor && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              pulseDotStyles[pulseDotColor].ping
            )}
          />
          <span
            className={clsx(
              'relative inline-flex rounded-full h-2 w-2 border border-black/40',
              pulseDotStyles[pulseDotColor].core
            )}
          />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};

export default BrutalBadge;

