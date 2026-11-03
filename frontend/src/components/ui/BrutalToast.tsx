import React from 'react';
import clsx from 'clsx';

export interface BrutalToastProps {
  visible: boolean;
  icon?: string | React.ReactNode;
  message: string;
  position?: 'top' | 'bottom';
  variant?: 'yellow' | 'mint' | 'coral';
  className?: string;
}

const variantStyles: Record<NonNullable<BrutalToastProps['variant']>, string> = {
  yellow: 'bg-[#FFE600] text-black',
  mint: 'bg-[#00D084] text-black',
  coral: 'bg-[#FF4343] text-white',
};

/**
 * Tactical Neo-Brutalist Floating Toast Notification Component
 * Used for instant floating feedback: card actions, copied room codes, bot lockouts, and error alerts.
 */
export const BrutalToast: React.FC<BrutalToastProps> = ({
  visible,
  icon,
  message,
  position = 'top',
  variant = 'yellow',
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        // Base neo-brutalist toast styling
        'fixed left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-lg border-2 border-black shadow-[3.5px_3.5px_0px_#000000] text-xs font-display font-black uppercase flex items-center gap-2 transition-all duration-200 pointer-events-none select-none max-w-[90vw] whitespace-nowrap overflow-hidden text-ellipsis',
        
        // Placement
        position === 'top' ? 'top-16' : 'bottom-6',

        // Color Variant
        variantStyles[variant],

        // Smooth entry & exit transition
        visible
          ? 'opacity-100 scale-100 translate-y-0'
          : position === 'top'
          ? 'opacity-0 scale-95 -translate-y-3'
          : 'opacity-0 scale-95 translate-y-3',

        className
      )}
    >
      {icon && (
        <span className="inline-flex shrink-0 items-center justify-center text-sm leading-none">
          {icon}
        </span>
      )}
      <span className="truncate">{message}</span>
    </div>
  );
};

export default BrutalToast;

