import React from 'react';
import clsx from 'clsx';
import { BrutalBadge } from './BrutalBadge';

export interface BrutalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  badgeText?: string;
  leftIcon?: React.ReactNode;
  uppercaseAlphanumeric?: boolean;
  flashHighlight?: boolean;
}

/**
 * Tactical Neo-Brutalist Input Field Component
 * Supports nickname restrictions (e.g. max 7 chars), room code uppercase styling (e.g. 6 chars),
 * left icons, badge counters, and flash animation states.
 */
export const BrutalInput = React.forwardRef<HTMLInputElement, BrutalInputProps>(
  (
    {
      label,
      badgeText,
      leftIcon,
      uppercaseAlphanumeric = false,
      flashHighlight = false,
      id,
      className,
      disabled,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || (label ? `brutal-input-${generatedId}` : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (uppercaseAlphanumeric && e.target.value) {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {(label || badgeText) && (
          <div className="flex items-center justify-between px-0.5">
            {label && (
              <label
                htmlFor={inputId}
                className="font-display font-extrabold text-xs uppercase tracking-wider text-black select-none"
              >
                {label}
              </label>
            )}
            {badgeText && (
              <BrutalBadge variant="yellow">
                {badgeText}
              </BrutalBadge>
            )}
          </div>
        )}

        <div className="relative w-full flex items-center">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center justify-center pointer-events-none text-black select-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            onChange={handleChange}
            className={clsx(
              'w-full py-2.5 px-3 rounded-xl bg-[#F5F0EA] border-2 border-black text-black font-display font-bold text-base',
              'focus:outline-none focus:bg-[#ECFDF5] focus:shadow-[3px_3px_0px_#000000] placeholder:text-black/50 transition-all',
              leftIcon && 'pl-10',
              uppercaseAlphanumeric && 'tracking-widest uppercase font-extrabold',
              flashHighlight && 'bg-[#FFF9C4] border-black shadow-[3px_3px_0px_#FFE600]',
              disabled && 'opacity-50 cursor-not-allowed bg-slate-200 shadow-none',
              className
            )}
            {...rest}
          />
        </div>
      </div>
    );
  }
);

BrutalInput.displayName = 'BrutalInput';

export default BrutalInput;

