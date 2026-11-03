import React from 'react';
import clsx from 'clsx';

export interface BrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'mint' | 'emerald' | 'yellow' | 'coral' | 'white' | 'cream';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<BrutalButtonProps['variant']>, string> = {
  mint: 'bg-[#00D084] text-black hover:bg-[#00ba76]',
  emerald: 'bg-[#10B981] text-black hover:bg-[#0ea372]',
  yellow: 'bg-[#FFE600] text-black hover:bg-[#ebd300]',
  coral: 'bg-[#FF4343] text-white hover:bg-[#ea3a3a]',
  white: 'bg-[#FFFFFF] text-black hover:bg-[#f2f2f2]',
  cream: 'bg-[#F5F0EA] text-black hover:bg-[#e7dfd5]',
};

const sizeStyles: Record<NonNullable<BrutalButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000]',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2 border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000]',
  lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5 border-[3px] border-black shadow-[4px_4px_0px_#000000]',
  icon: 'p-2.5 text-base rounded-xl aspect-square items-center justify-center border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000]',
};

/**
 * Tactical Neo-Brutalist Button Component
 * Features tactile physical slapdown compression active states and crisp black border outlines.
 */
export const BrutalButton = React.forwardRef<HTMLButtonElement, BrutalButtonProps>(
  (
    {
      variant = 'yellow',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled = false,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center font-display font-extrabold uppercase tracking-wider select-none transition-all duration-75',
          fullWidth ? 'w-full' : 'w-auto',
          sizeStyles[size],

          // Active tactile press slapdown (only when enabled)
          !disabled && [
            variantStyles[variant],
            'active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#000000]',
          ],

          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-700 shadow-none transform-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700 disabled:shadow-none disabled:transform-none disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-none',

          className
        )}
        {...rest}
      >
        {leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>}
      </button>
    );
  }
);

BrutalButton.displayName = 'BrutalButton';

export default BrutalButton;

