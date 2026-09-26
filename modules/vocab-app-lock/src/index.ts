import { requireOptionalNativeModule } from 'expo-modules-core';

export type AppLockConfig = {
  packageNames: string[];
  cooldownMinutes: number;
  prompt: string;
  answer: string;
};

type NativeAppLock = {
  setConfig(config: AppLockConfig): void;
  getStatus(): { serviceEnabled: boolean; cooldownUntil: number };
  openAccessibilitySettings(): void;
};

export const VocabAppLock = requireOptionalNativeModule<NativeAppLock>('VocabAppLock');
