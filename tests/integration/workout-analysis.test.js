import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockFitnessAnalyzer, createMockFitnessAnalyzer } from '../mocks/fitness-analyzer.mock.js'

// Mock data for testing
const mockWorkoutData = {
  workoutType: 'Functional Strength Training',
  date: '2024-01-15',
  duration: '45:30',
  avgHeartRate: 142,
  maxHeartRate: 168,
  totalCalories: 480,
  activeCalories: 365,
  heartRateZones: {
    'Zone 1 (60-70%)': '5:20',
    'Zone 2 (70-80%)': '15:40',
    'Zone 3 (80-90%)': '20:30',
    'Zone 4 (90-95%)': '4:00'
  },
  heartRateRanges: {
    below60: '0:00',
    zone1: '5:20',
    zone2: '15:40', 
    zone3: '20:30',
    zone4: '4:00',
    zone5: '0:00'
  },
  postWorkoutHeartRate: 95
}

const mockInsights = {
  performanceInsights: [
    'Your average heart rate of 142 BPM indicates a solid cardiovascular effort.',
    'You spent most time in Zone 3, showing good intensity control.'
  ],
  trends: [
    'Heart rate recovery improved compared to previous workouts.',
    'Consistent calorie burn rate maintained.'
  ],
  recommendations: [
    'Consider extending Zone 4 intervals for improved fitness.',
    'Add recovery periods between high-intensity segments.'
  ],
  comparisons: [
    'Average heart rate 5 BPM higher than last workout.',
    'Duration increased by 3 minutes compared to previous session.'
  ]
}

const createMockFile = (name, type = 'image/jpeg') => {
  return new File(['mock content'], name, { type })
}

const createMockFileReader = (result) => {
  return {
    readAsDataURL: vi.fn(),
    onload: null,
    result: result
  }
}

describe('Workout Analysis Integration', () => {
  let analyzer

  beforeEach(async () => {
    // Setup complete DOM
    document.body.innerHTML = `
      <div class="container">
        <div class="upload-section">
          <div class="upload-grid">
            <div class="upload-slot">
              <div class="upload-area" id="uploadArea1">
                <input type="file" id="fileInput1" accept="image/*" />
              </div>
              <img id="screenshotPreview1" style="display: none" />
              <div class="upload-status" id="status1">❌ Not uploaded</div>
            </div>
            <div class="upload-slot">
              <div class="upload-area" id="uploadArea2">
                <input type="file" id="fileInput2" accept="image/*" />
              </div>
              <img id="screenshotPreview2" style="display: none" />
              <div class="upload-status" id="status2">❌ Not uploaded</div>
            </div>
          </div>
          <button id="analyzeBtn" disabled>Analyze Workout</button>
        </div>
        
        <div id="loadingSection" style="display: none"></div>
        <div id="errorSection" style="display: none"></div>
        
        <div id="resultsSection" style="display: none">
          <h2>Current Workout Analysis</h2>
          <div class="results-grid">
            <div class="metric-card">
              <div class="metric-value" id="workoutTime">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="avgHeartRate">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="totalCalories">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="activeCalories">--</div>
            </div>
          </div>
          <div id="heartRateZones"></div>
          <div id="insightsContainer"></div>
        </div>
        
        <div class="history-section">
          <div id="historyContainer"></div>
        </div>
      </div>
    `

    // Mock successful API key
    localStorage.getItem.mockReturnValue('sk-ant-test-key-12345')
    
    analyzer = createMockFitnessAnalyzer()
  })

  describe('Complete Workout Analysis Flow', () => {
    it('should complete full analysis workflow successfully', async () => {
      // Step 1: Upload first image
      const file1 = createMockFile('heart-rate.jpg')
      analyzer.processFile(file1, 1)
      
      expect(analyzer.uploadedImages).toHaveLength(1)
      expect(analyzer.uploadedImages[0].name).toBe('heart-rate.jpg')

      // Step 2: Upload second image
      const file2 = createMockFile('summary.jpg')
      analyzer.processFile(file2, 2)
      
      expect(analyzer.uploadedImages).toHaveLength(2)
      expect(analyzer.uploadedImages[1].name).toBe('summary.jpg')

      // Step 3: Check analyze button is enabled
      expect(document.getElementById('analyzeBtn').disabled).toBe(false)
      expect(document.getElementById('analyzeBtn').textContent).toBe('Analyze Workout (2 images)')

      // Step 4: Trigger analysis (mock API will return mock data)
      await analyzer.analyzeScreenshots()

      // Step 5: Verify results
      expect(analyzer.workouts).toHaveLength(1)
      expect(document.getElementById('workoutTime').textContent).toBe('45:30')
      expect(document.getElementById('avgHeartRate').textContent).toBe('142 BPM')
      expect(document.getElementById('resultsSection').style.display).toBe('block')

      // Step 6: Verify workout saved
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fitnessWorkouts',
        expect.stringContaining('"workoutType":"Functional Strength Training"')
      )
    })

    it('should handle API failures gracefully', async () => {
      // Upload both images
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]

      // Mock API failure
      analyzer.claudeAPI.analyzeScreenshots = vi.fn().mockRejectedValue(new Error('API Error'))

      await expect(analyzer.analyzeScreenshots()).rejects.toThrow()
      
      expect(document.getElementById('errorSection').style.display).toBe('block')
      expect(analyzer.workouts).toHaveLength(0)
    })

    it('should prevent analysis without API key', async () => {
      analyzer.claudeAPI = null
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]

      await expect(analyzer.analyzeScreenshots()).rejects.toThrow('Claude API key is required')
      
      // Button should be disabled
      analyzer.checkAnalyzeButton()
      expect(document.getElementById('analyzeBtn').disabled).toBe(true)
      expect(document.getElementById('analyzeBtn').textContent).toBe('⚠️ Claude API Key Required')
    })
  })

  describe('Workout History Integration', () => {
    beforeEach(() => {
      // Add some existing workouts
      analyzer.workouts = [
        {
          id: 1640995200000,
          timestamp: '2024-01-10T10:00:00Z',
          data: { ...mockWorkoutData, date: '2024-01-10' },
          insights: mockInsights
        },
        {
          id: 1641081600000,
          timestamp: '2024-01-11T10:00:00Z',
          data: { ...mockWorkoutData, date: '2024-01-11', avgHeartRate: 150 },
          insights: mockInsights
        }
      ]
    })

    it('should display workout history correctly', () => {
      analyzer.renderWorkoutHistory()
      
      const historyItems = document.querySelectorAll('.workout-history-item')
      expect(historyItems).toHaveLength(2)
      
      // Check reverse chronological order (newest first)
      const firstItem = historyItems[0]
      expect(firstItem.textContent).toContain('1/11/2024')
      expect(firstItem.textContent).toContain('150 BPM')
    })

    it('should load historical workout when clicked', async () => {
      // Mock image storage
      analyzer.imageStorage.getImages = vi.fn().mockResolvedValue({
        image1: 'data:image/jpeg;base64,historical1',
        image2: 'data:image/jpeg;base64,historical2'
      })

      analyzer.renderWorkoutHistory()
      
      const workout = analyzer.workouts[0]
      await analyzer.loadWorkoutData(workout)
      
      // Check data loaded
      expect(document.getElementById('workoutTime').textContent).toBe('45:30')
      expect(document.getElementById('avgHeartRate').textContent).toBe('142 BPM')
      
      // Check title updated
      const resultsTitle = document.querySelector('#resultsSection h2')
      expect(resultsTitle.textContent).toContain('Workout Analysis -')
      
      // Check reset button added
      expect(document.getElementById('resetToCurrentBtn')).toBeTruthy()
    })

    it('should delete workout successfully', async () => {
      // Mock image storage
      analyzer.imageStorage.deleteImages = vi.fn().mockResolvedValue('success')
      
      const initialCount = analyzer.workouts.length
      const workoutToDelete = analyzer.workouts[0].id
      
      await analyzer.deleteWorkout(workoutToDelete)
      
      expect(analyzer.workouts).toHaveLength(initialCount - 1)
      expect(analyzer.imageStorage.deleteImages).toHaveBeenCalledWith(workoutToDelete)
      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Storage Integration', () => {
    it('should handle storage operations correctly', async () => {
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]

      // Mock successful image storage
      analyzer.imageStorage.storeImages = vi.fn().mockResolvedValue('success')

      await analyzer.saveWorkout(mockWorkoutData, mockInsights)

      // Check image storage called
      expect(analyzer.imageStorage.storeImages).toHaveBeenCalledWith(
        expect.any(Number),
        'data:image/jpeg;base64,test1',
        'data:image/jpeg;base64,test2'
      )

      // Check localStorage updated
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fitnessWorkouts',
        expect.stringContaining(mockWorkoutData.workoutType)
      )
    })

    it('should handle duplicate workout detection', async () => {
      // Add existing workout
      analyzer.workouts = [{
        id: 12345,
        data: mockWorkoutData,
        insights: mockInsights
      }]

      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,new1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,new2' }
      ]

      analyzer.imageStorage.storeImages = vi.fn().mockResolvedValue('success')

      const updatedData = { ...mockWorkoutData, avgHeartRate: 160 }
      await analyzer.saveWorkout(updatedData, mockInsights)

      // Should update existing workout, not add new one
      expect(analyzer.workouts).toHaveLength(1)
      expect(analyzer.workouts[0].data.avgHeartRate).toBe(160)
    })
  })

  describe('Error Recovery Integration', () => {
    it('should recover from storage failures', async () => {
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]

      // Mock image storage failure
      analyzer.imageStorage.storeImages = vi.fn().mockRejectedValue(new Error('Storage failed'))

      // Should still save workout data
      await analyzer.saveWorkout(mockWorkoutData, mockInsights)

      expect(analyzer.workouts).toHaveLength(1)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should handle missing images gracefully', async () => {
      analyzer.imageStorage.getImages = vi.fn().mockResolvedValue(null)

      const workout = {
        id: 12345,
        data: mockWorkoutData,
        insights: mockInsights
      }

      // Should not throw error
      await expect(analyzer.loadWorkoutData(workout)).resolves.toBeUndefined()
    })
  })

  describe('UI State Management Integration', () => {
    it('should maintain consistent UI state throughout workflow', () => {
      // Initial state
      expect(document.getElementById('analyzeBtn').disabled).toBe(true)
      expect(document.getElementById('resultsSection').style.display).toBe('none')

      // After uploading one image
      analyzer.uploadedImages = [{ id: 1, dataUrl: 'data:image/jpeg;base64,test1' }]
      analyzer.checkAnalyzeButton()
      
      expect(document.getElementById('analyzeBtn').disabled).toBe(true)
      expect(document.getElementById('analyzeBtn').textContent).toBe('Upload 1 more screenshot')

      // After uploading both images
      analyzer.uploadedImages = [
        { id: 1, dataUrl: 'data:image/jpeg;base64,test1' },
        { id: 2, dataUrl: 'data:image/jpeg;base64,test2' }
      ]
      analyzer.checkAnalyzeButton()
      
      expect(document.getElementById('analyzeBtn').disabled).toBe(false)
      expect(document.getElementById('analyzeBtn').textContent).toBe('Analyze Workout (2 images)')

      // After analysis
      analyzer.displayResults(mockWorkoutData, mockInsights)
      expect(document.getElementById('resultsSection').style.display).toBe('block')

      // After reset
      analyzer.resetUploadAreas()
      expect(analyzer.uploadedImages).toEqual([])
      expect(document.getElementById('analyzeBtn').disabled).toBe(true)
    })
  })
})