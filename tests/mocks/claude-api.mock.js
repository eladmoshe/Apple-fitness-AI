import { vi } from 'vitest'

export class MockClaudeAPI {
  constructor(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Valid API key required')
    }
    this.apiKey = apiKey
    this.baseURL = 'https://api.anthropic.com/v1/messages'
  }

  async analyzeScreenshots(image1, image2) {
    if (!image1 || !image2) {
      throw new Error('Both images required')
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
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
  }

  async generateInsights(workoutData, workoutHistory) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))

    return {
      performanceInsights: [
        `Your average heart rate of ${workoutData.avgHeartRate} BPM indicates excellent cardiovascular engagement.`,
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
  }
}

export const createMockClaudeAPI = (apiKey = 'sk-ant-test-key') => {
  return new MockClaudeAPI(apiKey)
}