import { memo } from 'react';
import { Loader } from 'lucide-react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  text?: string;
  className?: string;
}

export const LoadingIndicator = memo(function LoadingIndicator({
  size = 'md',
  fullPage = false,
  text = 'Loading...',
  className = '',
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-stone-900/80 amoled:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className={`${sizeClasses.lg} text-stone-900 dark:text-stone-100 amoled:text-stone-200 animate-spin`} aria-hidden="true" />
          <p className="text-sm font-medium text-stone-900 dark:text-white amoled:text-stone-200">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader className={`${sizeClasses[size]} text-stone-900 dark:text-stone-100 amoled:text-stone-200 animate-spin`} aria-hidden="true" />
      {text && <span className="text-sm text-stone-700 dark:text-stone-300 amoled:text-stone-400">{text}</span>}
    </div>
  );
});