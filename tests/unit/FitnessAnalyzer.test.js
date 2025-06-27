import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockFitnessAnalyzer, createMockFitnessAnalyzer } from '../mocks/fitness-analyzer.mock.js'

describe('FitnessAnalyzer', () => {
  let analyzer

  beforeEach(() => {
    // Clear DOM and localStorage
    document.body.innerHTML = ''
    localStorage.clear()
    
    // Mock successful API key
    localStorage.getItem.mockReturnValue('sk-ant-test-key')
    
    analyzer = createMockFitnessAnalyzer()
  })

  describe('Constructor', () => {
    it('should initialize with empty workouts and uploaded images', () => {
      expect(analyzer.workouts).toEqual([])
      expect(analyzer.uploadedImages).toEqual([])
      expect(analyzer.claudeAPI).toBeDefined()
      expect(analyzer.imageStorage).toBeDefined()
    })

    it('should create required DOM elements', () => {
      expect(document.getElementById('analyzeBtn')).toBeTruthy()
      expect(document.getElementById('uploadArea')).toBeTruthy()
      expect(document.getElementById('resultsSection')).toBeTruthy()
      expect(document.getElementById('historyContainer')).toBeTruthy()
      expect(document.getElementById('filePreviewContainer')).toBeTruthy()
    })

    it('should initialize without API key', () => {
      localStorage.getItem.mockReturnValue(null)
      
      const newAnalyzer = createMockFitnessAnalyzer()
      expect(newAnalyzer.claudeAPI).toBeNull()
    })
  })

  describe('checkAnalyzeButton', () => {
    it('should disable button when no API key', () => {
      analyzer.claudeAPI = null
      analyzer.checkAnalyzeButton()
      
      const analyzeBtn = document.getElementById('analyzeBtn')
      expect(analyzeBtn.disabled).toBe(true)
      expect(analyzeBtn.textContent).toBe('⚠️ Claude API Key Required')
    })

    it('should disable button when images missing', () => {
      analyzer.uploadedImages = [{ id: 1, dataUrl: 'data:image/jpeg;base64,test1' }]
      analyzer.checkAnalyzeButton()
      
      const analyzeBtn = document.getElementById('analyzeBtn')
      expect(analyzeBtn.disabled).toBe(true)
      expect(analyzeBtn.textContent).toBe('Upload 1 more screenshot')
    })

    it('should enable button when API key and both images present', () => {
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]
      analyzer.checkAnalyzeButton()
      
      const analyzeBtn = document.getElementById('analyzeBtn')
      expect(analyzeBtn.disabled).toBe(false)
      expect(analyzeBtn.textContent).toBe('Analyze Workout (2 images)')
    })

    it('should show correct message for multiple missing screenshots', () => {
      analyzer.uploadedImages = []
      analyzer.checkAnalyzeButton()
      
      const analyzeBtn = document.getElementById('analyzeBtn')
      expect(analyzeBtn.textContent).toBe('Upload 2 more screenshots')
    })
  })

  describe('processFile', () => {
    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const spy = vi.spyOn(analyzer, 'showError')
      
      analyzer.processFile(file, 1)
      
      expect(spy).toHaveBeenCalledWith('Please select an image file.')
    })

    it('should process image files correctly', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      analyzer.processFile(file, 1)
      
      expect(analyzer.uploadedImages).toHaveLength(1)
      expect(analyzer.uploadedImages[0].name).toBe('test.jpg')
      expect(analyzer.uploadedImages[0].dataUrl).toContain('data:image/jpeg;base64,mock-image-data')
    })

    it('should update preview and status', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      
      analyzer.processFile(file, 2)
      
      expect(analyzer.uploadedImages).toHaveLength(1)
      expect(analyzer.uploadedImages[0].name).toBe('test.png')
      expect(document.getElementById('filePreviewContainer').style.display).toBe('block')
    })
  })

  describe('extractWorkoutData', () => {
    it('should throw error when no API key', async () => {
      analyzer.claudeAPI = null
      
      await expect(analyzer.extractWorkoutData('image1', 'image2'))
        .rejects.toThrow('Claude API key is required')
    })

    it('should call Claude API when available', async () => {
      const result = await analyzer.extractWorkoutData('image1', 'image2')
      
      expect(result).toHaveProperty('workoutType')
      expect(result).toHaveProperty('avgHeartRate')
      expect(result).toHaveProperty('totalCalories')
      expect(result.workoutType).toBe('Functional Strength Training')
      expect(typeof result.avgHeartRate).toBe('number')
    })

    it('should pass through Claude API errors', async () => {
      // Mock Claude API to throw error
      analyzer.claudeAPI.analyzeScreenshots = vi.fn().mockRejectedValue(new Error('API Error'))
      
      await expect(analyzer.extractWorkoutData('image1', 'image2'))
        .rejects.toThrow('API Error')
    })
  })

  describe('generateInsights', () => {
    const mockWorkoutData = {
      workoutType: 'Test Workout',
      avgHeartRate: 140,
      totalCalories: 400
    }

    it('should throw error when no API key', async () => {
      analyzer.claudeAPI = null
      
      await expect(analyzer.generateInsights(mockWorkoutData))
        .rejects.toThrow('Claude API key is required')
    })

    it('should call Claude API for insights generation', async () => {
      analyzer.workouts = [{ data: mockWorkoutData }]
      
      const result = await analyzer.generateInsights(mockWorkoutData)
      
      expect(result).toHaveProperty('performanceInsights')
      expect(result).toHaveProperty('trends')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('comparisons')
      expect(Array.isArray(result.performanceInsights)).toBe(true)
    })

    it('should include workout history in insights call', async () => {
      const spy = vi.spyOn(analyzer.claudeAPI, 'generateInsights')
      analyzer.workouts = [{ data: mockWorkoutData }, { data: mockWorkoutData }]
      
      await analyzer.generateInsights(mockWorkoutData)
      
      expect(spy).toHaveBeenCalledWith(
        mockWorkoutData, 
        [{ data: mockWorkoutData }, { data: mockWorkoutData }]
      )
    })
  })

  describe('saveWorkout', () => {
    const mockWorkoutData = {
      workoutType: 'Test Workout',
      date: '2024-01-15',
      duration: '30:00',
      avgHeartRate: 140
    }

    const mockInsights = {
      performanceInsights: ['Test insight'],
      trends: ['Test trend'],
      recommendations: ['Test recommendation'],
      comparisons: ['Test comparison']
    }

    beforeEach(() => {
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]
    })

    it('should save new workout successfully', async () => {
      await analyzer.saveWorkout(mockWorkoutData, mockInsights)
      
      expect(analyzer.workouts).toHaveLength(1)
      expect(analyzer.workouts[0].data).toEqual(mockWorkoutData)
      expect(analyzer.workouts[0].insights).toEqual(mockInsights)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fitnessWorkouts', 
        JSON.stringify(analyzer.workouts)
      )
    })

    it('should update existing workout with same key', async () => {
      const existingWorkout = {
        id: 12345,
        data: { ...mockWorkoutData },
        insights: mockInsights
      }
      analyzer.workouts = [existingWorkout]
      
      const updatedData = { ...mockWorkoutData, avgHeartRate: 150 }
      await analyzer.saveWorkout(updatedData, mockInsights)
      
      expect(analyzer.workouts).toHaveLength(1)
      expect(analyzer.workouts[0].data.avgHeartRate).toBe(150)
    })

    it('should handle image storage errors gracefully', async () => {
      analyzer.imageStorage.storeImages = vi.fn().mockRejectedValue(new Error('Storage failed'))
      const spy = vi.spyOn(analyzer, 'showError')
      
      await analyzer.saveWorkout(mockWorkoutData, mockInsights)
      
      expect(spy).toHaveBeenCalledWith(
        'Failed to save workout images. The workout data was saved but images may be missing.'
      )
      expect(analyzer.workouts).toHaveLength(1) // Workout still saved
    })

    it('should store images in IndexedDB', async () => {
      const spy = vi.spyOn(analyzer.imageStorage, 'storeImages')
      
      await analyzer.saveWorkout(mockWorkoutData, mockInsights)
      
      expect(spy).toHaveBeenCalledWith(
        expect.any(Number),
        'data:image/jpeg;base64,test1',
        'data:image/jpeg;base64,test2'
      )
    })
  })

  describe('loadWorkoutData', () => {
    const mockWorkout = {
      id: 12345,
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        workoutType: 'Test Workout',
        avgHeartRate: 140,
        totalCalories: 400,
        duration: '30:00'
      },
      insights: {
        performanceInsights: ['Test insight']
      }
    }

    it('should load workout data and display results', async () => {
      const displaySpy = vi.spyOn(analyzer, 'displayResults')
      const addResetSpy = vi.spyOn(analyzer, 'addResetButton')
      
      await analyzer.loadWorkoutData(mockWorkout)
      
      expect(displaySpy).toHaveBeenCalledWith(mockWorkout.data, mockWorkout.insights)
      expect(addResetSpy).toHaveBeenCalled()
      
      const resultsTitle = document.querySelector('#resultsSection h2')
      expect(resultsTitle.textContent).toContain('Workout Analysis -')
    })

    it('should handle image loading errors gracefully', async () => {
      analyzer.imageStorage.getImages = vi.fn().mockRejectedValue(new Error('Image load failed'))
      
      const displaySpy = vi.spyOn(analyzer, 'displayResults')
      
      await analyzer.loadWorkoutData(mockWorkout)
      
      // Should still display results even if images fail
      expect(displaySpy).toHaveBeenCalledWith(mockWorkout.data, mockWorkout.insights)
    })

    it('should retrieve images from storage', async () => {
      const spy = vi.spyOn(analyzer.imageStorage, 'getImages')
      
      await analyzer.loadWorkoutData(mockWorkout)
      
      expect(spy).toHaveBeenCalledWith(mockWorkout.id)
    })
  })

  describe('deleteWorkout', () => {
    const mockWorkout = {
      id: 12345,
      data: { workoutType: 'Test', avgHeartRate: 140 },
      insights: {}
    }

    beforeEach(() => {
      analyzer.workouts = [mockWorkout]
    })

    it('should delete workout and images successfully', async () => {
      const renderSpy = vi.spyOn(analyzer, 'renderWorkoutHistory')
      const showInfoSpy = vi.spyOn(analyzer, 'showInfo')
      const imageDeleteSpy = vi.spyOn(analyzer.imageStorage, 'deleteImages')
      
      await analyzer.deleteWorkout(12345)
      
      expect(analyzer.workouts).toHaveLength(0)
      expect(imageDeleteSpy).toHaveBeenCalledWith(12345)
      expect(localStorage.setItem).toHaveBeenCalledWith('fitnessWorkouts', '[]')
      expect(renderSpy).toHaveBeenCalled()
      expect(showInfoSpy).toHaveBeenCalledWith('Workout deleted successfully')
    })

    it('should handle image deletion errors gracefully', async () => {
      analyzer.imageStorage.deleteImages = vi.fn().mockRejectedValue(new Error('Delete failed'))
      
      const renderSpy = vi.spyOn(analyzer, 'renderWorkoutHistory')
      
      await analyzer.deleteWorkout(12345)
      
      expect(analyzer.workouts).toHaveLength(0) // Workout still deleted
      expect(renderSpy).toHaveBeenCalled()
    })

    it('should handle non-existent workout ID', async () => {
      const initialLength = analyzer.workouts.length
      
      await analyzer.deleteWorkout(99999)
      
      expect(analyzer.workouts).toHaveLength(initialLength) // No change
    })
  })

  describe('displayResults', () => {
    const mockWorkoutData = {
      duration: '45:30',
      avgHeartRate: 142,
      totalCalories: 480,
      activeCalories: 365
    }

    const mockInsights = {
      performanceInsights: ['Insight 1', 'Insight 2']
    }

    it('should update UI with workout data', () => {
      analyzer.displayResults(mockWorkoutData, mockInsights)
      
      expect(document.getElementById('workoutTime').textContent).toBe('45:30')
      expect(document.getElementById('avgHeartRate').textContent).toBe('142 BPM')
      expect(document.getElementById('totalCalories').textContent).toBe('480 CAL')
      expect(document.getElementById('activeCalories').textContent).toBe('365 CAL')
      expect(document.getElementById('resultsSection').style.display).toBe('block')
    })

    it('should handle missing data gracefully', () => {
      const incompleteData = { workoutType: 'Test' }
      analyzer.displayResults(incompleteData, mockInsights)
      
      expect(document.getElementById('workoutTime').textContent).toBe('--')
      expect(document.getElementById('avgHeartRate').textContent).toBe('--')
      expect(document.getElementById('totalCalories').textContent).toBe('--')
      expect(document.getElementById('activeCalories').textContent).toBe('--')
    })
  })

  describe('renderWorkoutHistory', () => {
    it('should show message when no workouts exist', () => {
      analyzer.workouts = []
      analyzer.renderWorkoutHistory()
      
      const historyContainer = document.getElementById('historyContainer')
      expect(historyContainer.innerHTML).toContain('No workout data yet')
    })

    it('should render workout history items', () => {
      analyzer.workouts = [
        {
          id: 1,
          timestamp: '2024-01-15T10:00:00Z',
          data: { workoutType: 'Workout 1', duration: '30:00', avgHeartRate: 140 }
        },
        {
          id: 2,
          timestamp: '2024-01-16T10:00:00Z',
          data: { workoutType: 'Workout 2', duration: '45:00', avgHeartRate: 150 }
        }
      ]
      
      analyzer.renderWorkoutHistory()
      
      const historyItems = document.querySelectorAll('.workout-history-item')
      expect(historyItems).toHaveLength(2)
      
      // Check content
      expect(historyItems[0].textContent).toContain('Workout 2') // Newest first
      expect(historyItems[1].textContent).toContain('Workout 1')
    })

    it('should include delete buttons', () => {
      analyzer.workouts = [{
        id: 123,
        timestamp: '2024-01-15T10:00:00Z',
        data: { workoutType: 'Test', duration: '30:00', avgHeartRate: 140 }
      }]
      
      analyzer.renderWorkoutHistory()
      
      const deleteBtn = document.querySelector('.delete-workout-btn')
      expect(deleteBtn).toBeTruthy()
      expect(deleteBtn.getAttribute('data-workout-id')).toBe('123')
    })
  })

  describe('Error Handling', () => {
    it('should show error messages', () => {
      analyzer.showError('Test error message')
      
      const errorSection = document.getElementById('errorSection')
      expect(errorSection.textContent).toBe('Test error message')
      expect(errorSection.style.display).toBe('block')
    })

    it('should hide error messages', () => {
      analyzer.hideError()
      
      const errorSection = document.getElementById('errorSection')
      expect(errorSection.style.display).toBe('none')
    })

    it('should show info messages', () => {
      analyzer.showInfo('Test info message')
      
      const infoSection = document.getElementById('infoSection')
      expect(infoSection).toBeTruthy()
      expect(infoSection.textContent).toBe('Test info message')
      expect(infoSection.style.display).toBe('block')
    })
  })

  describe('UI State Management', () => {
    it('should reset upload areas correctly', () => {
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]
      
      analyzer.resetUploadAreas()
      
      expect(analyzer.uploadedImages).toEqual([])
    })

    it('should manage loading state', () => {
      analyzer.showLoading(true)
      expect(document.getElementById('loadingSection').style.display).toBe('block')
      
      analyzer.showLoading(false)
      expect(document.getElementById('loadingSection').style.display).toBe('none')
    })

    it('should add reset button only once', () => {
      analyzer.addResetButton()
      analyzer.addResetButton()
      
      const resetButtons = document.querySelectorAll('#resetToCurrentBtn')
      expect(resetButtons).toHaveLength(1)
    })
  })
})