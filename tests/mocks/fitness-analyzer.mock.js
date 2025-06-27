import { vi } from 'vitest'
import { MockClaudeAPI } from './claude-api.mock.js'
import { MockImageStorage } from './image-storage.mock.js'

export class MockFitnessAnalyzer {
  constructor() {
    this.workouts = []
    this.uploadedImages = [] // Changed to array for multi-file support
    this.claudeAPI = null
    this.imageStorage = new MockImageStorage()
    
    // Mock DOM elements
    this.setupMockDOM()
    
    // Initialize like the real class
    this.checkApiKey()
    this.initImageStorage()
  }

  setupMockDOM() {
    // Create mock DOM elements if they don't exist
    const elements = [
      'uploadArea', 'fileInput', 'analyzeBtn', 'filePreviewContainer', 'filePreviewGrid',
      'loadingSection', 'errorSection', 'resultsSection', 'workoutTime',
      'avgHeartRate', 'totalCalories', 'activeCalories', 'heartRateZones',
      'insightsContainer', 'historyContainer'
    ]

    elements.forEach(id => {
      if (!document.getElementById(id)) {
        let element
        if (id === 'analyzeBtn') {
          element = document.createElement('button')
          element.disabled = true
        } else {
          element = document.createElement('div')
        }
        element.id = id
        document.body.appendChild(element)
      }
    })

    // Add file count span to preview container
    const previewContainer = document.getElementById('filePreviewContainer')
    if (previewContainer && !previewContainer.querySelector('.file-count')) {
      const fileCount = document.createElement('span')
      fileCount.className = 'file-count'
      fileCount.textContent = '0 files selected'
      previewContainer.appendChild(fileCount)
    }
    
    // Add h2 to resultsSection for loadWorkoutData
    const resultsSection = document.getElementById('resultsSection')
    if (resultsSection && !resultsSection.querySelector('h2')) {
      const h2 = document.createElement('h2')
      h2.textContent = 'Workout Analysis'
      resultsSection.appendChild(h2)
    }
  }

  checkApiKey() {
    const apiKey = localStorage.getItem('claude-api-key')
    if (apiKey) {
      this.claudeAPI = new MockClaudeAPI(apiKey)
      this.checkAnalyzeButton()
    }
  }

  async initImageStorage() {
    await this.imageStorage.init()
  }

  checkAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn')
    const uploadedCount = this.uploadedImages.length
    const hasEnoughImages = uploadedCount >= 2
    const hasApiKey = !!this.claudeAPI
    
    analyzeBtn.disabled = !hasEnoughImages || !hasApiKey

    if (!hasApiKey) {
      analyzeBtn.textContent = "⚠️ Claude API Key Required"
    } else if (hasEnoughImages) {
      analyzeBtn.textContent = `Analyze Workout (${uploadedCount} images)`
    } else {
      const needed = 2 - uploadedCount
      analyzeBtn.textContent = `Upload ${needed} more screenshot${needed !== 1 ? "s" : ""}`
    }
  }

  // Legacy method for backward compatibility
  processFile(file, slotNumber) {
    if (!file.type.startsWith("image/")) {
      this.showError("Please select an image file.")
      return
    }

    const result = `data:${file.type};base64,mock-image-data-${slotNumber}`
    const imageData = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      file: file,
      dataUrl: result
    }
    
    this.uploadedImages.push(imageData)
    this.updateFilePreview(imageData)
    this.checkAnalyzeButton()
  }

  // New multi-file processing method
  processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith("image/"))
    
    if (imageFiles.length === 0) {
      this.showError("Please select at least one image file.")
      return
    }

    imageFiles.forEach(file => {
      this.processSingleFile(file)
    })
  }

  processSingleFile(file) {
    const fileId = Date.now() + Math.random()
    const imageData = {
      id: fileId,
      name: file.name,
      size: file.size,
      file: file,
      dataUrl: `data:${file.type};base64,mock-image-data-${fileId}`
    }

    this.uploadedImages.push(imageData)
    this.updateFilePreview(imageData)
    this.checkAnalyzeButton()
  }

  updateFilePreview(imageData) {
    const previewContainer = document.getElementById("filePreviewContainer")
    const previewGrid = document.getElementById("filePreviewGrid")
    
    // Show preview container
    previewContainer.style.display = "block"

    // Create new preview item
    const previewItem = document.createElement("div")
    previewItem.className = "file-preview-item"
    previewItem.id = `preview-${imageData.id}`
    previewItem.innerHTML = `
      <button class="file-preview-remove" data-file-id="${imageData.id}">×</button>
      <div class="file-preview-name">${imageData.name}</div>
    `
    previewGrid.appendChild(previewItem)

    this.updateFileCount()
  }

  updateFileCount() {
    const fileCount = document.querySelector(".file-count")
    const count = this.uploadedImages.length
    if (fileCount) {
      fileCount.textContent = `${count} file${count !== 1 ? 's' : ''} selected`
    }
  }

  removeFile(fileId) {
    const index = this.uploadedImages.findIndex(img => img.id == fileId)
    if (index !== -1) {
      this.uploadedImages.splice(index, 1)
      
      const previewItem = document.getElementById(`preview-${fileId}`)
      if (previewItem) {
        previewItem.remove()
      }

      this.updateFileCount()
      this.checkAnalyzeButton()

      // Hide preview container if no files
      if (this.uploadedImages.length === 0) {
        document.getElementById("filePreviewContainer").style.display = "none"
      }
    }
  }

  clearAllFiles() {
    this.uploadedImages = []
    document.getElementById("filePreviewContainer").style.display = "none"
    document.getElementById("filePreviewGrid").innerHTML = ""
    this.checkAnalyzeButton()
  }

  async extractWorkoutData(image1, image2) {
    if (!this.claudeAPI) {
      throw new Error('Claude API key is required. Please set up your API key to analyze screenshots.')
    }

    return await this.claudeAPI.analyzeScreenshots(image1, image2)
  }

  async generateInsights(workoutData) {
    if (!this.claudeAPI) {
      throw new Error('Claude API key is required. Please set up your API key to generate insights.')
    }

    const workoutHistory = this.workouts.slice(-5)
    return await this.claudeAPI.generateInsights(workoutData, workoutHistory)
  }

  async analyzeScreenshots() {
    if (this.uploadedImages.length < 2) {
      throw new Error("Please upload at least 2 screenshots first.")
    }

    this.showLoading(true)
    this.hideError()

    try {
      const workoutData = await this.extractWorkoutData(
        this.uploadedImages[0].dataUrl,
        this.uploadedImages[1].dataUrl
      )
      const insights = await this.generateInsights(workoutData)

      this.displayResults(workoutData, insights)
      await this.saveWorkout(workoutData, insights)
      this.renderWorkoutHistory()
      this.resetUploadAreas()
    } catch (error) {
      this.showError(`Analysis failed: ${error.message}`)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  async saveWorkout(workoutData, insights) {
    const workoutKey = `${workoutData.date}_${workoutData.workoutType}_${workoutData.duration}`
    
    const existingWorkoutIndex = this.workouts.findIndex(w => {
      const existingKey = `${w.data.date}_${w.data.workoutType}_${w.data.duration}`
      return existingKey === workoutKey
    })

    const workoutId = existingWorkoutIndex !== -1 ? this.workouts[existingWorkoutIndex].id : Date.now()

    const workout = {
      id: workoutId,
      timestamp: new Date().toISOString(),
      data: workoutData,
      insights: insights
    }

    try {
      await this.imageStorage.storeImages(
        workoutId,
        this.uploadedImages[0]?.dataUrl || null,
        this.uploadedImages[1]?.dataUrl || null
      )

      if (existingWorkoutIndex !== -1) {
        this.workouts[existingWorkoutIndex] = workout
        this.showInfo(`Updated existing workout from ${workoutData.date}`)
      } else {
        this.workouts.push(workout)
      }

      localStorage.setItem("fitnessWorkouts", JSON.stringify(this.workouts))
    } catch (error) {
      this.showError('Failed to save workout images. The workout data was saved but images may be missing.')
      
      if (existingWorkoutIndex !== -1) {
        this.workouts[existingWorkoutIndex] = workout
      } else {
        this.workouts.push(workout)
      }
      localStorage.setItem("fitnessWorkouts", JSON.stringify(this.workouts))
    }
  }

  async loadWorkoutData(workout) {
    this.displayResults(workout.data, workout.insights)
    
    const resultsTitle = document.querySelector("#resultsSection h2")
    const date = new Date(workout.timestamp).toLocaleDateString()
    resultsTitle.textContent = `Workout Analysis - ${date}`
    
    try {
      const screenshots = await this.imageStorage.getImages(workout.id)
      this.displayHistoricalScreenshots(screenshots)
    } catch (error) {
      // Ignore image loading errors in tests
    }
    
    this.addResetButton()
  }

  async deleteWorkout(workoutId) {
    const workoutIndex = this.workouts.findIndex(w => w.id === workoutId)
    
    if (workoutIndex !== -1) {
      this.workouts.splice(workoutIndex, 1)
      
      try {
        await this.imageStorage.deleteImages(workoutId)
      } catch (error) {
        // Continue with workout deletion even if image deletion fails
      }
      
      localStorage.setItem("fitnessWorkouts", JSON.stringify(this.workouts))
      this.renderWorkoutHistory()
      this.showInfo(`Workout deleted successfully`)
    }
  }

  displayResults(workoutData, insights) {
    document.getElementById("workoutTime").textContent = workoutData.duration || "--"
    document.getElementById("avgHeartRate").textContent = workoutData.avgHeartRate 
      ? `${workoutData.avgHeartRate} BPM` : "--"
    document.getElementById("totalCalories").textContent = workoutData.totalCalories 
      ? `${workoutData.totalCalories} CAL` : "--"
    document.getElementById("activeCalories").textContent = workoutData.activeCalories 
      ? `${workoutData.activeCalories} CAL` : "--"

    document.getElementById("resultsSection").style.display = "block"
  }

  displayHistoricalScreenshots(screenshots) {
    // Mock implementation for testing
  }

  renderWorkoutHistory() {
    const historyContainer = document.getElementById("historyContainer")
    
    if (this.workouts.length === 0) {
      historyContainer.innerHTML = '<div>No workout data yet.</div>'
      return
    }

    historyContainer.innerHTML = ""
    const recentWorkouts = this.workouts.slice(-10).reverse()

    recentWorkouts.forEach(workout => {
      const workoutDiv = document.createElement("div")
      workoutDiv.className = "workout-history-item clickable"
      
      const date = new Date(workout.timestamp).toLocaleDateString()
      const data = workout.data

      workoutDiv.innerHTML = `
        <div class="workout-main">
          <div>${date} - ${data.workoutType || "Workout"} • ${data.duration || "--"}</div>
          <div>${data.avgHeartRate || "--"} BPM</div>
        </div>
        <button class="delete-workout-btn" data-workout-id="${workout.id}">🗑️</button>
      `

      historyContainer.appendChild(workoutDiv)
    })
  }

  addResetButton() {
    const existingResetBtn = document.getElementById("resetToCurrentBtn")
    if (existingResetBtn) return

    const resetBtn = document.createElement("button")
    resetBtn.id = "resetToCurrentBtn"
    resetBtn.textContent = "← Back to Current Analysis"
    
    const resultsSection = document.getElementById("resultsSection")
    resultsSection.appendChild(resetBtn)
  }

  resetUploadAreas() {
    this.clearAllFiles()
    
    // Remove any upload state classes
    const uploadArea = document.getElementById("uploadArea")
    if (uploadArea) {
      uploadArea.classList.remove("uploaded", "dragover")
    }
  }

  showLoading(show) {
    document.getElementById("loadingSection").style.display = show ? "block" : "none"
  }

  showError(message) {
    const errorSection = document.getElementById("errorSection")
    errorSection.textContent = message
    errorSection.style.display = "block"
  }

  hideError() {
    document.getElementById("errorSection").style.display = "none"
  }

  showInfo(message) {
    let infoSection = document.getElementById("infoSection")
    if (!infoSection) {
      infoSection = document.createElement("div")
      infoSection.id = "infoSection"
      infoSection.style.display = "none"
      document.body.appendChild(infoSection)
    }
    
    infoSection.textContent = message
    infoSection.style.display = "block"
  }
}

export const createMockFitnessAnalyzer = () => {
  return new MockFitnessAnalyzer()
}