import type { FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Key, Sparkles, Settings, ArrowRight } from 'lucide-react';
import { theme, cn } from '../../design/theme';

export interface ApiKeyPromptProps {
  /** Main title */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom icon */
  icon?: LucideIcon;
  /** Additional content or actions */
  children?: ReactNode;
  /** Show settings hint */
  showSettingsHint?: boolean;
  /** Optional CSS class */
  className?: string;
  /** Callback when settings button is clicked */
  onSettingsClick?: () => void;
  /** Variant style */
  variant?: 'default' | 'compact' | 'minimal';
}

/**
 * ApiKeyPrompt component - Displays a prompt when API key is missing
 * Fully type-safe with theme integration
 */
export const ApiKeyPrompt: FC<ApiKeyPromptProps> = ({
  title = 'API Key Required',
  description = 'Configure your Gemini API key in settings to unlock powerful OCR capabilities and start extracting text from your documents.',
  icon: Icon = Key,
  children,
  showSettingsHint = true,
  className,
  onSettingsClick,
  variant = 'default'
}) => {
  if (variant === 'minimal') {
    return (
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-xl',
        theme.bg.warning,
        'border border-yellow-200 dark:border-yellow-700',
        className
      )}>
        <Icon className={cn('w-5 h-5', theme.text.warning)} aria-hidden="true" />
        <div className="flex-1">
          <p className={cn('text-sm font-medium', theme.text.primary)}>
            {title}
          </p>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className={cn(
                'text-sm mt-1',
                theme.text.link,
                'flex items-center gap-1'
              )}
            >
              Open Settings
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed',
        theme.bg.accent.blue,
        'border-stone-200/60 dark:border-stone-600/30 amoled:border-stone-600/20',
        theme.animation.fadeIn,
        className
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0',
            theme.bg.accent.icon,
            theme.shadow.button
          )}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn('text-sm sm:text-base font-semibold', theme.text.heading)}>
              {title}
            </h3>
            <p className={cn('text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2', theme.text.secondary)}>
              {description}
            </p>
          </div>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className={cn(
                'p-1.5 sm:p-2 rounded-lg shrink-0',
                theme.bg.hover,
                theme.animation.transition
              )}
              aria-label="Open settings"
            >
              <Settings className={cn('w-4 h-4 sm:w-5 sm:h-5', theme.text.secondary)} />
            </button>
          )}
        </div>
        {children}
      </div>
    );
  }

  // Default variant - full display
  return (
    <div className={cn(
      'text-center py-8 px-4 sm:py-10 sm:px-6 md:py-12 rounded-2xl sm:rounded-3xl border-2 border-dashed relative overflow-hidden',
      theme.bg.accent.blue,
      'border-stone-200/60 dark:border-stone-600/30 amoled:border-stone-600/20',
      theme.animation.fadeIn,
      className
    )}>
      {/* Background decoration */}
      <div className={cn(
        'absolute inset-0',
        theme.bg.accent.overlayLight
      )} />

      <div className="relative z-10">
        <div className={cn(
          'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 sm:mb-5 md:mb-6 rounded-xl sm:rounded-2xl flex items-center justify-center',
          theme.bg.accent.iconIndigo,
          theme.shadow.button
        )}>
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" aria-hidden="true" />
        </div>

        <h3 className={cn('text-lg sm:text-xl font-semibold mb-2 sm:mb-3', theme.text.heading)}>
          {title}
        </h3>

        <p className={cn(
          'text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto leading-relaxed',
          theme.text.secondary
        )}>
          {description}
        </p>

        {showSettingsHint && (
          <div className={cn(
            'mt-4 sm:mt-6 inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full',
            'bg-stone-100/80 dark:bg-stone-700/50 amoled:bg-stone-800/50',
            'text-[10px] sm:text-xs font-medium',
            theme.text.blue.secondary
          )}>
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
            <span>AI-Powered Text Recognition</span>
          </div>
        )}

        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className={cn(
              'mt-4 sm:mt-6 inline-flex items-center gap-2',
              'px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg',
              theme.components.button.primary,
              'text-xs sm:text-sm'
            )}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Open Settings
          </button>
        )}

        {children}
      </div>
    </div>
  );
};

export default ApiKeyPrompt;