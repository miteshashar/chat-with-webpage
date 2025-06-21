// Simple storage API - extension first, web fallback
const isExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest;
const isWeb = typeof window !== "undefined" && !isExtension;

class SimpleStorage {
  private db: IDBDatabase | null = null;
  private changeListeners: Map<string, Set<(value: unknown) => void>> =
    new Map();

  async get<T>(key: string): Promise<T | null> {
    if (await this.shouldUseExtension()) {
      return this.getFromExtension(key);
    }
    return this.getFromIndexedDB(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (await this.shouldUseExtension()) {
      await this.setToExtension(key, value);
    } else {
      await this.setToIndexedDB(key, value);
    }

    // Notify local listeners
    this.changeListeners.get(key)?.forEach((listener) => listener(value));

    // Notify other contexts about the change
    this.notifyOtherContext(key, value);
  }

  async remove(key: string): Promise<void> {
    if (await this.shouldUseExtension()) {
      await this.removeFromExtension(key);
    } else {
      await this.removeFromIndexedDB(key);
    }

    // Notify local listeners
    this.changeListeners.get(key)?.forEach((listener) => listener(null));

    // Notify other contexts about the change
    this.notifyOtherContext(key, null);
  }

  private async shouldUseExtension(): Promise<boolean> {
    if (isExtension) return false; // Extension uses its own IndexedDB
    if (!isWeb) return false;

    const extensionId = localStorage.getItem("extension_id");
    if (!extensionId) return false;

    // Test if extension is actually available
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage(extensionId, { type: "PING" }, () => {
          if (chrome.runtime.lastError) {
            reject();
          } else {
            resolve();
          }
        });
      });
      return true;
    } catch {
      // Extension unavailable, clean up the stale ID
      localStorage.removeItem("extension_id");
      return false;
    }
  }

  private async getFromExtension<T>(key: string): Promise<T | null> {
    const extensionId = localStorage.getItem("extension_id")!; // shouldUseExtension() already verified this exists

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        extensionId,
        { type: "GET", key },
        (response) => {
          resolve(response?.value || null);
        },
      );
    });
  }

  private async setToExtension<T>(key: string, value: T): Promise<void> {
    const extensionId = localStorage.getItem("extension_id")!; // shouldUseExtension() already verified this exists

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        extensionId,
        { type: "SET", key, value },
        () => {
          resolve();
        },
      );
    });
  }

  private async removeFromExtension(key: string): Promise<void> {
    const extensionId = localStorage.getItem("extension_id")!; // shouldUseExtension() already verified this exists

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(extensionId, { type: "REMOVE", key }, () => {
        resolve();
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
    } catch {
      return null;
    }
  }

  private async setToIndexedDB<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["storage"], "readwrite");
      const store = transaction.objectStore("storage");
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["storage"], "readwrite");
      const store = transaction.objectStore("storage");
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private notifyOtherContext<T>(key: string, value: T): void {
    if (isExtension) {
      // Extension notifies web tabs
      chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "STORAGE_CHANGED",
              key,
              value,
            });
          }
        });
      });
    } else if (isWeb) {
      // Web notifies extension via content script
      window.postMessage(
        { type: "NOTIFY_EXTENSION", key, value },
        "http://localhost:5173",
      );
    }
  }

  onChange<T>(key: string, callback: (value: T | null) => void): () => void {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }
    this.changeListeners.get(key)!.add(callback as (value: unknown) => void);
    this.setupCrossContextListeners();

    return () => {
      const listeners = this.changeListeners.get(key);
      if (listeners) {
        listeners.delete(callback as (value: unknown) => void);
        if (listeners.size === 0) {
          this.changeListeners.delete(key);
        }
      }
    };
  }

  private listenersSetup = false;

  private setupCrossContextListeners(): void {
    if (this.listenersSetup) return;
    this.listenersSetup = true;

    if (isExtension) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "STORAGE_CHANGED") {
          this.changeListeners
            .get(message.key)
            ?.forEach((listener) => listener(message.value));
        }
      });
    } else if (isWeb) {
      window.addEventListener("message", (event) => {
        if (event.data?.type === "STORAGE_CHANGED") {
          this.changeListeners
            .get(event.data.key)
            ?.forEach((listener) => listener(event.data.value));
        }
      });
    }
  }
}

// Export class methods directly
const storage = new SimpleStorage();
export const get = <T>(key: string) => storage.get<T>(key);
export const set = <T>(key: string, value: T) => storage.set(key, value);
export const remove = (key: string) => storage.remove(key);
export const onChange = <T>(key: string, callback: (value: T | null) => void) =>
  storage.onChange(key, callback);
