import type { FC } from 'react';
import type { File as FileIcon } from 'lucide-react';
import { FileText, Trash2, ChevronDown, ChevronRight, CheckCircle2, Clock, FileImage } from 'lucide-react';
import { theme, cn } from '../../design/theme';

export interface FileListItemProps {
  /** The file object */
  file: File;
  /** Whether the file has been processed */
  isProcessed: boolean;
  /** Whether the content is expanded (for processed files) */
  isExpanded?: boolean;
  /** Callback to remove the file */
  onRemoveFile: () => void;
  /** Callback to toggle expand/collapse (optional) */
  onToggleExpand?: () => void;
  /** Whether the file is currently being processed */
  isProcessing?: boolean;
  /** Custom status text */
  statusText?: string;
}

/**
 * Format file size in a human-readable way
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Get file extension
 */
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toUpperCase() || 'FILE';
};

/**
 * Get appropriate icon for file type
 */
const getFileIcon = (file: File): { icon: typeof FileIcon; color: string } => {
  const ext = getFileExtension(file.name);

  if (ext === 'PDF') {
    return { icon: FileText, color: 'text-[#E34234]' };
  }

  if (file.type.startsWith('image/')) {
    return { icon: FileImage, color: 'text-stone-600 dark:text-stone-400' };
  }

  return { icon: FileText, color: 'text-stone-600 dark:text-stone-400' };
};

/**
 * FileListItem component - Displays file information with status and actions
 * Fully type-safe with theme integration
 */
export const FileListItem: FC<FileListItemProps> = ({
  file,
  isProcessed,
  isExpanded = false,
  onRemoveFile,
  onToggleExpand,
  isProcessing = false,
  statusText
}) => {
  const fileExt = getFileExtension(file.name);
  const { icon: FileTypeIcon, color: iconColor } = getFileIcon(file);

  const containerClasses = cn(
    'flex items-center justify-between p-3 rounded-xl border',
    theme.animation.transition,
    'group',
    isProcessed
      ? cn('bg-stone-50 dark:bg-stone-800/50 amoled:bg-stone-900/50', 'border-stone-300 dark:border-stone-600 amoled:border-stone-700', 'hover:border-stone-400 dark:hover:border-stone-500')
      : cn(theme.bg.card, theme.border.default, 'hover:border-stone-300 dark:hover:border-stone-600 amoled:hover:border-stone-700')
  );

  const iconContainerClasses = cn(
    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
    isProcessed
      ? 'bg-stone-200 dark:bg-stone-700/50 amoled:bg-stone-800/50'
      : 'bg-stone-100 dark:bg-stone-800/50 amoled:bg-stone-800/30'
  );

  const getStatusDisplay = () => {
    if (statusText) {
      return (
        <span className={cn('flex items-center gap-1 text-xs', theme.text.secondary)}>
          {statusText}
        </span>
      );
    }

    if (isProcessing) {
      return (
        <span className={cn('flex items-center gap-1 text-xs', 'text-stone-600 dark:text-stone-400')}>
          <div className="w-3 h-3">
            <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <span>Processing</span>
        </span>
      );
    }

    if (isProcessed) {
      return (
        <span className={cn('flex items-center gap-1 text-xs', 'text-stone-700 dark:text-stone-300')}>
          <CheckCircle2 className="w-3 h-3" />
          <span>Processed</span>
        </span>
      );
    }

    return (
      <span className={cn('flex items-center gap-1 text-xs', theme.text.warning)}>
        <Clock className="w-3 h-3" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={iconContainerClasses}>
          {fileExt === 'PDF' ? (
            <div className="text-[10px] font-bold text-red-500 dark:text-red-400 amoled:text-red-500">
              PDF
            </div>
          ) : (
            <FileTypeIcon
              className={cn('w-5 h-5', isProcessed ? theme.text.success : iconColor)}
              aria-hidden="true"
            />
          )}
        </div>
        
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium truncate', theme.text.primary)}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className={theme.text.tertiary}>
              {formatFileSize(file.size)}
            </span>
            {getStatusDisplay()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        {isProcessed && onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn(
              'p-1.5 rounded-lg',
              theme.animation.transition,
              'hover:bg-stone-200 dark:hover:bg-stone-700/50 amoled:hover:bg-stone-800/50'
            )}
            aria-label={isExpanded ? "Collapse file content" : "Expand file content"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className={cn('w-4 h-4', 'text-stone-600 dark:text-stone-400')} aria-hidden="true" />
            ) : (
              <ChevronRight className={cn('w-4 h-4', 'text-stone-600 dark:text-stone-400')} aria-hidden="true" />
            )}
          </button>
        )}
        
        <button
          type="button"
          onClick={onRemoveFile}
          className={cn(
            'p-1.5 rounded-lg',
            theme.animation.transition,
            'hover:bg-red-50 dark:hover:bg-red-900/20 amoled:hover:bg-red-900/10',
            isProcessing && theme.utils.disabled
          )}
          disabled={isProcessing}
          aria-label="Remove file"
        >
          <Trash2 className={cn('w-4 h-4', theme.text.error)} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default FileListItem;