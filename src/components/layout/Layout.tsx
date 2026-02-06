import type { ReactNode } from 'react';
import type { ThemeMode } from '../../store/useSettingsStore';
import { Header } from './Header';
import { Footer } from './Footer';
import { LayoutContext } from '../../contexts/LayoutContext';

interface LayoutProviderProps {
  children: ReactNode;
  theme: ThemeMode;
  apiKey: string;
  onOpenSettings: () => void;
}

export const LayoutProvider = ({
  children,
  theme,
  apiKey,
  onOpenSettings
}: LayoutProviderProps) => {
  return (
    <LayoutContext.Provider value={{ theme, apiKey, onOpenSettings }}>
      <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-900 amoled:bg-black font-sans antialiased">
        {/* Skip to content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <Header apiKey={apiKey} onOpenSettings={onOpenSettings} />
        <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
          <div className="px-3 py-4 sm:px-4 sm:py-6 md:px-6">
            <div className="w-full max-w-[1800px] mx-auto">
              {children}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </LayoutContext.Provider>
  );
}