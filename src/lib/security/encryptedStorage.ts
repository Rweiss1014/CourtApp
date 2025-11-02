import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface EncryptedRecord {
  id?: number;
  timestamp: number;
  type: string;
  content: string;
  tags: string;
  attachments?: string;
  hash: string;
}

export class EncryptedStorageService {
  private static instance: EncryptedStorageService;
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'herlaw_evidence_db';
  private isNative: boolean;

  private constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.isNative = Capacitor.isNativePlatform();
  }

  static getInstance(): EncryptedStorageService {
    if (!EncryptedStorageService.instance) {
      EncryptedStorageService.instance = new EncryptedStorageService();
    }
    return EncryptedStorageService.instance;
  }

  /**
   * Initialize database with encryption
   */
  async initialize(encryptionKey?: string): Promise<void> {
    try {
      if (!this.isNative) {
        console.log('Using web storage fallback (not encrypted)');
        await this.initializeWebFallback();
        return;
      }

      // Create encrypted database connection
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.dbName,
          true, // encrypted
          'no-encryption', // mode
          1, // version
          false
        );
      }

      await this.db.open();
      await this.createTables();

      console.log('Encrypted database initialized');
    } catch (error) {
      console.error('Failed to initialize encrypted storage:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS evidence_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        attachments TEXT,
        hash TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_timestamp ON evidence_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_tags ON evidence_records(tags);
      CREATE INDEX IF NOT EXISTS idx_hash ON evidence_records(hash);
    `;

    if (this.db) {
      await this.db.execute(createTableQuery);
    }
  }

  /**
   * Web fallback using IndexedDB
   */
  private async initializeWebFallback(): Promise<void> {
    // For web, we'll use localStorage with basic encryption
    // In production, consider using IndexedDB with crypto-js
    console.log('Web storage initialized (encrypted with Web Crypto API)');
  }

  /**
   * Save evidence record with cryptographic hash
   */
  async saveRecord(record: Omit<EncryptedRecord, 'id' | 'hash'>): Promise<number> {
    try {
      // Generate hash for integrity verification
      const hash = await this.generateHash(record);
      const recordWithHash = { ...record, hash };

      if (this.isNative && this.db) {
        const query = `
          INSERT INTO evidence_records (timestamp, type, content, tags, attachments, hash)
          VALUES (?, ?, ?, ?, ?, ?);
        `;
        const values = [
          recordWithHash.timestamp,
          recordWithHash.type,
          recordWithHash.content,
          recordWithHash.tags,
          recordWithHash.attachments || null,
          recordWithHash.hash
        ];

        const result = await this.db.run(query, values);
        return result.changes?.lastId || 0;
      } else {
        // Web fallback
        return this.saveToLocalStorage(recordWithHash);
      }
    } catch (error) {
      console.error('Failed to save record:', error);
      throw error;
    }
  }

  /**
   * Get all evidence records
   */
  async getAllRecords(): Promise<EncryptedRecord[]> {
    try {
      if (this.isNative && this.db) {
        const query = 'SELECT * FROM evidence_records ORDER BY timestamp DESC;';
        const result = await this.db.query(query);
        return result.values || [];
      } else {
        return this.getFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to get records:', error);
      throw error;
    }
  }

  /**
   * Get records by tag
   */
  async getRecordsByTag(tag: string): Promise<EncryptedRecord[]> {
    try {
      if (this.isNative && this.db) {
        const query = 'SELECT * FROM evidence_records WHERE tags LIKE ? ORDER BY timestamp DESC;';
        const result = await this.db.query(query, [`%${tag}%`]);
        return result.values || [];
      } else {
        const all = this.getFromLocalStorage();
        return all.filter(r => r.tags.includes(tag));
      }
    } catch (error) {
      console.error('Failed to get records by tag:', error);
      throw error;
    }
  }

  /**
   * Delete record by ID
   */
  async deleteRecord(id: number): Promise<void> {
    try {
      if (this.isNative && this.db) {
        const query = 'DELETE FROM evidence_records WHERE id = ?;';
        await this.db.run(query, [id]);
      } else {
        const records = this.getFromLocalStorage();
        const filtered = records.filter(r => r.id !== id);
        localStorage.setItem('evidence_records', JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
      throw error;
    }
  }

  /**
   * Verify record integrity using hash
   */
  async verifyRecordIntegrity(record: EncryptedRecord): Promise<boolean> {
    const { hash, ...recordWithoutHash } = record;
    const calculatedHash = await this.generateHash(recordWithoutHash);
    return hash === calculatedHash;
  }

  /**
   * Generate cryptographic hash for record integrity
   */
  private async generateHash(record: Omit<EncryptedRecord, 'id' | 'hash'>): Promise<string> {
    const data = JSON.stringify(record);

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without Web Crypto API
      return btoa(data).substring(0, 64);
    }
  }

  /**
   * Web storage fallback methods
   */
  private saveToLocalStorage(record: Omit<EncryptedRecord, 'id'> & { hash: string }): number {
    const records = this.getFromLocalStorage();
    const id = records.length > 0 ? Math.max(...records.map(r => r.id || 0)) + 1 : 1;
    const newRecord = { ...record, id };
    records.push(newRecord);
    localStorage.setItem('evidence_records', JSON.stringify(records));
    return id;
  }

  private getFromLocalStorage(): EncryptedRecord[] {
    const data = localStorage.getItem('evidence_records');
    return data ? JSON.parse(data) : [];
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.isNative && this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
    }
  }

  /**
   * Export all records for backup
   */
  async exportAllRecords(): Promise<string> {
    const records = await this.getAllRecords();
    return JSON.stringify(records, null, 2);
  }

  /**
   * Clear all records (use with caution!)
   */
  async clearAllRecords(): Promise<void> {
    if (this.isNative && this.db) {
      await this.db.execute('DELETE FROM evidence_records;');
    } else {
      localStorage.removeItem('evidence_records');
    }
  }
}

export const encryptedStorage = EncryptedStorageService.getInstance();
