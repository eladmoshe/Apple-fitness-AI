// Test setup file
import { vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
}

// Mock fetch for Claude API calls
global.fetch = vi.fn()

// Setup DOM environment
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks()
  
  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
  
  // Setup IndexedDB mock
  Object.defineProperty(window, 'indexedDB', {
    value: indexedDBMock,
    writable: true
  })
  
  // Setup basic DOM
  document.body.innerHTML = ''
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = ''
  
  // Restore console methods
  vi.restoreAllMocks()
})

// Global test utilities
global.createMockFile = (name = 'test.jpg', type = 'image/jpeg', content = 'fake-image-data') => {
  const blob = new Blob([content], { type })
  blob.name = name
  return blob
}

global.createMockFileReader = (result) => {
  return {
    readAsDataURL: vi.fn((file) => {
      setTimeout(() => {
        this.result = result || `data:${file.type};base64,${btoa('fake-image-data')}`
        if (this.onload) this.onload({ target: { result: this.result } })
      }, 0)
    }),
    result: null,
    onload: null,
    onerror: null
  }
}

global.mockWorkoutData = {
  workoutType: "Functional Strength Training",
  date: "2024-01-15",
  duration: "45:30",
  avgHeartRate: 142,
  maxHeartRate: 178,
  totalCalories: 480,
  activeCalories: 365,
  heartRateZones: {
    zone1: "08:15",
    zone2: "12:30",
    zone3: "18:45",
    zone4: "05:20",
    zone5: "00:40"
  },
  heartRateRanges: {
    zone1: "<120 BPM",
    zone2: "120-140 BPM",
    zone3: "141-160 BPM",
    zone4: "161-175 BPM",
    zone5: "176+ BPM"
  },
  postWorkoutHeartRate: {
    immediate: 165,
    "1minute": 98,
    "2minute": 85
  },
  location: "Home Gym",
  effort: "Moderate to High"
}

global.mockInsights = {
  performanceInsights: [
    "Your average heart rate of 142 BPM indicates excellent cardiovascular engagement.",
    "Strong recovery with heart rate dropping to 98 BPM within 1 minute."
  ],
  trends: [
    "Your strength training sessions maintain consistent intensity.",
    "Recovery times have improved by 15% over the last month."
  ],
  recommendations: [
    "Consider adding 2-3 minutes of high-intensity intervals.",
    "Try incorporating longer warm-up periods."
  ],
  comparisons: [
    "This workout burned 12% more calories than your average.",
    "Heart rate zones were well-distributed compared to typical sessions."
  ]
}