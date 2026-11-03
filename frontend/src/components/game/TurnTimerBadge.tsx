import React from 'react';
import clsx from 'clsx';

export interface TurnTimerBadgeProps {
  timeLeft: number;
  isActive: boolean;
  className?: string;
}

/**
 * 10s Turn Countdown Badge with Urgency Alert Pulse
 * Spec:
 * - px-1.5 py-0.5 rounded-lg bg-[#FFE600] border-2 border-black text-black font-mono font-black text-xs
 * - When timeLeft <= 4 seconds (and isActive), activates class '.timer-alert' (flashing red #FF4343 with text-white)
 */
export const TurnTimerBadge: React.FC<TurnTimerBadgeProps> = ({
  timeLeft,
  isActive,
  className,
}) => {
  if (!isActive) {
    return null;
  }

  const isUrgent = timeLeft <= 4;
  const displaySeconds = Math.max(0, Math.ceil(timeLeft));

  return (
    <span
      role="timer"
      aria-live={isUrgent ? 'assertive' : 'off'}
      aria-label={`Sisa waktu giliran: ${displaySeconds} detik`}
      className={clsx(
        'inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg border-2 border-black font-mono font-black text-xs select-none shadow-[1px_1px_0px_#000000] transition-colors',
        isUrgent
          ? 'timer-alert bg-[#FF4343] text-white'
          : 'bg-[#FFE600] text-black',
        className
      )}
    >
      {displaySeconds}s
    </span>
  );
};

export default TurnTimerBadge;

