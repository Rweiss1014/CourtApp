import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: BiometryType;
}

export class BiometricAuthService {
  private static instance: BiometricAuthService;

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric authentication is available on the device
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Biometric auth only available on native platforms');
        return false;
      }

      const result = await BiometricAuth.checkBiometry();
      return result.isAvailable;
    } catch (error) {
      console.error('Error checking biometry availability:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  async getBiometryType(): Promise<BiometryType | null> {
    try {
      const result = await BiometricAuth.checkBiometry();
      return result.biometryType;
    } catch (error) {
      console.error('Error getting biometry type:', error);
      return null;
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(reason: string = 'Access your secure evidence data'): Promise<BiometricAuthResult> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return {
          success: false,
          error: 'Biometric authentication only available on mobile devices'
        };
      }

      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device'
        };
      }

      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Biometric Authentication',
        androidSubtitle: 'Her Law Family Court Organizer',
        androidConfirmationRequired: false,
      });

      const biometryType = await this.getBiometryType();

      return {
        success: true,
        biometryType: biometryType || undefined
      };
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);

      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  /**
   * Get user-friendly name for biometry type
   */
  getBiometryName(type: BiometryType | null): string {
    if (!type) return 'Biometric';

    switch (type) {
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.faceId:
        return 'Face ID';
      case BiometryType.fingerprintAuthentication:
        return 'Fingerprint';
      case BiometryType.faceAuthentication:
        return 'Face Recognition';
      case BiometryType.irisAuthentication:
        return 'Iris Recognition';
      default:
        return 'Biometric';
    }
  }
}

export const biometricAuth = BiometricAuthService.getInstance();
