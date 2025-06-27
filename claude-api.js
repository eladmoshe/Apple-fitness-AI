// Claude API Integration for Apple Fitness Screenshot Analyzer
// This file provides the actual Claude API integration for image analysis

class ClaudeAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        
        // Check if we're running locally on our Node.js server
        this.isLocalServer = window.location.hostname === 'localhost' && 
                           window.location.port === '3000';
        
        if (this.isLocalServer) {
            // Use our local server proxy
            this.baseURL = '/api/claude';
        } else {
            // Fallback for GitHub Pages deployment
            this.baseURL = 'https://api.anthropic.com/v1/messages';
            this.proxyURL = 'https://corsproxy.io/?';
        }
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
            let url, requestBody, headers;
            
            if (this.isLocalServer) {
                // Use our local server
                url = this.baseURL;
                requestBody = {
                    apiKey: this.apiKey,
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
                                        media_type: this.getImageMediaType(image1),
                                        data: image1.split(',')[1] // Remove data:image/jpeg;base64,
                                    }
                                },
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: this.getImageMediaType(image2),
                                        data: image2.split(',')[1] // Remove data:image/jpeg;base64,
                                    }
                                }
                            ]
                        }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json'
                };
            } else {
                // Use proxy for other environments
                url = this.proxyURL + this.baseURL;
                requestBody = {
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
                                        media_type: this.getImageMediaType(image1),
                                        data: image1.split(',')[1]
                                    }
                                },
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: this.getImageMediaType(image2),
                                        data: image2.split(',')[1]
                                    }
                                }
                            ]
                        }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
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
            let url, requestBody, headers;
            
            if (this.isLocalServer) {
                // Use our local server
                url = this.baseURL;
                requestBody = {
                    apiKey: this.apiKey,
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json'
                };
            } else {
                // Use proxy for other environments
                url = this.proxyURL + this.baseURL;
                requestBody = {
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
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

    async generateUserSummary(allWorkouts) {
        const prompt = `
You are a world-class AI fitness coach analyzing a user's complete workout history. Provide a comprehensive fitness profile based on their workout data.

Complete Workout History:
${JSON.stringify(allWorkouts, null, 2)}

Analyze this data and generate a detailed user fitness summary in the following JSON format:

{
    "fitnessProfile": {
        "fitnessLevel": "string (Beginner/Intermediate/Advanced/Elite)",
        "primaryStrengths": ["list of 2-3 key strengths"],
        "areasForImprovement": ["list of 2-3 areas to improve"],
        "workoutConsistency": "string (assessment of consistency)",
        "preferredWorkoutTypes": ["list of most common workout types"]
    },
    "progressAnalysis": {
        "overallTrend": "string (Improving/Stable/Declining)",
        "keyMetricChanges": [
            "specific metric improvements or declines with numbers",
            "another significant change",
            "third notable trend"
        ],
        "consistencyScore": "string (1-10 with explanation)",
        "recoveryPatterns": "string (assessment of recovery trends)"
    },
    "performanceInsights": [
        "Deep insight about cardiovascular fitness based on heart rate data",
        "Analysis of calorie burn efficiency and patterns",
        "Heart rate zone distribution analysis and what it reveals",
        "Workout duration and intensity correlation insights"
    ],
    "personalizedRecommendations": [
        "Specific recommendation for optimizing current workout routine",
        "Suggestion for addressing identified weaknesses",
        "Recommendation for progressive overload or variety",
        "Recovery and rest day optimization advice"
    ],
    "achievements": [
        "Notable personal records or improvements",
        "Consistency milestones reached",
        "Fitness goals that appear to be met"
    ],
    "futureGoals": [
        "Suggested short-term goals (1-2 months)",
        "Recommended medium-term objectives (3-6 months)",
        "Long-term fitness aspirations to consider"
    ]
}

Be specific, data-driven, and encouraging. Reference actual numbers from their workouts when possible. Make recommendations actionable and personalized to their specific patterns and progress.

Respond ONLY with valid JSON. Do not include any explanation or markdown formatting.
`;

        try {
            let url, requestBody, headers;
            
            if (this.isLocalServer) {
                // Use our local server
                url = this.baseURL;
                requestBody = {
                    apiKey: this.apiKey,
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 2000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json'
                };
            } else {
                // Use proxy for other environments
                url = this.proxyURL + this.baseURL;
                requestBody = {
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 2000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                };
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
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

    getImageMediaType(dataUrl) {
        // Extract the media type from the data URL
        // e.g., "data:image/png;base64,..." -> "image/png"
        if (dataUrl.startsWith('data:')) {
            const mediaType = dataUrl.split(';')[0].split(':')[1];
            return mediaType;
        }
        // Fallback to JPEG if we can't determine the type
        return 'image/jpeg';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClaudeAPI;
} else {
    window.ClaudeAPI = ClaudeAPI;
}