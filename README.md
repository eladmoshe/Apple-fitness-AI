# Apple Fitness AI Screenshot Analyzer

A web application that analyzes Apple Fitness screenshots to extract workout data and provide AI-powered insights using Claude's vision capabilities.

## Features

- **Dual Screenshot Analysis**: Upload both heart rate view and summary view screenshots
- **Claude AI Integration**: Real image analysis using Claude's vision API
- **Heart Rate Zones**: Visual breakdown of time spent in different heart rate zones
- **AI Insights**: Personalized performance insights, trends, and recommendations
- **Workout History**: Track your fitness progress over time
- **Responsive Design**: Works on desktop and mobile devices

## Setup

1. **Clone or download the project files**
   ```bash
   git clone <repository-url>
   cd Apple-fitness-AI
   ```

2. **Serve the files**
   You can use any local web server. Here are a few options:
   
   **Using Python:**
   ```bash
   python -m http.server 8000
   ```
   
   **Using Node.js:**
   ```bash
   npx serve .
   ```
   
   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000` in your web browser.

## Claude API Integration

To use real AI analysis:

1. Get a Claude API key from [Anthropic Console](https://console.anthropic.com/)
2. When you first open the app, you'll be prompted to enter your API key
3. The app will securely store your key in localStorage for future use

**Note**: Without an API key, the app will use mock data for demonstration purposes.

## Usage

1. **Take Screenshots**: 
   - Heart Rate View: The detailed heart rate screen showing zones and BPM chart
   - Summary View: The workout summary with duration, calories, and metrics

2. **Upload Screenshots**: 
   - Drag and drop or click to select your screenshots
   - Both screenshots are required for analysis

3. **Analyze**: 
   - Click "Analyze Complete Workout Data"
   - Wait for AI processing (2-5 seconds)

4. **View Results**:
   - Workout metrics and heart rate zones
   - AI-generated insights and recommendations
   - Progress tracking in workout history

## File Structure

```
Apple-fitness-AI/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── app.js             # Main application logic
├── claude-api.js      # Claude API integration
└── README.md          # This file
```

## Technologies Used

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **AI Integration**: Claude 3 Sonnet API
- **Storage**: localStorage for workout history and API key
- **Design**: CSS Grid, Flexbox, and responsive design

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Privacy & Security

- API keys are stored locally in your browser only
- Screenshots are processed by Claude API and not stored permanently
- Workout data is stored locally in your browser's localStorage
- No data is sent to third-party services except Claude for analysis

## Development

The application is built with vanilla JavaScript for simplicity and can be easily modified:

- **app.js**: Contains the main FitnessAnalyzer class
- **claude-api.js**: Handles Claude API communication
- **styles.css**: All styling including responsive breakpoints

## Limitations

- Requires manual screenshot uploads (no automatic Apple Health integration)
- Claude API usage is subject to Anthropic's rate limits and pricing
- Mock data is used when no API key is provided

## Future Enhancements

- Direct Apple Health integration
- Export functionality for workout data
- Advanced charting and trend visualization
- Multiple workout type support
- Social sharing features

## License

This project is open source and available under the MIT License.