/**
 * Encrypted Backup Service
 * Creates password-protected encrypted backups of all user data
 * Uses Web Crypto API with AES-GCM encryption
 */

import { RecordType } from '../../App';
import { indexedDBStorage } from './indexedDBStorage';

export interface BackupData {
  version: string;
  exportDate: string;
  records: RecordType[];
  settings: {
    pin?: string;
    decoyPin?: string;
    lockEnabled?: string;
    userName?: string;
    welcomeCompleted?: string;
  };
}

export interface EncryptedBackup {
  version: string;
  salt: string;
  iv: string;
  data: string;
}

class EncryptedBackupService {
  private readonly BACKUP_VERSION = '1.0';
  private readonly ITERATIONS = 100000; // PBKDF2 iterations

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert array buffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to array buffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Create encrypted backup of all data
   */
  async createBackup(password: string, records: RecordType[]): Promise<EncryptedBackup> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      // Gather all data
      const settings = {
        pin: await indexedDBStorage.getSetting('recordKeeper_pin'),
        decoyPin: await indexedDBStorage.getSetting('recordKeeper_decoyPin'),
        lockEnabled: await indexedDBStorage.getSetting('recordKeeper_lockEnabled'),
        userName: await indexedDBStorage.getSetting('recordKeeper_userName'),
        welcomeCompleted: await indexedDBStorage.getSetting('recordKeeper_welcomeCompleted'),
      };

      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        exportDate: new Date().toISOString(),
        records,
        settings,
      };

      // Convert to JSON
      const jsonData = JSON.stringify(backupData);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonData);

      // Generate random salt and IV
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        dataBuffer
      );

      // Create encrypted backup object
      return {
        version: this.BACKUP_VERSION,
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
        data: this.arrayBufferToBase64(encryptedBuffer),
      };
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Failed to create encrypted backup');
    }
  }

  /**
   * Decrypt and restore backup
   */
  async restoreBackup(password: string, encryptedBackup: EncryptedBackup): Promise<BackupData> {
    if (!password) {
      throw new Error('Password is required');
    }

    try {
      // Convert base64 strings back to array buffers
      const salt = new Uint8Array(this.base64ToArrayBuffer(encryptedBackup.salt));
      const iv = new Uint8Array(this.base64ToArrayBuffer(encryptedBackup.iv));
      const encryptedData = this.base64ToArrayBuffer(encryptedBackup.data);

      // Derive key from password
      const key = await this.deriveKey(password, salt);

      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedData
      );

      // Convert back to JSON
      const decoder = new TextDecoder();
      const jsonData = decoder.decode(decryptedBuffer);
      const backupData: BackupData = JSON.parse(jsonData);

      // Validate backup version
      if (backupData.version !== this.BACKUP_VERSION) {
        console.warn('Backup version mismatch:', backupData.version, 'vs', this.BACKUP_VERSION);
      }

      return backupData;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      if (error instanceof Error && error.message.includes('OperationError')) {
        throw new Error('Incorrect password or corrupted backup file');
      }
      throw new Error('Failed to restore backup');
    }
  }

  /**
   * Download encrypted backup as file
   */
  async downloadBackup(password: string, records: RecordType[], filename?: string): Promise<void> {
    const encryptedBackup = await this.createBackup(password, records);
    const jsonString = JSON.stringify(encryptedBackup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // Generate filename with date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    a.download = filename || `herlaw-backup-${dateStr}.encrypted`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Restore from uploaded backup file
   */
  async restoreFromFile(password: string, file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const encryptedBackup: EncryptedBackup = JSON.parse(content);
          const backupData = await this.restoreBackup(password, encryptedBackup);
          resolve(backupData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Apply restored backup data to storage
   */
  async applyBackup(backupData: BackupData): Promise<void> {
    try {
      // Restore records
      await indexedDBStorage.saveRecords(backupData.records);

      // Restore settings
      if (backupData.settings.pin) {
        await indexedDBStorage.saveSetting('recordKeeper_pin', backupData.settings.pin);
      }
      if (backupData.settings.decoyPin) {
        await indexedDBStorage.saveSetting('recordKeeper_decoyPin', backupData.settings.decoyPin);
      }
      if (backupData.settings.lockEnabled) {
        await indexedDBStorage.saveSetting('recordKeeper_lockEnabled', backupData.settings.lockEnabled);
      }
      if (backupData.settings.userName) {
        await indexedDBStorage.saveSetting('recordKeeper_userName', backupData.settings.userName);
      }
      if (backupData.settings.welcomeCompleted) {
        await indexedDBStorage.saveSetting('recordKeeper_welcomeCompleted', backupData.settings.welcomeCompleted);
      }

      console.log(`Restored ${backupData.records.length} records from backup`);
    } catch (error) {
      console.error('Failed to apply backup:', error);
      throw new Error('Failed to apply backup data');
    }
  }
}

export const encryptedBackup = new EncryptedBackupService();
