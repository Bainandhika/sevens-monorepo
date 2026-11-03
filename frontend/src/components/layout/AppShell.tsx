import React from 'react';
import clsx from 'clsx';

export interface AppShellProps {
  variant?: 'cream' | 'felt' | 'surface';
  children: React.ReactNode;
  className?: string;
}

/**
 * Tactical felt green radial gradient for Gameplay mode (Meja Permainan Taktis)
 * Derived from DESIGN.md and Stitch Table specifications.
 */
const FELT_BACKGROUND_GRADIENT =
  'radial-gradient(circle at 50% 45%, rgb(8, 115, 70) 0%, rgb(5, 90, 54) 60%, rgb(3, 59, 35) 100%)';

/**
 * Mobile-First Neo-Brutalist AppShell Layout Wrapper
 * Locks viewport proportions on mobile while keeping a clean centered container on desktop viewports.
 */
export const AppShell: React.FC<AppShellProps> = ({
  variant = 'cream',
  children,
  className,
}) => {
  const isFelt = variant === 'felt';

  return (
    <div
      className={clsx(
        'min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden',
        variant === 'cream' && 'bg-[#F5F0EA]',
        variant === 'surface' && 'bg-[#FAF8FF]',
        className
      )}
      style={isFelt ? { background: FELT_BACKGROUND_GRADIENT } : undefined}
      data-variant={variant}
    >
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 relative min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default AppShell;

