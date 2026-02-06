import { createContext } from 'react';
import type { ThemeMode } from '../store/useSettingsStore';

export interface LayoutContextType {
  theme: ThemeMode;
  apiKey: string;
  onOpenSettings: () => void;
}

export const LayoutContext = createContext<LayoutContextType | null>(null);
