// offline.js

class OfflineStorage {
    constructor() {
        this.storageKey = 'campRegistryData';
    }

    // Save data to local storage
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Load data from local storage
    loadData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    // Clear data from local storage
    clearData() {
        localStorage.removeItem(this.storageKey);
    }

    // Synchronize with server (dummy implementation)
    async synchronizeWithServer(serverUrl) {
        const data = this.loadData();
        if (data) {
            try {
                const response = await fetch(serverUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                return response.json();
            } catch (error) {
                console.error('Error syncing data with server:', error);
            }
        }
    }
}

// Usage example
const storage = new OfflineStorage();
storage.saveData({ example: 'data' });
console.log(storage.loadData());
storage.clearData();
