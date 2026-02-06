import type { FC, MouseEvent } from 'react';
import { theme, cn } from '../../design/theme';

export interface ToggleProps {
  /** Current checked state of the toggle */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Optional label text */
  label?: string;
  /** Optional description text */
  description?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4'
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5'
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7'
  }
} as const;

/**
 * Toggle component - A switch control for binary states
 * Fully type-safe with theme integration
 */
export const Toggle: FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  size = 'md'
}) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-start', className)}>
      <div className="flex items-center h-5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label || 'Toggle switch'}
          disabled={disabled}
          className={cn(
            'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            theme.animation.transition,
            theme.focus.ring,
            sizes.track,
            checked ? theme.components.toggle.track.on : theme.components.toggle.track.off,
            disabled && theme.utils.disabled
          )}
          onClick={handleClick}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block transform rounded-full bg-white dark:bg-stone-200 shadow ring-0',
              theme.animation.transition,
              sizes.thumb,
              checked ? sizes.translate : 'translate-x-0'
            )}
          />
        </button>
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label className={cn('font-medium', theme.text.label)}>
              {label}
            </label>
          )}
          {description && (
            <p className={theme.text.tertiary}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;