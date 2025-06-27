// Claude API Integration for Apple Fitness Screenshot Analyzer
// This file provides the actual Claude API integration for image analysis

class ClaudeAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
    }

    async analyzeScreenshots(heartRateImage, summaryImage) {
        const prompt = `
Please analyze these two Apple Fitness screenshots and extract comprehensive workout data in JSON format.

IMAGE 1: Heart Rate View - Contains detailed heart rate information, zones, and heart rate chart
IMAGE 2: Summary View - Contains workout duration, calories, and basic metrics

Extract the following data structure:
{
    "workoutType": "string (e.g., Functional Strength Training)",
    "date": "YYYY-MM-DD format",
    "duration": "MM:SS or HH:MM:SS format",
    "avgHeartRate": "number (BPM)",
    "maxHeartRate": "number (BPM if visible)",
    "totalCalories": "number",
    "activeCalories": "number",
    "heartRateZones": {
        "zone1": "MM:SS (time in zone)",
        "zone2": "MM:SS",
        "zone3": "MM:SS",
        "zone4": "MM:SS",
        "zone5": "MM:SS"
    },
    "heartRateRanges": {
        "zone1": "string (e.g., <128BPM)",
        "zone2": "string (e.g., 129-140BPM)",
        "zone3": "string (e.g., 141-152BPM)",
        "zone4": "string (e.g., 153-163BPM)",
        "zone5": "string (e.g., 164+BPM)"
    },
    "postWorkoutHeartRate": {
        "immediate": "number (BPM)",
        "1minute": "number (BPM)",
        "2minute": "number (BPM)"
    },
    "location": "string (if available)",
    "effort": "string (if visible on summary)"
}

Combine information from both screenshots for the most complete data.
If a value is not visible in either screenshot, use null.
Respond ONLY with valid JSON. Do not include any explanation or markdown formatting.
`;

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                },
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: 'image/jpeg',
                                        data: heartRateImage.split(',')[1] // Remove data:image/jpeg;base64,
                                    }
                                },
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: 'image/jpeg',
                                        data: summaryImage.split(',')[1] // Remove data:image/jpeg;base64,
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(data.content[0].text);
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }

    async generateInsights(workoutData, workoutHistory) {
        const prompt = `
Based on this current workout data and workout history, provide insights and trends analysis.

Current Workout:
${JSON.stringify(workoutData, null, 2)}

Recent Workout History:
${JSON.stringify(workoutHistory, null, 2)}

Please provide insights in JSON format:
{
    "performanceInsights": ["insight1", "insight2", "insight3"],
    "trends": ["trend1", "trend2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "comparisons": ["comparison1", "comparison2"]
}

Focus on:
- Heart rate trends and efficiency
- Calorie burn patterns
- Workout intensity analysis
- Progress indicators
- Recovery insights
- Performance comparisons with previous workouts

Respond ONLY with valid JSON.
`;

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(data.content[0].text);
        } catch (error) {
            console.error('Claude API error:', error);
            throw error;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClaudeAPI;
} else {
    window.ClaudeAPI = ClaudeAPI;
}