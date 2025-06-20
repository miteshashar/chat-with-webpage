// Auto-detect environment and provide simple storage API
const isExtension = typeof chrome !== "undefined" && chrome.storage;
const isWeb = typeof window !== "undefined" && !isExtension;

class SimpleStorage {
  private db: IDBDatabase | null = null;

  async get<T>(key: string): Promise<T | null> {
    if (isExtension) {
      try {
        const result = await chrome.storage.local.get([key]);
        return result[key] || null;
      } catch (error) {
        console.error("Extension storage get failed:", error);
        return null;
      }
    }

    if (isWeb) {
      // Try extension first, fallback to IndexedDB
      try {
        const result = await this.getFromExtension<T>(key);
        if (result !== null) return result;
      } catch (error) {
        console.warn("Extension unavailable, using IndexedDB:", error);
      }
    }

    // Fallback: use IndexedDB
    return this.getFromIndexedDB<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (isExtension) {
      try {
        await chrome.storage.local.set({ [key]: value });
        return;
      } catch (error) {
        console.error("Extension storage set failed:", error);
        throw error;
      }
    }

    if (isWeb) {
      // Try extension first, fallback to IndexedDB
      try {
        await this.setToExtension(key, value);
        return;
      } catch (error) {
        console.warn("Extension unavailable, using IndexedDB:", error);
      }
    }

    // Fallback: use IndexedDB
    return this.setToIndexedDB(key, value);
  }

  async remove(key: string): Promise<void> {
    if (isExtension) {
      try {
        await chrome.storage.local.remove([key]);
        return;
      } catch (error) {
        console.error("Extension storage remove failed:", error);
        throw error;
      }
    }

    if (isWeb) {
      // Try extension first, fallback to IndexedDB
      try {
        await this.removeFromExtension(key);
        return;
      } catch (error) {
        console.warn("Extension unavailable, using IndexedDB:", error);
      }
    }

    // Fallback: use IndexedDB
    return this.removeFromIndexedDB(key);
  }

  private async getFromExtension<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "GET", key }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response?.value || null);
        }
      });
    });
  }

  private async setToExtension<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "SET", key, value }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success) {
          resolve();
        } else {
          reject(new Error("Failed to set value"));
        }
      });
    });
  }

  private async removeFromExtension(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "REMOVE", key }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.success) {
          resolve();
        } else {
          reject(new Error("Failed to remove value"));
        }
      });
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("AppStorage", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("storage")) {
          db.createObjectStore("storage");
        }
      };
    });
  }

  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["storage"], "readonly");
        const store = transaction.objectStore("storage");
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error("IndexedDB get failed:", error);
      return null;
    }
  }

  private async setToIndexedDB<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["storage"], "readwrite");
        const store = transaction.objectStore("storage");
        const request = store.put(value, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error("IndexedDB set failed:", error);
      throw error;
    }
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(["storage"], "readwrite");
        const store = transaction.objectStore("storage");
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error("IndexedDB remove failed:", error);
      throw error;
    }
  }
}

// Single instance
const storage = new SimpleStorage();

// Simple exports
export const get = <T>(key: string) => storage.get<T>(key);
export const set = <T>(key: string, value: T) => storage.set(key, value);
export const remove = (key: string) => storage.remove(key);
