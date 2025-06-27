import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockImageStorage, createMockImageStorage } from '../mocks/image-storage.mock.js'

describe('ImageStorage', () => {
  let imageStorage

  beforeEach(() => {
    imageStorage = createMockImageStorage()
  })

  describe('Constructor', () => {
    it('should initialize with correct default values', () => {
      expect(imageStorage.dbName).toBe('FitnessAppImages')
      expect(imageStorage.version).toBe(1)
      expect(imageStorage.storeName).toBe('screenshots')
      expect(imageStorage.db).toBeNull()
    })
  })

  describe('init', () => {
    it('should successfully initialize database', async () => {
      const result = await imageStorage.init()
      
      expect(result).toEqual({ connected: true })
      expect(imageStorage.db).toEqual({ connected: true })
    })
  })

  describe('storeImages', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should store images successfully', async () => {
      const workoutId = 12345
      const image1 = 'data:image/jpeg;base64,image1data'
      const image2 = 'data:image/jpeg;base64,image2data'

      const result = await imageStorage.storeImages(workoutId, image1, image2)
      
      expect(result).toBe('success')
      
      // Verify images are stored
      const storedImages = await imageStorage.getImages(workoutId)
      expect(storedImages).toEqual({
        image1: image1,
        image2: image2
      })
    })

    it('should handle multiple workouts', async () => {
      await imageStorage.storeImages(123, 'image1_123', 'image2_123')
      await imageStorage.storeImages(456, 'image1_456', 'image2_456')
      
      const images123 = await imageStorage.getImages(123)
      const images456 = await imageStorage.getImages(456)
      
      expect(images123.image1).toBe('image1_123')
      expect(images456.image1).toBe('image1_456')
    })

    it('should update existing workout images', async () => {
      const workoutId = 12345
      
      await imageStorage.storeImages(workoutId, 'old_image1', 'old_image2')
      await imageStorage.storeImages(workoutId, 'new_image1', 'new_image2')
      
      const storedImages = await imageStorage.getImages(workoutId)
      expect(storedImages).toEqual({
        image1: 'new_image1',
        image2: 'new_image2'
      })
    })
  })

  describe('getImages', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should retrieve stored images', async () => {
      const workoutId = 12345
      const image1 = 'data:image/jpeg;base64,test1'
      const image2 = 'data:image/jpeg;base64,test2'
      
      await imageStorage.storeImages(workoutId, image1, image2)
      const result = await imageStorage.getImages(workoutId)
      
      expect(result).toEqual({
        image1: image1,
        image2: image2
      })
    })

    it('should return null for non-existent workout', async () => {
      const result = await imageStorage.getImages(99999)
      expect(result).toBeNull()
    })
  })

  describe('deleteImages', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should delete existing images', async () => {
      const workoutId = 12345
      
      await imageStorage.storeImages(workoutId, 'image1', 'image2')
      const deleteResult = await imageStorage.deleteImages(workoutId)
      
      expect(deleteResult).toBe('success')
      
      // Verify images are deleted
      const retrievedImages = await imageStorage.getImages(workoutId)
      expect(retrievedImages).toBeNull()
    })

    it('should handle deletion of non-existent workout', async () => {
      const result = await imageStorage.deleteImages(99999)
      expect(result).toBe('not_found')
    })
  })

  describe('getAllWorkoutIds', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should return all workout IDs', async () => {
      await imageStorage.storeImages(123, 'img1', 'img2')
      await imageStorage.storeImages(456, 'img3', 'img4')
      await imageStorage.storeImages(789, 'img5', 'img6')
      
      const workoutIds = await imageStorage.getAllWorkoutIds()
      
      expect(workoutIds).toContain('123')
      expect(workoutIds).toContain('456')
      expect(workoutIds).toContain('789')
      expect(workoutIds).toHaveLength(3)
    })

    it('should return empty array when no workouts stored', async () => {
      const workoutIds = await imageStorage.getAllWorkoutIds()
      expect(workoutIds).toEqual([])
    })
  })

  describe('getStorageUsage', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should calculate storage usage correctly', async () => {
      await imageStorage.storeImages(123, 'abcd', 'efgh') // 8 bytes total
      await imageStorage.storeImages(456, 'ijkl', 'mnop') // 8 bytes total
      
      const usage = await imageStorage.getStorageUsage()
      
      expect(usage.totalSize).toBe(16) // 8 + 8 bytes
      expect(usage.totalSizeMB).toBe('0.00') // Very small size
      expect(usage.imageCount).toBe(2)
    })

    it('should handle empty storage', async () => {
      const usage = await imageStorage.getStorageUsage()
      
      expect(usage.totalSize).toBe(0)
      expect(usage.totalSizeMB).toBe('0.00')
      expect(usage.imageCount).toBe(0)
    })
  })

  describe('clearAllImages', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should clear all stored images', async () => {
      // Store some images
      await imageStorage.storeImages(123, 'img1', 'img2')
      await imageStorage.storeImages(456, 'img3', 'img4')
      
      // Clear all
      const result = await imageStorage.clearAllImages()
      expect(result).toBe('success')
      
      // Verify cleared
      const workoutIds = await imageStorage.getAllWorkoutIds()
      expect(workoutIds).toEqual([])
      
      const usage = await imageStorage.getStorageUsage()
      expect(usage.imageCount).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await imageStorage.init()
    })

    it('should handle storing null images', async () => {
      const result = await imageStorage.storeImages(123, null, null)
      expect(result).toBe('success')
      
      const retrieved = await imageStorage.getImages(123)
      expect(retrieved).toEqual({
        image1: null,
        image2: null
      })
    })

    it('should handle very large workout IDs', async () => {
      const largeId = 999999999999
      await imageStorage.storeImages(largeId, 'img1', 'img2')
      
      const retrieved = await imageStorage.getImages(largeId)
      expect(retrieved).toEqual({
        image1: 'img1',
        image2: 'img2'
      })
    })

    it('should handle string workout IDs', async () => {
      const stringId = 'string-workout-id'
      await imageStorage.storeImages(stringId, 'img1', 'img2')
      
      const retrieved = await imageStorage.getImages(stringId)
      expect(retrieved).toEqual({
        image1: 'img1',
        image2: 'img2'
      })
    })
  })
})