# 🏃‍♂️ Apple Fitness Screenshot Analyzer

An AI-powered web application that analyzes Apple Fitness screenshots to extract workout data, provide personalized insights, and track fitness trends over time using Claude AI.

## ✨ Features Overview

### 🔐 **Claude API Required**
- **Real AI Analysis**: No mock data - all analysis powered by Claude AI
- **Mandatory Setup**: App requires valid Claude API key to function
- **Guided Setup**: Step-by-step instructions for obtaining API key
- **Secure Storage**: API key stored locally in browser

### 📱 **Smart Screenshot Analysis**
- **Dual Upload System**: Upload Heart Rate View + Summary View screenshots
- **Automatic Detection**: AI identifies which screenshot is which
- **Comprehensive Extraction**: Extracts 15+ data points from screenshots
- **Real Date Extraction**: Uses actual workout dates from screenshots (not upload date)

### 📊 **Complete Data Extraction**
The app extracts the following from your Apple Fitness screenshots:
- **Basic Metrics**: Workout type, date, duration
- **Calorie Data**: Total calories, active calories
- **Heart Rate Analytics**: Average BPM, max BPM, heart rate zones
- **Zone Distribution**: Time spent in each of 5 heart rate zones
- **Recovery Metrics**: Post-workout heart rate at 1min, 2min intervals
- **Additional Context**: Location, effort level (when visible)

### 🧠 **AI-Powered Insights**
- **Performance Analysis**: Cardiovascular engagement assessment
- **Trend Identification**: Progress tracking across workout history
- **Personalized Recommendations**: Tailored suggestions for improvement
- **Comparative Analysis**: Performance vs. historical averages
- **Data-Driven Coaching**: Specific, actionable fitness advice

### 📚 **Interactive Workout History**
- **Complete Timeline**: Chronological view of all analyzed workouts
- **Clickable Entries**: Click any workout to view full details
- **Original Screenshots**: View the exact screenshots used for each analysis
- **Smart Navigation**: Easy switching between current and historical data
- **Workout Management**: Delete unwanted entries with confirmation

### 🗄️ **Advanced Storage System**
- **Hybrid Architecture**: Metadata in localStorage, images in IndexedDB
- **Unlimited Capacity**: No practical limit on stored workouts
- **Efficient Storage**: Optimized for performance and space
- **Data Persistence**: All data survives browser restarts
- **Offline Access**: View historical data without internet

### 🔍 **Smart Duplicate Detection**
- **Intelligent Deduplication**: Prevents duplicate workout entries
- **Multi-Factor Matching**: Uses date + workout type + duration
- **Automatic Updates**: Replaces duplicates with latest analysis
- **Data Integrity**: Maintains clean, organized workout history

## 🚀 Getting Started

### Prerequisites
- **Claude API Key**: Required from [Anthropic Console](https://console.anthropic.com/)
- **Modern Browser**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Apple Fitness Screenshots**: Heart Rate + Summary views

### Quick Setup
1. **Get Claude API Key**:
   - Visit [console.anthropic.com](https://console.anthropic.com/)
   - Sign in or create account
   - Navigate to "API Keys" section
   - Create new API key (starts with `sk-ant-`)
   - Copy the key for use in app

2. **Launch Application**:
   - Open `index.html` in web browser
   - Enter API key when prompted (one-time setup)
   - Start analyzing your Apple Fitness screenshots!

3. **First Analysis**:
   - Take screenshots of Heart Rate and Summary views in Apple Fitness
   - Upload both screenshots (drag & drop or click to browse)
   - Click "Analyze Workout" button
   - Review extracted data and AI insights

## 📱 Screenshot Requirements

### Required Screenshots

#### 1. Heart Rate View
- **Location**: Apple Fitness app → Workout Details → Heart Rate tab
- **Contains**: 
  - Heart rate zones chart
  - Time spent in each zone
  - Average/max heart rate
  - Zone BPM ranges
  - Recovery heart rate data

#### 2. Summary View
- **Location**: Apple Fitness app → Workout Details → Summary tab  
- **Contains**:
  - Workout type and date
  - Total duration
  - Calorie information
  - Location (if available)
  - Effort level

### Screenshot Tips
- Ensure text is clearly visible and not cut off
- Capture full screen content for each view
- Use good lighting for clear text recognition
- Screenshots can be from iPhone or Apple Watch companion app

## 🛠️ Technical Architecture

### File Structure
```
Apple-fitness-AI/
├── index.html          # Main application interface
├── styles.css          # Complete styling & responsive design
├── app.js             # Core application logic & UI management
├── claude-api.js      # Claude API integration & prompts
├── image-storage.js   # IndexedDB image storage management
└── README.md          # Complete documentation (this file)
```

### Core Components

#### 1. **FitnessAnalyzer Class** (app.js)
- Main application controller
- Handles UI interactions and state management
- Coordinates between storage, API, and display systems
- Manages workout analysis workflow

#### 2. **ClaudeAPI Class** (claude-api.js)
- Claude AI integration and communication
- Optimized prompts for screenshot analysis
- Structured data extraction from AI responses
- Error handling and retry logic

#### 3. **ImageStorage Class** (image-storage.js)
- IndexedDB management for screenshot storage
- CRUD operations for workout images
- Storage optimization and cleanup utilities
- Asynchronous data handling

### Data Flow
```
Screenshots → AI Analysis → Data Extraction → Storage → Display
     ↓             ↓             ↓            ↓        ↓
  Upload UI    Claude API    JSON Parsing   Hybrid    Results UI
                                          Storage
```

### Storage Strategy
- **localStorage**: JSON workout metadata (fast access, simple queries)
- **IndexedDB**: Binary screenshot data (unlimited capacity, efficient storage)
- **Hybrid Benefits**: Combines simplicity with scalability

## 📊 Data Structures

### Workout Data Model
```javascript
{
  id: 1640995200000,                    // Unique timestamp ID
  timestamp: "2024-01-15T10:30:00Z",    // Analysis timestamp
  data: {
    workoutType: "Functional Strength Training",
    date: "2024-01-15",                 // Actual workout date from screenshot
    duration: "45:30",                  // MM:SS format
    avgHeartRate: 142,                  // BPM
    maxHeartRate: 178,                  // BPM
    totalCalories: 480,
    activeCalories: 365,
    heartRateZones: {
      zone1: "08:15",                   // Time in each zone (MM:SS)
      zone2: "12:30",
      zone3: "18:45", 
      zone4: "05:20",
      zone5: "00:40"
    },
    heartRateRanges: {
      zone1: "<120 BPM",                // BPM ranges for each zone
      zone2: "120-140 BPM",
      zone3: "141-160 BPM",
      zone4: "161-175 BPM", 
      zone5: "176+ BPM"
    },
    postWorkoutHeartRate: {
      immediate: 165,                   // BPM immediately after workout
      "1minute": 98,                    // BPM after 1 minute
      "2minute": 85                     // BPM after 2 minutes
    },
    location: "Home Gym",               // Optional location data
    effort: "Moderate to High"          // Optional effort level
  },
  insights: {
    performanceInsights: [
      "Your average heart rate of 142 BPM indicates excellent cardiovascular engagement...",
      "Strong recovery with heart rate dropping to 98 BPM within 1 minute..."
    ],
    trends: [
      "Your strength training sessions maintain consistent intensity...",
      "Recovery times have improved by 15% over the last month..."
    ],
    recommendations: [
      "Consider adding 2-3 minutes of high-intensity intervals...",
      "Try incorporating longer warm-up periods..."
    ],
    comparisons: [
      "This workout burned 12% more calories than your average...",
      "Heart rate zones were well-distributed compared to typical sessions..."
    ]
  }
}
```

### Screenshot Storage Model
```javascript
{
  id: "workout_1640995200000",          // Links to workout ID
  workoutId: 1640995200000,
  image1: "data:image/jpeg;base64,...", // Base64 encoded screenshot 1
  image2: "data:image/jpeg;base64,...", // Base64 encoded screenshot 2
  timestamp: "2024-01-15T10:30:00Z"
}
```

## 🎯 User Interface Components

### 1. **Upload Interface**
- **Drag & Drop Areas**: Visual feedback and hover states
- **File Validation**: Image format checking and error messages
- **Preview System**: Immediate thumbnail previews
- **Status Indicators**: Clear upload progress and completion states
- **Responsive Design**: Works on desktop and mobile devices

### 2. **Analysis Controls**
- **Smart Button States**: 
  - Disabled when no API key: "⚠️ Claude API Key Required"
  - Disabled when missing files: "Upload X more screenshots"
  - Active when ready: "Analyze Workout"
- **Loading States**: Progress indication during AI analysis
- **Error Handling**: Clear error messages with actionable solutions

### 3. **Results Display**
- **Metric Cards**: Key workout statistics in digestible format
- **Heart Rate Zones**: Visual grid showing zone distribution
- **AI Insights Sections**: Categorized insights with clear headers
- **Historical Screenshots**: Original images displayed with workout details

### 4. **Workout History**
- **Timeline View**: Chronological list with key metrics
- **Interactive Items**: Hover effects and click indicators
- **Quick Actions**: Delete buttons with confirmation dialogs
- **Navigation**: Smooth scrolling and state management

### 5. **API Key Management**
- **Mandatory Dialog**: Cannot be dismissed without valid key
- **Step-by-Step Guide**: Clear instructions for obtaining API key
- **Key Validation**: Real-time validation of API key format
- **Secure Storage**: Local browser storage with privacy notice

## 🔄 Application Workflow

### Initial Setup Flow
1. **App Launch** → Check for stored API key
2. **No Key Found** → Show mandatory API key dialog
3. **Key Entry** → Validate format (must start with `sk-ant-`)
4. **Key Storage** → Save to localStorage for future use
5. **App Ready** → Enable upload and analysis features

### Analysis Workflow
1. **Screenshot Upload** → Store in memory temporarily
2. **Validation Check** → Ensure both screenshots uploaded
3. **AI Processing** → Send to Claude API for analysis
4. **Data Extraction** → Parse structured response
5. **Insight Generation** → Generate personalized insights
6. **Storage** → Save metadata and images
7. **Display** → Show results and update history

### History Interaction Flow
1. **History Click** → Load workout data from localStorage
2. **Image Retrieval** → Fetch screenshots from IndexedDB
3. **Display Update** → Show historical workout details
4. **Navigation** → Provide return to current analysis option

## 🛡️ Security & Privacy

### Data Privacy
- **Local Storage Only**: All data remains in your browser
- **No External Tracking**: No analytics, cookies, or user monitoring
- **API Key Security**: Keys stored locally, never transmitted to third parties
- **Minimal Data Transmission**: Only screenshots sent to Claude API for analysis

### Security Features
- **Input Validation**: Comprehensive validation of all user inputs
- **Error Isolation**: Errors contained without exposing sensitive information
- **Secure Communication**: HTTPS-only communication with Claude API
- **Data Encryption**: Browser-level encryption for stored data

### Compliance
- **GDPR Compliant**: No personal data collection or processing
- **No Cookies**: Uses localStorage only for functionality
- **Transparent Processing**: Clear information about data usage
- **User Control**: Full control over data deletion and management

## 🔧 Advanced Features

### Error Handling
- **API Failures**: Detailed error messages with troubleshooting steps
- **Network Issues**: Retry mechanisms and offline graceful degradation
- **Storage Problems**: Fallback options and recovery procedures
- **Invalid Data**: Clear validation messages and correction guidance

### Performance Optimizations
- **Asynchronous Operations**: Non-blocking UI during AI processing
- **Efficient Storage**: Optimized data structures and compression
- **Lazy Loading**: Images loaded only when needed
- **Memory Management**: Cleanup of temporary data and resources

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Readable color schemes and typography
- **Responsive Design**: Works across all device sizes

## 📈 Version History

### Version 1.3.0 (Current) - "Pure AI Experience"
- ✅ **Removed Mock Data**: Eliminated confusing mock data system
- ✅ **Mandatory Claude API**: App requires valid API key to function
- ✅ **Enhanced Setup**: Improved API key dialog with clear instructions
- ✅ **Better Validation**: API key format validation and error handling
- ✅ **Simplified Logic**: Cleaner deduplication and data processing
- ✅ **Professional UX**: No fake data, all analysis is real

### Version 1.2.0 - "Unlimited Storage"
- ✅ **Hybrid Storage**: IndexedDB for images, localStorage for metadata
- ✅ **Unlimited Capacity**: Removed storage limitations
- ✅ **Historical Screenshots**: View original screenshots in history
- ✅ **Delete Functionality**: Remove unwanted workouts
- ✅ **Interactive History**: Clickable workout entries

### Version 1.1.0 - "Smart History"
- ✅ **Workout History**: Complete workout tracking system
- ✅ **Duplicate Detection**: Intelligent duplicate handling
- ✅ **Real Dates**: Extract actual workout dates from screenshots
- ✅ **Enhanced Insights**: Improved AI analysis quality

### Version 1.0.0 - "Foundation"
- ✅ **Core Analysis**: Basic screenshot processing
- ✅ **Claude Integration**: AI-powered data extraction
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Local Storage**: Browser-based persistence

## 🤝 Usage Tips

### Getting Better Results
1. **High Quality Screenshots**: Use clear, well-lit screenshots
2. **Complete Views**: Ensure all relevant data is visible
3. **Consistent Timing**: Take screenshots from the same workout session
4. **Regular Analysis**: Build workout history for better trend insights

### Troubleshooting
- **"Claude API Key Required"**: Enter valid key from Anthropic Console
- **"Failed to analyze"**: Check API key validity and internet connection
- **Upload Issues**: Ensure files are valid image formats (PNG, JPG)
- **Storage Warnings**: Delete old workouts or clear browser data

### Best Practices
- **API Key Management**: Keep your API key secure and don't share it
- **Regular Backups**: Export important workout data periodically
- **Browser Compatibility**: Use a modern browser for best experience
- **Data Management**: Regularly review and clean up workout history

## 🛠️ Development Notes

### Code Organization
- **Modular Design**: Clear separation of concerns across files
- **Class-Based Architecture**: Object-oriented approach for maintainability
- **Async/Await**: Modern JavaScript for clean asynchronous operations
- **Error-First Design**: Comprehensive error handling throughout

### API Integration
- **Structured Prompts**: Optimized prompts for consistent data extraction
- **Response Validation**: Robust parsing and validation of AI responses
- **Rate Limiting**: Respectful API usage with proper error handling
- **Cost Optimization**: Efficient prompts to minimize API costs

### Future Roadmap
- **Apple Health Integration**: Direct data import from HealthKit
- **Advanced Analytics**: Trend charts and progress visualization
- **Export Features**: PDF reports and data export options
- **Social Features**: Workout sharing and comparison tools
- **Wearable Support**: Integration with other fitness devices

## 📄 License & Credits

### License
This project is for personal and educational use. Commercial use requires proper licensing of Claude API from Anthropic.

### Dependencies
- **Claude AI**: Anthropic's Claude API for image analysis
- **Modern Browsers**: HTML5, CSS3, ES6+ JavaScript features
- **No External Libraries**: Pure vanilla JavaScript implementation

### Credits
- **Anthropic**: Claude AI for powerful image analysis capabilities
- **Apple**: Apple Fitness ecosystem for workout data source
- **Community**: Feedback and suggestions for feature improvements

---

**📝 Documentation maintained and updated with each version release**  
**🔄 Last updated**: Version 1.3.0 - Pure AI Experience  
**⭐ Star this project if you find it useful!**