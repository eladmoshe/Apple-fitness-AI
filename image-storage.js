class ImageStorage {
    constructor() {
        this.dbName = 'FitnessAppImages';
        this.version = 1;
        this.storeName = 'screenshots';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for screenshots
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('workoutId', 'workoutId', { unique: false });
                    console.log('IndexedDB object store created');
                }
            };
        });
    }

    async storeImages(workoutId, image1, image2) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const imageData = {
            id: `workout_${workoutId}`,
            workoutId: workoutId,
            image1: image1,
            image2: image2,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(imageData);
            
            request.onsuccess = () => {
                console.log('Images stored successfully for workout:', workoutId);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Failed to store images:', request.error);
                reject(request.error);
            };
        });
    }

    async getImages(workoutId) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);

        return new Promise((resolve, reject) => {
            const request = store.get(`workout_${workoutId}`);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    resolve({
                        image1: result.image1,
                        image2: result.image2
                    });
                } else {
                    console.log('No images found for workout:', workoutId);
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                console.error('Failed to retrieve images:', request.error);
                reject(request.error);
            };
        });
    }

    async deleteImages(workoutId) {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        return new Promise((resolve, reject) => {
            const request = store.delete(`workout_${workoutId}`);
            
            request.onsuccess = () => {
                console.log('Images deleted successfully for workout:', workoutId);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Failed to delete images:', request.error);
                reject(request.error);
            };
        });
    }

    async getAllWorkoutIds() {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAllKeys();
            
            request.onsuccess = () => {
                const workoutIds = request.result.map(key => key.replace('workout_', ''));
                resolve(workoutIds);
            };
            
            request.onerror = () => {
                console.error('Failed to get workout IDs:', request.error);
                reject(request.error);
            };
        });
    }

    async getStorageUsage() {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allImages = request.result;
                let totalSize = 0;
                
                allImages.forEach(imageData => {
                    if (imageData.image1) {
                        totalSize += imageData.image1.length;
                    }
                    if (imageData.image2) {
                        totalSize += imageData.image2.length;
                    }
                });
                
                resolve({
                    totalSize: totalSize,
                    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
                    imageCount: allImages.length
                });
            };
            
            request.onerror = () => {
                console.error('Failed to calculate storage usage:', request.error);
                reject(request.error);
            };
        });
    }

    async clearAllImages() {
        if (!this.db) {
            await this.init();
        }

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        return new Promise((resolve, reject) => {
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('All images cleared from IndexedDB');
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Failed to clear images:', request.error);
                reject(request.error);
            };
        });
    }
}