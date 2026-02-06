import { FileListItem } from '../molecules/FileListItem';
import type { ExtractedContent } from '../../lib/gemini/types';

interface TrackedFile {
  id: string;
  file: File;
}

interface ProcessedResult {
  fileId: string;
  fileName: string;
  content: ExtractedContent;
}

interface BulkFileListProps {
  files: TrackedFile[];
  expandedFiles: { [key: string]: boolean };
  processedResults: ProcessedResult[];
  isProcessing?: boolean;
  onRemoveFile: (fileId: string) => void;
  onToggleExpand: (fileId: string) => void;
}

export function BulkFileList({
  files,
  expandedFiles,
  processedResults,
  isProcessing,
  onRemoveFile,
  onToggleExpand
}: BulkFileListProps) {
  const hasResultForFile = (fileId: string) => {
    return processedResults.some(result => result.fileId === fileId);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-600 amoled:scrollbar-thumb-stone-700 scrollbar-track-transparent">
      {files.map((trackedFile) => {
        const isProcessed = hasResultForFile(trackedFile.id);

        return (
          <FileListItem
            key={trackedFile.id}
            file={trackedFile.file}
            isProcessed={isProcessed}
            isProcessing={isProcessing}
            isExpanded={expandedFiles[trackedFile.id]}
            onRemoveFile={() => onRemoveFile(trackedFile.id)}
            onToggleExpand={() => onToggleExpand(trackedFile.id)}
          />
        );
      })}
    </div>
  );
}
