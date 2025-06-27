class FitnessAnalyzer {
    constructor() {
        this.workouts = this.loadWorkoutHistory();
        this.uploadedImages = []; // Changed to array for multiple files
        this.claudeAPI = null;
        this.imageStorage = new ImageStorage();
        this.initializeEventListeners();
        this.renderWorkoutHistory();
        this.checkApiKey();
        this.initImageStorage();
    }

    async initImageStorage() {
        try {
            await this.imageStorage.init();
            console.log('Image storage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize image storage:', error);
            this.showError('Failed to initialize image storage. Some features may not work properly.');
        }
    }

    checkApiKey() {
        // Check if API key is stored in localStorage
        const apiKey = localStorage.getItem('claude-api-key');
        if (apiKey) {
            this.claudeAPI = new ClaudeAPI(apiKey);
            this.checkAnalyzeButton(); // Update button state when API key is available
        } else {
            // Show API key input dialog
            this.showApiKeyDialog();
        }
    }

    showApiKeyDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        dialog.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 15px; max-width: 600px; width: 90%; text-align: center;">
                <h2 style="margin-bottom: 20px; color: #333;">🔑 Claude API Key Required</h2>
                <p style="margin-bottom: 25px; color: #666; line-height: 1.6;">
                    This app requires a Claude API key to analyze your Apple Fitness screenshots. 
                    Get your API key from <a href="https://console.anthropic.com/" target="_blank" style="color: #667eea; text-decoration: none;">Anthropic Console</a>.
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; text-align: left;">
                    <h4 style="margin-bottom: 10px; color: #333;">📋 How to get your API key:</h4>
                    <ol style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
                        <li>Visit <a href="https://console.anthropic.com/" target="_blank" style="color: #667eea;">console.anthropic.com</a></li>
                        <li>Sign in or create an account</li>
                        <li>Go to "API Keys" section</li>
                        <li>Create a new API key</li>
                        <li>Copy and paste it below</li>
                    </ol>
                </div>
                <input type="password" id="apiKeyInput" placeholder="sk-ant-..." 
                       style="width: 100%; padding: 15px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 20px; font-family: monospace;">
                <button id="saveApiKey" style="width: 100%; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
                    🚀 Save API Key & Start Analyzing
                </button>
                <p style="margin-top: 15px; font-size: 12px; color: #999;">
                    Your API key is stored locally in your browser and never shared.
                </p>
            </div>
        `;

        document.body.appendChild(dialog);

        const apiKeyInput = document.getElementById('apiKeyInput');
        const saveButton = document.getElementById('saveApiKey');

        // Focus on input when dialog opens
        setTimeout(() => apiKeyInput.focus(), 100);

        // Allow Enter key to save
        apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveButton.click();
            }
        });

        saveButton.onclick = () => {
            const apiKey = apiKeyInput.value.trim();
            if (apiKey && apiKey.startsWith('sk-ant-')) {
                localStorage.setItem('claude-api-key', apiKey);
                this.claudeAPI = new ClaudeAPI(apiKey);
                this.checkAnalyzeButton(); // Update button state when API key is set
                document.body.removeChild(dialog);
            } else {
                alert('Please enter a valid Claude API key (should start with "sk-ant-")');
                apiKeyInput.focus();
            }
        };

        // Prevent closing dialog by clicking outside
        dialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    initializeEventListeners() {
        // Setup for single upload area with multiple file support
        const uploadArea = document.getElementById("uploadArea");
        const fileInput = document.getElementById("fileInput");
        const clearAllBtn = document.getElementById("clearAllBtn");

        uploadArea.addEventListener("click", () => fileInput.click());
        uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e));
        uploadArea.addEventListener("dragleave", (e) => this.handleDragLeave(e));
        uploadArea.addEventListener("drop", (e) => this.handleDrop(e));
        fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

        if (clearAllBtn) {
            clearAllBtn.addEventListener("click", () => this.clearAllFiles());
        }

        const analyzeBtn = document.getElementById("analyzeBtn");
        analyzeBtn.addEventListener("click", this.analyzeScreenshots.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById("uploadArea").classList.add("dragover");
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById("uploadArea").classList.remove("dragover");
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById("uploadArea").classList.remove("dragover");
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        // Filter out non-image files
        const imageFiles = files.filter(file => file.type.startsWith("image/"));
        
        if (imageFiles.length === 0) {
            this.showError("Please select at least one image file.");
            return;
        }

        if (imageFiles.length !== files.length) {
            this.showError(`${files.length - imageFiles.length} non-image files were skipped.`);
        }

        // Process each image file
        imageFiles.forEach(file => {
            this.processSingleFile(file);
        });
    }

    processSingleFile(file) {
        // Check for duplicates
        const existingIndex = this.uploadedImages.findIndex(img => img.name === file.name);
        if (existingIndex !== -1) {
            // Replace existing file
            this.uploadedImages[existingIndex] = { ...this.uploadedImages[existingIndex], file };
            this.updateFilePreview(this.uploadedImages[existingIndex]);
            return;
        }

        const fileId = Date.now() + Math.random();
        const imageData = {
            id: fileId,
            name: file.name,
            size: file.size,
            file: file,
            dataUrl: null
        };

        const reader = new FileReader();
        reader.onload = (e) => {
            imageData.dataUrl = e.target.result;
            this.uploadedImages.push(imageData);
            this.updateFilePreview(imageData);
            this.updateFileCount();
            this.checkAnalyzeButton();
        };
        reader.readAsDataURL(file);
    }

    updateFilePreview(imageData) {
        const previewContainer = document.getElementById("filePreviewContainer");
        const previewGrid = document.getElementById("filePreviewGrid");
        
        // Show preview container
        previewContainer.style.display = "block";

        // Check if preview already exists (for updates)
        let previewItem = document.getElementById(`preview-${imageData.id}`);
        
        if (!previewItem) {
            // Create new preview item
            previewItem = document.createElement("div");
            previewItem.className = "file-preview-item";
            previewItem.id = `preview-${imageData.id}`;
            previewGrid.appendChild(previewItem);
        }

        previewItem.innerHTML = `
            <button class="file-preview-remove" onclick="fitnessAnalyzer.removeFile('${imageData.id}')">
                ×
            </button>
            <img src="${imageData.dataUrl}" alt="${imageData.name}" class="file-preview-image">
            <div class="file-preview-name">${imageData.name}</div>
            <div style="font-size: 0.7rem; color: #999;">
                ${(imageData.size / 1024).toFixed(1)} KB
            </div>
        `;
    }

    updateFileCount() {
        const fileCount = document.querySelector(".file-count");
        const count = this.uploadedImages.length;
        fileCount.textContent = `${count} file${count !== 1 ? 's' : ''} selected`;
    }

    removeFile(fileId) {
        const index = this.uploadedImages.findIndex(img => img.id == fileId);
        if (index !== -1) {
            this.uploadedImages.splice(index, 1);
            
            const previewItem = document.getElementById(`preview-${fileId}`);
            if (previewItem) {
                previewItem.remove();
            }

            this.updateFileCount();
            this.checkAnalyzeButton();

            // Hide preview container if no files
            if (this.uploadedImages.length === 0) {
                document.getElementById("filePreviewContainer").style.display = "none";
            }
        }
    }

    clearAllFiles() {
        this.uploadedImages = [];
        document.getElementById("filePreviewContainer").style.display = "none";
        document.getElementById("filePreviewGrid").innerHTML = "";
        document.getElementById("fileInput").value = "";
        this.checkAnalyzeButton();
    }

    checkAnalyzeButton() {
        const analyzeBtn = document.getElementById("analyzeBtn");
        const uploadedCount = this.uploadedImages.length;
        const hasEnoughImages = uploadedCount >= 2;
        const hasApiKey = !!this.claudeAPI;
        
        analyzeBtn.disabled = !hasEnoughImages || !hasApiKey;

        if (!hasApiKey) {
            analyzeBtn.textContent = "⚠️ Claude API Key Required";
        } else if (hasEnoughImages) {
            analyzeBtn.textContent = `Analyze Workout (${uploadedCount} images)`;
        } else {
            const needed = 2 - uploadedCount;
            analyzeBtn.textContent = `Upload ${needed} more screenshot${needed !== 1 ? "s" : ""}`;
        }
    }

    async analyzeScreenshots() {
        if (this.uploadedImages.length < 2) {
            this.showError("Please upload at least 2 screenshots first.");
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            // Use the first two images for analysis
            const workoutData = await this.extractWorkoutData(
                this.uploadedImages[0].dataUrl,
                this.uploadedImages[1].dataUrl
            );
            const insights = await this.generateInsights(workoutData);

            this.displayResults(workoutData, insights);
            await this.saveWorkout(workoutData, insights);
            this.renderWorkoutHistory();
            this.resetUploadAreas();
        } catch (error) {
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async extractWorkoutData(image1, image2) {
        if (!this.claudeAPI) {
            throw new Error('Claude API key is required. Please set up your API key to analyze screenshots.');
        }

        try {
            return await this.claudeAPI.analyzeScreenshots(image1, image2);
        } catch (error) {
            console.error('Claude API failed:', error);
            throw new Error(`Failed to analyze screenshots: ${error.message}`);
        }
    }

    async generateInsights(workoutData) {
        const workoutHistory = this.workouts.slice(-5); // Last 5 workouts for context
        
        if (!this.claudeAPI) {
            throw new Error('Claude API key is required. Please set up your API key to generate insights.');
        }

        try {
            return await this.claudeAPI.generateInsights(workoutData, workoutHistory);
        } catch (error) {
            console.error('Claude API failed for insights:', error);
            throw new Error(`Failed to generate insights: ${error.message}`);
        }
    }

    displayResults(workoutData, insights) {
        // Update metric cards
        document.getElementById("workoutTime").textContent = workoutData.duration || "--";
        document.getElementById("avgHeartRate").textContent = workoutData.avgHeartRate 
            ? `${workoutData.avgHeartRate} BPM` : "--";
        document.getElementById("totalCalories").textContent = workoutData.totalCalories 
            ? `${workoutData.totalCalories} CAL` : "--";
        document.getElementById("activeCalories").textContent = workoutData.activeCalories 
            ? `${workoutData.activeCalories} CAL` : "--";

        // Update heart rate zones
        this.updateHeartRateZones(workoutData);

        // Display insights
        const insightsContainer = document.getElementById("insightsContainer");
        insightsContainer.innerHTML = "";

        const categories = [
            { title: "🎯 Performance Insights", items: insights.performanceInsights },
            { title: "📈 Trends", items: insights.trends },
            { title: "💡 Recommendations", items: insights.recommendations },
            { title: "⚖️ Comparisons", items: insights.comparisons }
        ];

        categories.forEach(category => {
            if (category.items && category.items.length > 0) {
                const categoryDiv = document.createElement("div");
                categoryDiv.innerHTML = `<h4 style="margin-bottom: 10px; color: #667eea;">${category.title}</h4>`;

                category.items.forEach(item => {
                    const insightDiv = document.createElement("div");
                    insightDiv.className = "insight-item";
                    insightDiv.textContent = item;
                    categoryDiv.appendChild(insightDiv);
                });

                insightsContainer.appendChild(categoryDiv);
            }
        });

        document.getElementById("resultsSection").style.display = "block";
    }

    updateHeartRateZones(workoutData) {
        const zonesContainer = document.getElementById("heartRateZones");
        if (!workoutData.heartRateZones || !zonesContainer) return;

        zonesContainer.innerHTML = "";

        const zoneNames = ["Recovery", "Aerobic", "Anaerobic", "VO2 Max", "Neuromuscular"];
        
        Object.entries(workoutData.heartRateZones).forEach(([zoneKey, time], index) => {
            const zoneNumber = index + 1;
            const zoneName = zoneNames[index];
            const zoneRange = workoutData.heartRateRanges?.[zoneKey] || "";

            const zoneCard = document.createElement("div");
            zoneCard.className = `zone-card zone-${zoneNumber}`;
            zoneCard.innerHTML = `
                <div class="zone-name">${zoneName}</div>
                <div class="zone-range">${zoneRange}</div>
                <div class="zone-time">${time}</div>
            `;

            zonesContainer.appendChild(zoneCard);
        });
    }

    resetUploadAreas() {
        // Clear all uploaded files
        this.clearAllFiles();
        
        // Remove any upload state classes
        const uploadArea = document.getElementById("uploadArea");
        if (uploadArea) {
            uploadArea.classList.remove("uploaded", "dragover");
        }
    }

    async saveWorkout(workoutData, insights) {
        // Create a unique identifier for the workout based on date, type, and duration
        const workoutKey = `${workoutData.date}_${workoutData.workoutType}_${workoutData.duration}`;
        
        // Check if this workout already exists
        const existingWorkoutIndex = this.workouts.findIndex(w => {
            const existingKey = `${w.data.date}_${w.data.workoutType}_${w.data.duration}`;
            return existingKey === workoutKey;
        });

        const workoutId = existingWorkoutIndex !== -1 ? this.workouts[existingWorkoutIndex].id : Date.now();

        const workout = {
            id: workoutId,
            timestamp: new Date().toISOString(),
            data: workoutData,
            insights: insights
        };

        try {
            // Store the first two images in IndexedDB (for compatibility with existing storage system)
            await this.imageStorage.storeImages(
                workoutId,
                this.uploadedImages[0]?.dataUrl || null,
                this.uploadedImages[1]?.dataUrl || null
            );

            if (existingWorkoutIndex !== -1) {
                // Replace existing workout with updated data
                this.workouts[existingWorkoutIndex] = workout;
                console.log('Updated existing workout:', workoutData.date, workoutData.workoutType);
                this.showInfo(`Updated existing workout from ${workoutData.date}`);
            } else {
                // Add new workout
                this.workouts.push(workout);
                console.log('Added new workout:', workoutData.date, workoutData.workoutType);
            }

            localStorage.setItem("fitnessWorkouts", JSON.stringify(this.workouts));
        } catch (error) {
            console.error('Failed to save workout images:', error);
            this.showError('Failed to save workout images. The workout data was saved but images may be missing.');
            
            // Still save the workout data even if image storage fails
            if (existingWorkoutIndex !== -1) {
                this.workouts[existingWorkoutIndex] = workout;
            } else {
                this.workouts.push(workout);
            }
            localStorage.setItem("fitnessWorkouts", JSON.stringify(this.workouts));
        }
    }

    loadWorkoutHistory() {
        const stored = localStorage.getItem("fitnessWorkouts");
        return stored ? JSON.parse(stored) : [];
    }

    renderWorkoutHistory() {
        const historyContainer = document.getElementById("historyContainer");

        if (this.workouts.length === 0) {
            historyContainer.innerHTML = `
                <div style="text-align: center; color: #999; padding: 20px;">
                    No workout data yet. Upload your first screenshot to get started!
                </div>
            `;
            return;
        }

        historyContainer.innerHTML = "";

        // Show last 10 workouts
        const recentWorkouts = this.workouts.slice(-10).reverse();

        recentWorkouts.forEach(workout => {
            const workoutDiv = document.createElement("div");
            workoutDiv.className = "workout-history-item clickable";
            
            const date = new Date(workout.timestamp).toLocaleDateString();
            const data = workout.data;

            workoutDiv.innerHTML = `
                <div class="workout-main" style="flex: 1; cursor: pointer;">
                    <div>
                        <div class="workout-date">${date}</div>
                        <div class="workout-details">
                            ${data.workoutType || "Workout"} • ${data.duration || "--"}
                        </div>
                    </div>
                    <div class="workout-metrics">
                        <div>${data.avgHeartRate || "--"} BPM</div>
                        <div>${data.totalCalories || "--"} CAL</div>
                    </div>
                    <div class="click-indicator">👆 Click to view</div>
                </div>
                <button class="delete-workout-btn" data-workout-id="${workout.id}" title="Delete workout">
                    🗑️
                </button>
            `;

            // Add click handler to load workout data (only for the main area)
            const workoutMain = workoutDiv.querySelector('.workout-main');
            workoutMain.addEventListener('click', () => {
                this.loadWorkoutData(workout);
            });

            // Add click handler for delete button
            const deleteBtn = workoutDiv.querySelector('.delete-workout-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the workout load
                this.confirmDeleteWorkout(workout);
            });

            historyContainer.appendChild(workoutDiv);
        });
    }

    showLoading(show) {
        document.getElementById("loadingSection").style.display = show ? "block" : "none";
    }

    showError(message) {
        const errorSection = document.getElementById("errorSection");
        errorSection.textContent = message;
        errorSection.style.display = "block";
    }

    hideError() {
        document.getElementById("errorSection").style.display = "none";
    }

    showInfo(message) {
        // Create or update info section for positive feedback
        let infoSection = document.getElementById("infoSection");
        if (!infoSection) {
            infoSection = document.createElement("div");
            infoSection.id = "infoSection";
            infoSection.className = "info";
            infoSection.style.cssText = `
                background: #e8f5e8;
                color: #2d5f2d;
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
                border: 1px solid #a8d4a8;
                display: none;
            `;
            document.getElementById("errorSection").after(infoSection);
        }
        
        infoSection.textContent = message;
        infoSection.style.display = "block";
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            infoSection.style.display = "none";
        }, 3000);
    }

    async loadWorkoutData(workout) {
        // Load the selected workout data into the main UI
        this.displayResults(workout.data, workout.insights);
        
        // Update the results section title to indicate it's historical data
        const resultsTitle = document.querySelector("#resultsSection h2");
        const date = new Date(workout.timestamp).toLocaleDateString();
        resultsTitle.textContent = `Workout Analysis - ${date}`;
        
        // Retrieve and display historical screenshots from IndexedDB
        try {
            const screenshots = await this.imageStorage.getImages(workout.id);
            this.displayHistoricalScreenshots(screenshots);
        } catch (error) {
            console.error('Failed to load workout images:', error);
            // Don't show error to user as this is not critical for viewing workout data
        }
        
        // Add a reset button to return to current analysis mode
        this.addResetButton();
        
        // Scroll to results section
        document.getElementById("resultsSection").scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
        });
    }

    displayHistoricalScreenshots(screenshots) {
        // Remove any existing historical screenshots
        const existingContainer = document.getElementById("historicalScreenshots");
        if (existingContainer) {
            existingContainer.remove();
        }

        // Only display if we have screenshots
        if (!screenshots || (!screenshots.image1 && !screenshots.image2)) {
            return;
        }

        // Create container for historical screenshots
        const screenshotsContainer = document.createElement("div");
        screenshotsContainer.id = "historicalScreenshots";
        screenshotsContainer.className = "historical-screenshots";
        screenshotsContainer.innerHTML = `
            <h3>Original Screenshots</h3>
            <div class="screenshots-grid">
                ${screenshots.image1 ? `
                    <div class="screenshot-item">
                        <img src="${screenshots.image1}" alt="Screenshot 1" class="historical-screenshot">
                        <div class="screenshot-label">Screenshot 1</div>
                    </div>
                ` : ''}
                ${screenshots.image2 ? `
                    <div class="screenshot-item">
                        <img src="${screenshots.image2}" alt="Screenshot 2" class="historical-screenshot">
                        <div class="screenshot-label">Screenshot 2</div>
                    </div>
                ` : ''}
            </div>
        `;

        // Insert after the insights section
        const insightsSection = document.querySelector(".insights-section");
        if (insightsSection) {
            insightsSection.after(screenshotsContainer);
        }
    }

    addResetButton() {
        // Remove existing reset button if it exists
        const existingResetBtn = document.getElementById("resetToCurrentBtn");
        if (existingResetBtn) {
            existingResetBtn.remove();
        }

        // Create new reset button
        const resetBtn = document.createElement("button");
        resetBtn.id = "resetToCurrentBtn";
        resetBtn.className = "reset-btn";
        resetBtn.textContent = "← Back to Current Analysis";
        resetBtn.style.cssText = `
            margin: 10px 0;
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        resetBtn.addEventListener('click', () => {
            this.resetToCurrentAnalysis();
        });

        // Insert the reset button after the results title
        const resultsSection = document.getElementById("resultsSection");
        const resultsTitle = resultsSection.querySelector("h2");
        resultsTitle.after(resetBtn);
    }

    resetToCurrentAnalysis() {
        // Reset the results section title
        const resultsTitle = document.querySelector("#resultsSection h2");
        resultsTitle.textContent = "Current Workout Analysis";
        
        // Remove the reset button
        const resetBtn = document.getElementById("resetToCurrentBtn");
        if (resetBtn) {
            resetBtn.remove();
        }
        
        // Remove historical screenshots
        const historicalScreenshots = document.getElementById("historicalScreenshots");
        if (historicalScreenshots) {
            historicalScreenshots.remove();
        }
        
        // Clear the results section or hide it if no current analysis exists
        const hasCurrentData = this.uploadedImages.image1 || this.uploadedImages.image2;
        if (!hasCurrentData) {
            // Clear all data displays
            document.getElementById("workoutTime").textContent = "--";
            document.getElementById("avgHeartRate").textContent = "--";
            document.getElementById("totalCalories").textContent = "--";
            document.getElementById("activeCalories").textContent = "--";
            document.getElementById("heartRateZones").innerHTML = "";
            document.getElementById("insightsContainer").innerHTML = "";
            
            // You could also hide the results section entirely
            // document.getElementById("resultsSection").style.display = "none";
        }
        
        // Scroll back to upload section
        document.querySelector(".upload-section").scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
        });
    }

    confirmDeleteWorkout(workout) {
        const date = new Date(workout.timestamp).toLocaleDateString();
        const workoutType = workout.data.workoutType || "Workout";
        
        const confirmDialog = document.createElement('div');
        confirmDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        confirmDialog.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%; text-align: center;">
                <h3 style="margin-bottom: 15px; color: #333;">Delete Workout</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    Are you sure you want to delete this workout?
                </p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <strong>${workoutType}</strong><br>
                    <small style="color: #666;">${date}</small>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancelDelete" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="confirmDelete" style="padding: 10px 16px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Delete
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        document.getElementById('cancelDelete').onclick = () => {
            document.body.removeChild(confirmDialog);
        };

        document.getElementById('confirmDelete').onclick = async () => {
            await this.deleteWorkout(workout.id);
            document.body.removeChild(confirmDialog);
        };
    }

    async deleteWorkout(workoutId) {
        // Find and remove the workout
        const workoutIndex = this.workouts.findIndex(w => w.id === workoutId);
        
        if (workoutIndex !== -1) {
            const deletedWorkout = this.workouts[workoutIndex];
            this.workouts.splice(workoutIndex, 1);
            
            try {
                // Delete images from IndexedDB
                await this.imageStorage.deleteImages(workoutId);
                console.log('Deleted workout images from IndexedDB');
            } catch (error) {
                console.error('Failed to delete workout images:', error);
                // Continue with workout deletion even if image deletion fails
            }
            
            // Update localStorage
            localStorage.setItem("fitnessWorkouts", JSON.stringify(this.workouts));
            
            // Re-render the workout history
            this.renderWorkoutHistory();
            
            // Show success message
            this.showInfo(`Workout deleted successfully`);
            
            // If we're currently viewing the deleted workout, reset to current analysis
            const resultsTitle = document.querySelector("#resultsSection h2");
            if (resultsTitle && resultsTitle.textContent.includes("Workout Analysis -")) {
                this.resetToCurrentAnalysis();
            }
            
            console.log('Deleted workout:', deletedWorkout.data.workoutType, deletedWorkout.data.date);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
    window.fitnessAnalyzer = new FitnessAnalyzer();
});