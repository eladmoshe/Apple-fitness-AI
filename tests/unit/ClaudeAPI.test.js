import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockClaudeAPI, createMockClaudeAPI } from '../mocks/claude-api.mock.js'

describe('ClaudeAPI', () => {
  let claudeAPI
  const testApiKey = 'sk-ant-test-key-12345'

  beforeEach(() => {
    claudeAPI = createMockClaudeAPI(testApiKey)
  })

  describe('Constructor', () => {
    it('should initialize with correct API key and base URL', () => {
      expect(claudeAPI.apiKey).toBe(testApiKey)
      expect(claudeAPI.baseURL).toBe('https://api.anthropic.com/v1/messages')
    })

    it('should throw error with invalid API key', () => {
      expect(() => new MockClaudeAPI('')).toThrow('Valid API key required')
      expect(() => new MockClaudeAPI(null)).toThrow('Valid API key required')
    })
  })

  describe('analyzeScreenshots', () => {
    const mockImage1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/'
    const mockImage2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/'

    it('should return valid workout data structure', async () => {
      const result = await claudeAPI.analyzeScreenshots(mockImage1, mockImage2)
      
      expect(result).toHaveProperty('workoutType')
      expect(result).toHaveProperty('date')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('avgHeartRate')
      expect(result).toHaveProperty('maxHeartRate')
      expect(result).toHaveProperty('totalCalories')
      expect(result).toHaveProperty('activeCalories')
      expect(result).toHaveProperty('heartRateZones')
      expect(result).toHaveProperty('heartRateRanges')
      expect(result).toHaveProperty('postWorkoutHeartRate')
      
      expect(typeof result.avgHeartRate).toBe('number')
      expect(typeof result.totalCalories).toBe('number')
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
    })

    it('should require both images', async () => {
      await expect(claudeAPI.analyzeScreenshots(null, mockImage2))
        .rejects.toThrow('Both images required')
      
      await expect(claudeAPI.analyzeScreenshots(mockImage1, null))
        .rejects.toThrow('Both images required')
    })

    it('should simulate async operation', async () => {
      const startTime = Date.now()
      await claudeAPI.analyzeScreenshots(mockImage1, mockImage2)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(90) // ~100ms delay
    })
  })

  describe('generateInsights', () => {
    const mockWorkoutData = {
      workoutType: "Test Workout",
      avgHeartRate: 140,
      totalCalories: 400
    }

    const mockHistory = [
      { data: { avgHeartRate: 135, totalCalories: 380 } },
      { data: { avgHeartRate: 145, totalCalories: 420 } }
    ]

    it('should return valid insights structure', async () => {
      const result = await claudeAPI.generateInsights(mockWorkoutData, mockHistory)
      
      expect(result).toHaveProperty('performanceInsights')
      expect(result).toHaveProperty('trends')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('comparisons')
      
      expect(Array.isArray(result.performanceInsights)).toBe(true)
      expect(Array.isArray(result.trends)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(Array.isArray(result.comparisons)).toBe(true)
      
      expect(result.performanceInsights.length).toBeGreaterThan(0)
      expect(result.trends.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.comparisons.length).toBeGreaterThan(0)
    })

    it('should include workout data in insights', async () => {
      const result = await claudeAPI.generateInsights(mockWorkoutData, mockHistory)
      
      const insightText = result.performanceInsights.join(' ')
      expect(insightText).toContain(mockWorkoutData.avgHeartRate.toString())
    })

    it('should handle empty workout history', async () => {
      const result = await claudeAPI.generateInsights(mockWorkoutData, [])
      
      expect(result).toHaveProperty('performanceInsights')
      expect(result.performanceInsights.length).toBeGreaterThan(0)
    })

    it('should simulate async operation', async () => {
      const startTime = Date.now()
      await claudeAPI.generateInsights(mockWorkoutData, mockHistory)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(90) // ~100ms delay
    })
  })
})