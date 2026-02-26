import type { KeyboardEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Save,
  Key,
  Moon,
  Sun,
  Zap,
  Check,
  Beaker,
  AlertCircle,
  Wifi,
  ShieldX,
  Database,
  ExternalLink,
  Sparkles,
  Monitor
} from 'lucide-react';
import type { ThemeMode, ModelType, ThinkingConfig } from '../../store/useSettingsStore';
import type { TestResult } from '../../utils/testGemini';
import { testGemini } from '../../utils/testGemini';
import { cn } from '../../design/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, theme: ThemeMode, model: ModelType, thinkingConfig: ThinkingConfig) => void;
  initialApiKey: string;
  initialTheme: ThemeMode;
  initialModel: ModelType;
  initialThinkingConfig: ThinkingConfig;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  initialApiKey,
  initialTheme,
  initialModel,
  initialThinkingConfig
}: SettingsModalProps) {
  const [tempApiKey, setTempApiKey] = useState(initialApiKey);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [model, setModel] = useState<ModelType>(initialModel);
  const [thinkingConfig, setThinkingConfig] = useState<ThinkingConfig>(initialThinkingConfig);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempApiKey(initialApiKey);
      setThemeMode(initialTheme);
      setModel(initialModel);
      setThinkingConfig(initialThinkingConfig);
      setTestResult(null);
    }
  }, [isOpen, initialApiKey, initialTheme, initialModel, initialThinkingConfig]);

  useEffect(() => {
    if (model === 'gemini-3.1-pro-preview' &&
        thinkingConfig.level === 'MINIMAL') {
      setThinkingConfig((prev) => ({ ...prev, level: 'HIGH' }));
    }
  }, [model, thinkingConfig.level]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => apiKeyInputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }, [onClose]);

  const handleSave = () => onSave(tempApiKey, themeMode, model, thinkingConfig);

  const handleTestApiKey = async () => {
    if (!tempApiKey.trim()) {
      setTestResult({ success: false, model, responseTime: 0, error: 'Enter an API key first', errorType: 'auth' });
      return;
    }
    setIsTestingApi(true);
    setTestResult(null);
    try {
      const result = await testGemini(tempApiKey, model);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, model, responseTime: 0, error: error instanceof Error ? error.message : 'Unknown error', errorType: 'unknown' });
    } finally {
      setIsTestingApi(false);
    }
  };

  const getErrorIcon = (errorType?: string) => {
    const icons: Record<string, JSX.Element> = {
      auth: <ShieldX className="w-3 h-3" />,
      quota: <Database className="w-3 h-3" />,
      network: <Wifi className="w-3 h-3" />,
    };
    return icons[errorType || ''] || <AlertCircle className="w-3 h-3" />;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-md overflow-hidden flex flex-col",
          "max-h-[calc(100vh-3rem)] sm:max-h-[85vh]",
          "mx-4 sm:mx-6",
          "bg-white dark:bg-stone-950 amoled:bg-black",
          "rounded-2xl shadow-2xl",
          "border border-stone-200/50 dark:border-stone-800/50"
        )}
        style={{
          animation: 'scaleIn 0.2s ease-out forwards',
        }}
      >
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #E34234, transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <h2
            id="settings-title"
            className="text-lg font-semibold text-stone-900 dark:text-stone-100"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Theme */}
          <section>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Theme</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {([
                { value: 'light' as ThemeMode, label: 'Light', icon: Sun },
                { value: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                { value: 'amoled' as ThemeMode, label: 'AMOLED', icon: Monitor },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setThemeMode(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    themeMode === value
                      ? "border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-900"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  )}
                >
                  <Icon className={cn("w-5 h-5", themeMode === value ? "text-stone-900 dark:text-stone-100" : "text-stone-400")} />
                  <span className={cn("text-xs font-medium", themeMode === value ? "text-stone-900 dark:text-stone-100" : "text-stone-500")}>{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Model */}
          <section>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Model</label>
            <div className="space-y-2 mt-2">
              {([
                { value: 'gemini-3-flash-preview' as ModelType, label: 'Gemini 3 Flash', badge: 'Fast', icon: Zap },
                { value: 'gemini-3.1-pro-preview' as ModelType, label: 'Gemini 3.1 Pro', badge: 'Best', icon: Sparkles },
              ]).map(({ value, label, badge, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setModel(value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                    model === value
                      ? "border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-900"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    model === value ? "bg-stone-900 dark:bg-stone-100" : "bg-stone-100 dark:bg-stone-800"
                  )}>
                    <Icon className={cn("w-4 h-4", model === value ? "text-white dark:text-stone-900" : "text-stone-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", model === value ? "text-stone-900 dark:text-stone-100" : "text-stone-700 dark:text-stone-300")}>{label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">{badge}</span>
                    </div>
                  </div>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", model === value ? "border-stone-900 dark:border-stone-100" : "border-stone-300 dark:border-stone-600")}>
                    {model === value && <div className="w-2 h-2 rounded-full bg-stone-900 dark:bg-stone-100" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* API Key */}
          <section>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: '#E34234' }}
              >
                Get Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  ref={apiKeyInputRef}
                  type="password"
                  value={tempApiKey}
                  onChange={e => setTempApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
                />
              </div>
              <button
                onClick={handleTestApiKey}
                disabled={isTestingApi || !tempApiKey}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 disabled:opacity-50 transition-colors"
              >
                {isTestingApi ? (
                  <><div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" /> Testing...</>
                ) : (
                  <><Beaker className="w-4 h-4" /> Test Connection</>
                )}
              </button>
              {testResult && (
                <div className={cn(
                  "p-3 rounded-xl flex items-center gap-2 text-xs",
                  testResult.success
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                )}>
                  {testResult.success ? <Check className="w-4 h-4" /> : getErrorIcon(testResult.errorType)}
                  <span className="font-medium">{testResult.success ? 'Connected' : 'Failed'}</span>
                  <span className="opacity-75">— {testResult.error || `${testResult.responseTime}ms`}</span>
                </div>
              )}
            </div>
          </section>

          {/* Reasoning Level */}
          <section>
            <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Reasoning</label>
            <div className={cn("grid gap-2 mt-2", model === 'gemini-3-flash-preview' ? "grid-cols-4" : "grid-cols-3")}>
              {[
                ...(model === 'gemini-3-flash-preview' ? [{ value: 'MINIMAL' as const, label: 'Min', emoji: '🌱' }] : []),
                { value: 'LOW' as const, label: 'Low', emoji: '⚡' },
                { value: 'MEDIUM' as const, label: 'Med', emoji: '⚖️' },
                { value: 'HIGH' as const, label: 'High', emoji: '🧠' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setThinkingConfig({ ...thinkingConfig, level: opt.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    thinkingConfig.level === opt.value
                      ? "border-stone-900 dark:border-stone-100 bg-stone-900 dark:bg-stone-100"
                      : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                  )}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className={cn("text-xs font-medium", thinkingConfig.level === opt.value ? "text-white dark:text-stone-900" : "text-stone-600 dark:text-stone-400")}>{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(to bottom, #E34234, #C9352A)' }}
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
