import { vi } from 'vitest'

export class MockImageStorage {
  constructor() {
    this.dbName = 'FitnessAppImages'
    this.version = 1
    this.storeName = 'screenshots'
    this.db = null
    this.storage = new Map() // In-memory storage for testing
  }

  async init() {
    this.db = { connected: true }
    return this.db
  }

  async storeImages(workoutId, image1, image2) {
    const key = `workout_${workoutId}`
    this.storage.set(key, {
      id: key,
      workoutId: workoutId,
      image1: image1,
      image2: image2,
      timestamp: new Date().toISOString()
    })
    return 'success'
  }

  async getImages(workoutId) {
    const key = `workout_${workoutId}`
    const data = this.storage.get(key)
    
    if (data) {
      return {
        image1: data.image1,
        image2: data.image2
      }
    }
    return null
  }

  async deleteImages(workoutId) {
    const key = `workout_${workoutId}`
    const existed = this.storage.has(key)
    this.storage.delete(key)
    return existed ? 'success' : 'not_found'
  }

  async getAllWorkoutIds() {
    const keys = Array.from(this.storage.keys())
    return keys.map(key => key.replace('workout_', ''))
  }

  async getStorageUsage() {
    let totalSize = 0
    for (const data of this.storage.values()) {
      if (data.image1) totalSize += data.image1.length
      if (data.image2) totalSize += data.image2.length
    }
    
    return {
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      imageCount: this.storage.size
    }
  }

  async clearAllImages() {
    this.storage.clear()
    return 'success'
  }
}

export const createMockImageStorage = () => {
  return new MockImageStorage()
}