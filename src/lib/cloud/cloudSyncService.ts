/**
 * Cloud Sync Service
 * Handles encrypted data synchronization with cloud storage
 * Data is encrypted locally before upload - server never sees plaintext
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';
import { RecordType } from '../../App';
import { indexedDBStorage } from '../storage/indexedDBStorage';

export interface SyncData {
  version: string;
  lastSynced: string;
  records: RecordType[];
  settings: {
    pin?: string;
    decoyPin?: string;
    lockEnabled?: string;
    userName?: string;
  };
}

class CloudSyncService {
  private readonly SYNC_VERSION = '1.0';

  /**
   * Encrypt data before uploading to cloud
   */
  private async encryptData(data: SyncData, userId: string): Promise<string> {
    const jsonData = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonData);

    // Use user ID as part of encryption key material
    const keyMaterial = encoder.encode(userId);
    const importedKey = await window.crypto.subtle.importKey(
      'raw',
      keyMaterial,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive encryption key
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt data
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBuffer
    );

    // Combine salt, IV, and encrypted data
    const combined = new Uint8Array(salt.byteLength + iv.byteLength + encryptedBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.byteLength);
    combined.set(new Uint8Array(encryptedBuffer), salt.byteLength + iv.byteLength);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  }

  /**
   * Decrypt data after downloading from cloud
   */
  private async decryptData(encryptedBase64: string, userId: string): Promise<SyncData> {
    // Convert from base64
    const binary = atob(encryptedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Extract salt, IV, and encrypted data
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const encryptedData = bytes.slice(28);

    // Derive decryption key
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(userId);
    const importedKey = await window.crypto.subtle.importKey(
      'raw',
      keyMaterial,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      importedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

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
    return JSON.parse(jsonData);
  }

  /**
   * Upload encrypted data to cloud
   */
  async uploadToCloud(records: RecordType[]): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Cloud sync not configured' };
    }

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Not signed in' };
      }

      // Gather all data
      const settings = {
        pin: await indexedDBStorage.getSetting('recordKeeper_pin'),
        decoyPin: await indexedDBStorage.getSetting('recordKeeper_decoyPin'),
        lockEnabled: await indexedDBStorage.getSetting('recordKeeper_lockEnabled'),
        userName: await indexedDBStorage.getSetting('recordKeeper_userName'),
      };

      const syncData: SyncData = {
        version: this.SYNC_VERSION,
        lastSynced: new Date().toISOString(),
        records,
        settings,
      };

      // Encrypt data locally
      const encryptedData = await this.encryptData(syncData, user.id);

      // Upload to Supabase
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          encrypted_data: encryptedData,
          last_synced: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      console.log('Data synced to cloud successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('Cloud upload failed:', error);
      return { success: false, error: 'Failed to upload to cloud' };
    }
  }

  /**
   * Download encrypted data from cloud
   */
  async downloadFromCloud(): Promise<{ data: SyncData | null; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { data: null, error: 'Cloud sync not configured' };
    }

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { data: null, error: 'Not signed in' };
      }

      // Download from Supabase
      const { data, error } = await supabase
        .from('user_data')
        .select('encrypted_data, last_synced')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - this is OK for first sync
          return { data: null, error: null };
        }
        console.error('Download error:', error);
        return { data: null, error: error.message };
      }

      if (!data?.encrypted_data) {
        return { data: null, error: null };
      }

      // Decrypt data locally
      const syncData = await this.decryptData(data.encrypted_data, user.id);

      console.log('Data downloaded from cloud successfully');
      return { data: syncData, error: null };
    } catch (error) {
      console.error('Cloud download failed:', error);
      return { data: null, error: 'Failed to download from cloud' };
    }
  }

  /**
   * Apply downloaded data to local storage
   */
  async applySyncData(syncData: SyncData): Promise<void> {
    try {
      // Restore records
      await indexedDBStorage.saveRecords(syncData.records);

      // Restore settings
      if (syncData.settings.pin) {
        await indexedDBStorage.saveSetting('recordKeeper_pin', syncData.settings.pin);
      }
      if (syncData.settings.decoyPin) {
        await indexedDBStorage.saveSetting('recordKeeper_decoyPin', syncData.settings.decoyPin);
      }
      if (syncData.settings.lockEnabled) {
        await indexedDBStorage.saveSetting('recordKeeper_lockEnabled', syncData.settings.lockEnabled);
      }
      if (syncData.settings.userName) {
        await indexedDBStorage.saveSetting('recordKeeper_userName', syncData.settings.userName);
      }

      console.log(`Applied cloud sync data: ${syncData.records.length} records`);
    } catch (error) {
      console.error('Failed to apply sync data:', error);
      throw new Error('Failed to apply sync data');
    }
  }

  /**
   * Full sync: upload local data and merge with cloud data
   */
  async sync(localRecords: RecordType[]): Promise<{ success: boolean; error: string | null }> {
    try {
      // Download cloud data first
      const { data: cloudData, error: downloadError } = await this.downloadFromCloud();

      if (downloadError) {
        return { success: false, error: downloadError };
      }

      let recordsToUpload = localRecords;

      // If cloud has data, merge it
      if (cloudData && cloudData.records.length > 0) {
        // Simple merge: combine and deduplicate by ID
        const mergedRecords = [...localRecords];
        const localIds = new Set(localRecords.map(r => r.id));

        for (const cloudRecord of cloudData.records) {
          if (!localIds.has(cloudRecord.id)) {
            mergedRecords.push(cloudRecord);
          }
        }

        // Apply merged data locally
        await indexedDBStorage.saveRecords(mergedRecords);
        recordsToUpload = mergedRecords;
      }

      // Upload to cloud
      const { success, error: uploadError } = await this.uploadToCloud(recordsToUpload);

      if (!success) {
        return { success: false, error: uploadError };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, error: 'Sync failed' };
    }
  }
}

export const cloudSyncService = new CloudSyncService();
