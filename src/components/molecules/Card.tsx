import type { ReactNode, HTMLAttributes } from 'react';
import { memo, createElement, isValidElement, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { theme, cn } from '../../design/theme';

// Define variants outside component to prevent re-creation on every render
const CARD_VARIANTS = {
  default: theme.components.card.default,
  subtle: theme.components.card.subtle,
  bordered: cn(theme.bg.primary, 'border-2', theme.border.default)
} as const;

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The main content to be displayed within the card's body */
  children: ReactNode;
  /** An optional title for the card, displayed in the header */
  title?: string;
  /** An optional description or subtitle for the card */
  description?: string;
  /** An optional icon to be displayed in the card's header */
  icon?: LucideIcon | ReactNode;
  /** If true, applies a subtle background style to the card */
  subtle?: boolean;
  /** Optional content to be displayed in the card's footer section */
  footer?: ReactNode;
  /** Optional additional CSS classes to apply to the card's header section */
  headerClassName?: string;
  /** Optional additional CSS classes to apply to the card's main body section */
  bodyClassName?: string;
  /** Optional additional CSS classes to apply to the card's footer section */
  footerClassName?: string;
  /** If true, removes the default padding from the card's body section */
  noPadding?: boolean;
  /** Card variant for different styles */
  variant?: 'default' | 'subtle' | 'bordered';
  /** If true, uses smaller padding for a more compact layout */
  compact?: boolean;
}

/**
 * Card component - A container for grouped content with optional header and footer
 * Fully type-safe with theme integration
 */
const CardComponent = forwardRef<HTMLDivElement, CardProps>(function Card({
  children,
  title,
  description,
  icon,
  className = '',
  subtle = false,
  footer,
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  noPadding = false,
  variant = 'default',
  compact = false,
  ...props
}, ref) {
  const cardClasses = cn(
    theme.components.card.base,
    'max-w-full overflow-hidden',
    subtle ? theme.components.card.subtle : CARD_VARIANTS[variant],
    className
  );

  const renderIcon = (): ReactNode => {
    if (!icon) return null;

    // Defensive runtime check: if icon is not a function or valid element, skip rendering
    if (typeof icon !== 'function' && !isValidElement(icon)) {
      return null;
    }

    return (
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        theme.bg.accent.icon
      )}>
        {typeof icon === 'function'
          ? createElement(icon as LucideIcon, {
              className: "w-4 h-4 text-white",
              "aria-hidden": "true"
            })
          : icon
        }
      </div>
    );
  };

  const hasHeader = icon || title || description;

  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {hasHeader && (
        <div className={cn(
          'flex items-center gap-3',
          compact ? 'p-3' : 'p-4 sm:p-6',
          footer ? cn('border-b', theme.border.default) : undefined,
          headerClassName
        )}>
          {renderIcon()}
          <div className="flex-1">
            {title && (
              <h2 className={cn(
                compact ? 'text-base font-semibold' : 'text-lg font-semibold', 
                theme.text.heading
              )}>
                {title}
              </h2>
            )}
            {description && (
              <p className={cn('text-sm', theme.text.secondary)}>
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={cn(
        noPadding ? '' : compact ? 'p-3' : 'p-4 sm:p-6',
        'min-w-0 overflow-hidden',
        bodyClassName
      )}>
        {children}
      </div>

      {footer && (
        <div className={cn(
          compact ? 'p-3' : 'p-4 sm:p-6',
          'border-t',
          theme.border.default,
          footerClassName
        )}>
          {footer}
        </div>
      )}
    </div>
  );
});

// Memoized export
export const Card = memo(CardComponent);

export default Card;