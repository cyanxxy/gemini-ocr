import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import { LayoutProvider } from './components/layout/Layout';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { SettingsModal } from './components/modals/SettingsModal';
import { useSettingsStore } from './store/useSettingsStore';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load page components
const SimpleOCR = lazy(() => import('./pages/SimpleOCR').then(module => ({ default: module.default })));
const WebOCR = lazy(() => import('./pages/WebOCR').then(module => ({ default: module.default })));
const AdvancedOCR = lazy(() => import('./pages/AdvancedOCR').then(module => ({ default: module.default })));
const AgenticOCR = lazy(() => import('./pages/AgenticOCR').then(module => ({ default: module.default })));

function App() {
  const { apiKey, setApiKey, theme, setTheme, model, setModel, thinkingConfig, updateThinkingConfig } = useSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(!apiKey);


  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'amoled');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
    document.getElementById('settings-button')?.focus();
  }, []);

  const handleSaveSettings = useCallback((newApiKey: string, newTheme: typeof theme, newModel: typeof model, newThinkingConfig: typeof thinkingConfig) => {
    setApiKey(newApiKey);
    setTheme(newTheme);
    setModel(newModel);
    updateThinkingConfig(newThinkingConfig);
    setIsSettingsOpen(false);
    setShowBanner(false);
    document.getElementById('settings-button')?.focus();
  }, [setApiKey, setTheme, setModel, updateThinkingConfig]);

  const handleCloseBanner = useCallback(() => {
    setShowBanner(false);
  }, []);


  return (
    <>
      {/* API Key Banner */}
      {showBanner && !apiKey && (
        <ApiKeyBanner
          onOpenSettings={handleOpenSettings}
          onClose={handleCloseBanner}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        initialApiKey={apiKey}
        initialTheme={theme}
        initialModel={model}
        initialThinkingConfig={thinkingConfig}
      />

      <ErrorBoundary>
        <LayoutProvider
          theme={theme}
          apiKey={apiKey}
          onOpenSettings={handleOpenSettings}
        >
          <Suspense fallback={<div className="p-8 flex justify-center"><LoadingIndicator size="lg" text="Loading page..." /></div>}>
            <Routes>
              <Route path="/" element={<SimpleOCR />} />
              <Route path="/web" element={<WebOCR />} />
              <Route path="/advanced" element={<AdvancedOCR />} />
              <Route path="/agentic" element={<AgenticOCR />} />
            </Routes>
          </Suspense>
        </LayoutProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;