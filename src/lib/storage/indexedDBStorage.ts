/**
 * IndexedDB Storage Service
 * Replaces localStorage with unlimited storage capacity
 * Handles images efficiently without base64 bloat
 */

import { RecordType } from '../../App';

const DB_NAME = 'HerLawDB';
const DB_VERSION = 1;
const RECORDS_STORE = 'records';
const SETTINGS_STORE = 'settings';

export class IndexedDBStorage {
  private static instance: IndexedDBStorage;
  private db: IDBDatabase | null = null;

  private constructor() {}

  static getInstance(): IndexedDBStorage {
    if (!IndexedDBStorage.instance) {
      IndexedDBStorage.instance = new IndexedDBStorage();
    }
    return IndexedDBStorage.instance;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create records store
        if (!db.objectStoreNames.contains(RECORDS_STORE)) {
          const recordsStore = db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
          recordsStore.createIndex('dateTime', 'dateTime', { unique: false });
          recordsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  /**
   * Save all records
   */
  async saveRecords(records: RecordType[]): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);

      // Clear existing records
      store.clear();

      // Add all records
      records.forEach(record => {
        store.add(record);
      });

      transaction.oncomplete = () => {
        console.log(`Saved ${records.length} records to IndexedDB`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to save records:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Get all records
   */
  async getRecords(): Promise<RecordType[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as RecordType[];
        console.log(`Retrieved ${records.length} records from IndexedDB`);
        resolve(records);
      };

      request.onerror = () => {
        console.error('Failed to get records:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add a single record
   */
  async addRecord(record: RecordType): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.add(record);

      request.onsuccess = () => {
        console.log('Record added to IndexedDB:', record.id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to add record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update a single record
   */
  async updateRecord(record: RecordType): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.put(record);

      request.onsuccess = () => {
        console.log('Record updated in IndexedDB:', record.id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to update record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a record
   */
  async deleteRecord(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Record deleted from IndexedDB:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all records
   */
  async clearRecords(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDS_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All records cleared from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear records:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save a setting
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a setting
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        console.error('Failed to get setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }

  /**
   * Migrate data from localStorage to IndexedDB
   */
  async migrateFromLocalStorage(): Promise<void> {
    console.log('Starting migration from localStorage to IndexedDB...');

    try {
      // Migrate records
      const savedRecords = localStorage.getItem('recordKeeper_records');
      if (savedRecords) {
        const records = JSON.parse(savedRecords) as RecordType[];
        await this.saveRecords(records);
        console.log(`Migrated ${records.length} records from localStorage`);
      }

      // Migrate settings
      const settingsToMigrate = [
        'recordKeeper_pin',
        'recordKeeper_decoyPin',
        'recordKeeper_lockEnabled',
        'recordKeeper_welcomeCompleted',
        'recordKeeper_userName'
      ];

      for (const key of settingsToMigrate) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          await this.saveSetting(key, value);
        }
      }

      console.log('Migration from localStorage completed successfully');

      // Optional: Clear localStorage after successful migration
      // Uncomment the lines below to remove old data after migration
      // localStorage.removeItem('recordKeeper_records');
      // settingsToMigrate.forEach(key => localStorage.removeItem(key));

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

export const indexedDBStorage = IndexedDBStorage.getInstance();
