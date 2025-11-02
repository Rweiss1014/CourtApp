import { PrivacyScreen } from '@capacitor-community/privacy-screen';
import { Capacitor } from '@capacitor/core';

export class PrivacyScreenService {
  private static instance: PrivacyScreenService;
  private enabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): PrivacyScreenService {
    if (!PrivacyScreenService.instance) {
      PrivacyScreenService.instance = new PrivacyScreenService();
    }
    return PrivacyScreenService.instance;
  }

  /**
   * Initialize privacy screen protection
   */
  private async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Privacy screen only available on native platforms');
      return;
    }

    try {
      // Enable privacy screen by default for security
      await this.enable();
    } catch (error) {
      console.error('Failed to initialize privacy screen:', error);
    }
  }

  /**
   * Enable privacy screen protection
   * - iOS: Shows app name when app is in background
   * - Android: Prevents screenshots and screen recording
   */
  async enable(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Privacy screen only available on native platforms');
      return;
    }

    try {
      await PrivacyScreen.enable();
      this.enabled = true;
      console.log('Privacy screen enabled');
    } catch (error) {
      console.error('Failed to enable privacy screen:', error);
      throw error;
    }
  }

  /**
   * Disable privacy screen protection
   * Use with caution - only for specific user-requested scenarios
   */
  async disable(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await PrivacyScreen.disable();
      this.enabled = false;
      console.log('Privacy screen disabled');
    } catch (error) {
      console.error('Failed to disable privacy screen:', error);
      throw error;
    }
  }

  /**
   * Check if privacy screen is currently enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Temporarily disable for screenshot (with user permission)
   * Re-enables after callback completes
   */
  async temporaryDisable(callback: () => Promise<void>): Promise<void> {
    if (!this.enabled) {
      await callback();
      return;
    }

    try {
      await this.disable();
      await callback();
    } finally {
      await this.enable();
    }
  }
}

export const privacyScreen = PrivacyScreenService.getInstance();
