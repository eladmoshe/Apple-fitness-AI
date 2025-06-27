// Claude API Integration for Apple Fitness Screenshot Analyzer
// This file provides the actual Claude API integration for image analysis

class ClaudeAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.anthropic.com/v1/messages';
    }

    async analyzeScreenshots(image1, image2) {
        const prompt = `
Please analyze these two Apple Fitness screenshots. First, identify which is the 'Heart Rate View' (contains detailed heart rate zones, chart, and metrics) and which is the 'Summary View' (contains overall workout stats like duration and calories). Then, extract comprehensive workout data into a single JSON object.

IMPORTANT: Extract the ACTUAL workout date from the screenshots - look for date information displayed in the interface. Do NOT use today's date.

Extract the following data structure:
{
    "workoutType": "string (e.g., Functional Strength Training)",
    "date": "YYYY-MM-DD format (MUST be extracted from screenshot, not today's date)",
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

Combine information from both identified screenshots for the most complete data. If a value is not visible in either screenshot, use null.
Pay special attention to extracting the correct workout date from the screenshot interface.
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
You are a world-class AI fitness coach. Your goal is to provide fresh, data-driven, and highly personalized insights based on a user's workout data. Avoid generic advice.

Analyze the provided current workout and the user's recent workout history.

Current Workout Data:
${JSON.stringify(workoutData, null, 2)}

Recent Workout History (last 5 sessions):
${JSON.stringify(workoutHistory, null, 2)}

Generate a detailed analysis in the following JSON format. Ensure each insight is directly tied to the provided data.

{
    "performanceInsights": [
        "A specific, data-backed insight about the user's performance in this session.",
        "Another unique observation about their heart rate, zones, or calorie burn.",
        "A third, distinct point about their effort or recovery during this workout."
    ],
    "trends": [
        "Identify a positive or negative trend by comparing this workout to their history. Be specific (e.g., 'Your average heart rate has decreased by 5 BPM for similar workouts over the last 3 sessions, indicating improved efficiency.').",
        "Note another trend related to duration, intensity, or recovery."
    ],
    "recommendations": [
        "A concrete, actionable recommendation for their next workout based on this session's data.",
        "A suggestion for long-term improvement based on observed trends.",
        "A specific tip to optimize their performance, like adjusting warm-up or trying a new workout type."
    ],
    "comparisons": [
        "Compare this workout to their average, highlighting a key difference (e.g., 'This session's calorie burn was 15% higher than your average for strength training.').",
        "Provide another comparison, perhaps about time spent in different heart rate zones."
    ]
}

Respond ONLY with valid JSON. Do not include any explanation or markdown formatting. Be insightful and encouraging.
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