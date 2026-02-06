import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encryptData, decryptData } from '../lib/crypto';
import { logger } from '../lib/logger';
import type { ThinkingLevel } from '../lib/gemini/types';

// Re-export ThinkingLevel for convenience
export type { ThinkingLevel };

/**
 * Defines the available Gemini model types that the user can select (Gemini 3 only).
 */
export type ModelType =
  | 'gemini-3-pro-preview'
  | 'gemini-3-flash-preview';

/**
 * Defines the available theme modes for the application.
 */
export type ThemeMode = 'light' | 'dark' | 'amoled';

/**
 * Thinking mode configuration for Gemini 3 models
 * Uses `level` ('MINIMAL'/'LOW'/'MEDIUM'/'HIGH' depending on model support)
 * Note: Thinking isn't fully disabled for Gemini 3; MINIMAL is the lightest setting
 */
export interface ThinkingConfig {
  /** Thinking level - availability depends on the selected model */
  level: ThinkingLevel;
  /** Whether to include thinking content in the response */
  includeThoughts?: boolean;
}

/**
 * Defines the state and actions for managing application settings.
 * This includes user preferences like API key, AI model, theme,
 * and interaction states like onboarding completion.
 */
interface SettingsState {
  /**
   * The user's Google Generative AI API key.
   * This is stored encrypted in localStorage by the `setApiKey` action
   * and decrypted on rehydration.
   */
  apiKey: string;
  /** The selected {@link ModelType} for AI operations. */
  model: ModelType;
  /** A boolean indicating whether handwriting-specific OCR enhancements are enabled. */
  handwritingMode: boolean;
  /** The currently active {@link ThemeMode} for the application. */
  theme: ThemeMode;
  /** Thinking mode configuration for Gemini 3 models */
  thinkingConfig: ThinkingConfig;

  /**
   * Sets the API key. The key is encrypted before being stored in localStorage
   * and also updated in the Zustand state.
   * @param key - The API key string to set.
   */
  setApiKey: (key: string) => void;
  /**
   * Sets the AI model to be used for OCR and other generative tasks.
   * @param model - The {@link ModelType} to set.
   */
  setModel: (model: ModelType) => void;
  /**
   * Enables or disables handwriting-specific OCR enhancements.
   * @param enabled - `true` to enable handwriting mode, `false` to disable.
   */
  setHandwritingMode: (enabled: boolean) => void;
  /**
   * Sets the application theme. It updates the class on the HTML document root
   * to apply theme styles and updates the state.
   * @param theme - The {@link ThemeMode} to apply.
   */
  setTheme: (theme: ThemeMode) => void;
  /**
   * Updates thinking mode configuration
   * @param config - Partial thinking configuration update
   */
  updateThinkingConfig: (config: Partial<ThinkingConfig>) => void;
}

/**
 * Zustand store for managing application settings.
 *
 * This store handles:
 * - User's API key (encrypted in localStorage).
 * - Selected AI model.
 * - Handwriting mode preference.
 * - Application theme.
 * - Onboarding completion status.
 *
 * It uses `persist` middleware to save settings (excluding the raw API key, which is handled specially)
 * to local storage. The API key is encrypted via `encryptData` before saving to `localStorage`
 * (under the key 'gemini-api-key') and decrypted via `decryptData` during the `onRehydrateStorage`
 * process. The theme is also applied to the document element during rehydration and when set.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'gemini-3-flash-preview',
      handwritingMode: false,
      theme: 'light',
      thinkingConfig: {
        level: 'HIGH', // Default thinking level for Gemini 3
        includeThoughts: false,
      },
      setApiKey: async (key: string) => {
        try {
          const trimmedKey = key.trim();
          const encryptedKey = await encryptData(trimmedKey);
          localStorage.setItem('gemini-api-key', encryptedKey);
          set({ apiKey: trimmedKey });
        } catch (error) {
          logger.error('Failed to encrypt API key:', error);
          set({ apiKey: key.trim() });
        }
      },
      setModel: (model: ModelType) => {
        const validModels: ModelType[] = ['gemini-3-pro-preview', 'gemini-3-flash-preview'];
        if (validModels.includes(model)) {
          set({ model });
        }
      },
      setHandwritingMode: (enabled: boolean) => set({ handwritingMode: enabled }),
      setTheme: (theme: ThemeMode) => {
        const validThemes: ThemeMode[] = ['light', 'dark', 'amoled'];
        if (!validThemes.includes(theme)) return;
        document.documentElement.classList.remove('light', 'dark', 'amoled');
        document.documentElement.classList.add(theme);
        set({ theme });
      },
      updateThinkingConfig: (config) => set((state) => {
        const isFlash = state.model === 'gemini-3-flash-preview';
        const allowed: ThinkingLevel[] = isFlash
          ? ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH']
          : ['LOW', 'HIGH'];
        const rawLevel = config.level ?? state.thinkingConfig.level;
        const normalized = typeof rawLevel === 'string'
          ? rawLevel.toUpperCase()
          : rawLevel;
        const level = (allowed as readonly string[]).includes(normalized)
          ? (normalized as ThinkingLevel)
          : 'HIGH';

        return {
          thinkingConfig: {
            ...state.thinkingConfig,
            ...config,
            level,
          },
        };
      }),
    }),
    {
      name: 'gemini-settings',
      partialize: (state) => ({
        model: state.model,
        handwritingMode: state.handwritingMode,
        theme: state.theme,
        thinkingConfig: state.thinkingConfig
      }),
      onRehydrateStorage: () => {
        return async (state, error) => {
          if (error) {
            logger.error('Failed to rehydrate settings:', error);
            return;
          }
          
          if (!state) return;

          try {
            // Validate and clean up the rehydrated state
            const validModels: ModelType[] = ['gemini-3-pro-preview', 'gemini-3-flash-preview'];
            const validThemes: ThemeMode[] = ['light', 'dark', 'amoled'];

            // Validate model - migrate old models to Gemini 3 Flash
            if (!validModels.includes(state.model)) {
              state.model = 'gemini-3-flash-preview';
            }

            // Validate theme
            if (!validThemes.includes(state.theme)) {
              state.theme = 'light';
            }

            // Validate handwriting mode
            if (typeof state.handwritingMode !== 'boolean') {
              state.handwritingMode = false;
            }

            // Validate thinking configuration (Gemini 3 levels)
            const validLevels: ThinkingLevel[] = ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH'];
            if (!state.thinkingConfig || typeof state.thinkingConfig !== 'object') {
              state.thinkingConfig = {
                level: 'HIGH',
                includeThoughts: false,
              };
            } else {
              // Migrate old lowercase/invalid values to valid levels
              const currentLevel = state.thinkingConfig.level?.toUpperCase() as ThinkingLevel;
              if (!currentLevel || !validLevels.includes(currentLevel)) {
                // Map old values to new valid values
                const oldLevel = state.thinkingConfig.level?.toLowerCase();
                if (oldLevel === 'minimal') {
                  state.thinkingConfig.level = 'MINIMAL';
                } else if (oldLevel === 'low') {
                  state.thinkingConfig.level = 'LOW';
                } else if (oldLevel === 'medium') {
                  state.thinkingConfig.level = 'MEDIUM';
                } else {
                  // 'high' or any invalid value defaults to 'HIGH'
                  state.thinkingConfig.level = 'HIGH';
                }
              } else {
                state.thinkingConfig.level = currentLevel;
              }
              // Ensure includeThoughts exists
              if (typeof state.thinkingConfig.includeThoughts !== 'boolean') {
                state.thinkingConfig.includeThoughts = false;
              }
            }

            // Clamp thinking level based on selected model
            if (state.model === 'gemini-3-pro-preview' &&
                (state.thinkingConfig.level === 'MINIMAL' || state.thinkingConfig.level === 'MEDIUM')) {
              state.thinkingConfig.level = 'HIGH';
            }

            // Restore theme
            document.documentElement.classList.remove('light', 'dark', 'amoled');
            document.documentElement.classList.add(state.theme);

            // Restore API key using proper state update without circular reference
            const encryptedKey = localStorage.getItem('gemini-api-key');
            if (encryptedKey) {
              const decryptedKey = await decryptData(encryptedKey);
              if (decryptedKey && typeof decryptedKey === 'string') {
                // Update state directly
                state.apiKey = decryptedKey;
              }
            }
          } catch (error) {
            logger.error('Failed to decrypt API key or validate settings during rehydration:', error);
            // Set safe defaults if validation/decryption fails
            state.apiKey = '';
            state.model = 'gemini-3-flash-preview';
            state.theme = 'light';
            state.handwritingMode = false;
            state.thinkingConfig = {
              level: 'HIGH',
              includeThoughts: false,
            };
          }
        };
      },
    }
  )
);
