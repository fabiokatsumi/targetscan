// app.js - Complete JavaScript for TargetScan Web App

// Application state
const appState = {
    targetImage: null,
    targetCenter: null,
    shots: [],
    totalScore: 0,
    groupSize: 0,
    meanRadius: 0,
    windage: 0,
    elevation: 0,
    isAddingShot: false,
    targetType: 'standard',
    ringDiameters: [],
    ringValues: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    pixelToMmRatio: 0.1, // Default: 10 pixels = 1mm
    originalImageSize: { width: 0, height: 0 }
};

// DOM elements
const elements = {
    // Screens
    welcomeScreen: document.getElementById('welcomeScreen'),
    analysisScreen: document.getElementById('analysisScreen'),
    cameraScreen: document.getElementById('cameraScreen'),
    
    // Image display
    imageContainer: document.getElementById('imageContainer'),
    targetCanvas: document.getElementById('targetCanvas'),
    addShotOverlay: document.getElementById('addShotOverlay'),
    
    // Buttons and inputs
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('fileInput'),
    cameraBtn: document.getElementById('cameraBtn'),
    takePictureBtn: document.getElementById('takePictureBtn'),
    cancelCameraBtn: document.getElementById('cancelCameraBtn'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    addShotBtn: document.getElementById('addShotBtn'),
    removeBtn: document.getElementById('removeBtn'),
    targetTypeBtn: document.getElementById('targetTypeBtn'),
    detailsBtn: document.getElementById('detailsBtn'),
    helpBtn: document.getElementById('helpBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    exportResultsBtn: document.getElementById('exportResultsBtn'),
    
    // Results display
    totalScore: document.getElementById('totalScore'),
    groupSize: document.getElementById('groupSize'),
    meanRadius: document.getElementById('meanRadius'),
    windage: document.getElementById('windage'),
    elevation: document.getElementById('elevation'),
    shotDetailsBody: document.getElementById('shotDetailsBody'),
    
    // Modals
    shotDetailsModal: document.getElementById('shotDetailsModal'),
    targetTypeModal: document.getElementById('targetTypeModal'),
    calibrationModal: document.getElementById('calibrationModal'),
    helpModal: document.getElementById('helpModal'),
    settingsModal: document.getElementById('settingsModal'),
    
    // Modal close buttons
    closeShotDetailsBtn: document.getElementById('closeShotDetailsBtn'),
    closeTargetTypeBtn: document.getElementById('closeTargetTypeBtn'),
    closeCalibrationBtn: document.getElementById('closeCalibrationBtn'),
    closeHelpBtn: document.getElementById('closeHelpBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    
    // Target type options
    targetOptions: document.querySelectorAll('.target-option'),
    
    // Calibration
    calibrationInput: document.getElementById('calibrationInput'),
    confirmCalibrationBtn: document.getElementById('confirmCalibrationBtn'),
    cancelCalibrationBtn: document.getElementById('cancelCalibrationBtn'),
    
    // Camera
    cameraView: document.getElementById('cameraView')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Check for dark mode preference
    checkDarkModePreference();
    
    console.log('TargetScan initialized');
}

function setupEventListeners() {
    // Welcome screen actions
    elements.uploadBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    elements.fileInput.addEventListener('change', handleImageUpload);
    
    elements.cameraBtn.addEventListener('click', () => {
        showScreen(elements.cameraScreen);
        initCamera();
    });
    
    // Camera screen actions
    elements.takePictureBtn.addEventListener('click', captureImage);
    elements.cancelCameraBtn.addEventListener('click', () => {
        showScreen(elements.welcomeScreen);
        stopCamera();
    });
    
    // Analysis screen actions
    elements.analyzeBtn.addEventListener('click', analyzeTarget);
    elements.addShotBtn.addEventListener('click', toggleAddShotMode);
    elements.removeBtn.addEventListener('click', removeLastShot);
    elements.targetTypeBtn.addEventListener('click', () => showModal(elements.targetTypeModal));
    elements.detailsBtn.addEventListener('click', () => showModal(elements.shotDetailsModal));
    
    // Navigation actions
    elements.helpBtn.addEventListener('click', () => showModal(elements.helpModal));
    elements.settingsBtn.addEventListener('click', () => showModal(elements.settingsModal));
    
    // Image container click for adding shots
    elements.targetCanvas.addEventListener('click', handleCanvasClick);
    
    // Modal close buttons
    elements.closeShotDetailsBtn.addEventListener('click', () => hideModal(elements.shotDetailsModal));
    elements.closeTargetTypeBtn.addEventListener('click', () => hideModal(elements.targetTypeModal));
    elements.closeCalibrationBtn.addEventListener('click', () => hideModal(elements.calibrationModal));
    elements.closeHelpBtn.addEventListener('click', () => hideModal(elements.helpModal));
    elements.closeSettingsBtn.addEventListener('click', () => hideModal(elements.settingsModal));
    
    // Target type options
    elements.targetOptions.forEach(option => {
        option.addEventListener('click', () => {
            const type = option.getAttribute('data-type');
            if (type === 'custom') {
                hideModal(elements.targetTypeModal);
                showModal(elements.calibrationModal);
            } else {
                setTargetType(type);
                hideModal(elements.targetTypeModal);
            }
        });
    });
    
    // Calibration actions
    elements.confirmCalibrationBtn.addEventListener('click', calibrateTarget);
    elements.cancelCalibrationBtn.addEventListener('click', () => hideModal(elements.calibrationModal));
    
    // Export results
    elements.exportResultsBtn.addEventListener('click', exportResults);
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
}

function checkDarkModePreference() {
    // Check if user has a preference stored
    const darkModePreference = localStorage.getItem('darkMode');
    
    if (darkModePreference === 'true' || 
        (darkModePreference === null && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
}

function toggleDarkMode(event) {
    if (event.target.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
}

function showScreen(screen) {
    // Hide all screens
    elements.welcomeScreen.classList.remove('active');
    elements.analysisScreen.classList.remove('active');
    elements.cameraScreen.classList.remove('active');
    
    // Show the requested screen
    screen.classList.add('active');
}

function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

// Handle image upload from file input
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
        alert('Please select an image file.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Load image into state
        const img = new Image();
        img.onload = function() {
            // Store original image size
            appState.originalImageSize = {
                width: img.width,
                height: img.height
            };
            
            // Draw image on canvas
            const canvas = elements.targetCanvas;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Store image in state
            appState.targetImage = img;
            
            // Reset analysis state
            resetAnalysisState();
            
            // Show analysis screen
            showScreen(elements.analysisScreen);
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

function resetAnalysisState() {
    // Reset state
    appState.targetCenter = null;
    appState.shots = [];
    appState.totalScore = 0;
    appState.groupSize = 0;
    appState.meanRadius = 0;
    appState.windage = 0;
    appState.elevation = 0;
    appState.isAddingShot = false;
    
    // Update UI
    updateScoreDisplay();
    updateStatisticsDisplay();
    updateShotDetailsTable();
    
    // Hide add shot overlay
    elements.addShotOverlay.style.display = 'none';
}

// Camera functions
function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser');
        showScreen(elements.welcomeScreen);
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
    })
    .then(stream => {
        elements.cameraView.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
        showScreen(elements.welcomeScreen);
    });
}

function stopCamera() {
    if (elements.cameraView.srcObject) {
        const tracks = elements.cameraView.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        elements.cameraView.srcObject = null;
    }
}

function captureImage() {
    if (!elements.cameraView.srcObject) return;
    
    // Create a canvas to capture the image
    const canvas = document.createElement('canvas');
    canvas.width = elements.cameraView.videoWidth;
    canvas.height = elements.cameraView.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw the current video frame to the canvas
    ctx.drawImage(elements.cameraView, 0, 0, canvas.width, canvas.height);
    
    // Convert to image
    const img = new Image();
    img.onload = function() {
        // Store original image size
        appState.originalImageSize = {
            width: img.width,
            height: img.height
        };
        
        // Draw image on target canvas
        const targetCanvas = elements.targetCanvas;
        targetCanvas.width = img.width;
        targetCanvas.height = img.height;
        const targetCtx = targetCanvas.getContext('2d');
        targetCtx.drawImage(img, 0, 0);
        
        // Store image in state
        appState.targetImage = img;
        
        // Reset analysis state
        resetAnalysisState();
        
        // Show analysis screen
        showScreen(elements.analysisScreen);
        
        // Stop camera
        stopCamera();
    };
    
    img.src = canvas.toDataURL('image/png');
}

// Target analysis functions
function analyzeTarget() {
    if (!appState.targetImage) return;
    
    // Show loading indicator (could be added to HTML)
    console.log('Analyzing target...');
    
    // For demo purposes, we'll simulate a brief analysis time
    setTimeout(() => {
        // Detect target center
        detectTargetCenter();
        
        // Set ring diameters based on target type
        setRingDiametersForCurrentType();
        
        // Detect shots (bullet holes)
        // In a real app, use computer vision for this
        detectShots();
        
        // Draw analyzed image
        drawAnalyzedImage();
        
        console.log('Analysis complete');
    }, 1000);
}

function detectTargetCenter() {
    // In a real application, you would use computer vision (OpenCV.js)
    // to detect the circular target and find its center
    
    // For demo purposes, we'll use the center of the image
    appState.targetCenter = {
        x: appState.originalImageSize.width / 2,
        y: appState.originalImageSize.height / 2
    };
    
    console.log('Target center detected at:', appState.targetCenter);
}

function setRingDiametersForCurrentType() {
    if (!appState.originalImageSize) return;
    
    const shortestDimension = Math.min(
        appState.originalImageSize.width,
        appState.originalImageSize.height
    );
    
    switch (appState.targetType) {
        case 'standard':
            // Standard pistol/rifle target
            const baseStandard = shortestDimension / 8;
            appState.ringDiameters = [
                baseStandard * 1.0,  // 10 ring
                baseStandard * 2.0,  // 9 ring
                baseStandard * 3.0,  // 8 ring
                baseStandard * 4.0,  // 7 ring
                baseStandard * 5.0,  // 6 ring
                baseStandard * 5.6,  // 5 ring
                baseStandard * 6.2,  // 4 ring
                baseStandard * 6.8,  // 3 ring
                baseStandard * 7.4,  // 2 ring
                baseStandard * 8.0   // 1 ring
            ];
            break;
            
        case 'airRifle':
            // Air rifle target
            const baseAir = shortestDimension / 10;
            appState.ringDiameters = [
                baseAir * 1.0,  // 10 ring
                baseAir * 2.0,  // 9 ring
                baseAir * 3.0,  // 8 ring
                baseAir * 4.0,  // 7 ring
                baseAir * 5.0,  // 6 ring
                baseAir * 6.0,  // 5 ring
                baseAir * 7.0,  // 4 ring
                baseAir * 8.0,  // 3 ring
                baseAir * 9.0,  // 2 ring
                baseAir * 10.0  // 1 ring
            ];
            break;
            
        case 'custom':
            // Custom calibration - ring diameters should already be set
            if (appState.ringDiameters.length === 0) {
                // Default if not calibrated
                const baseCustom = shortestDimension / 8;
                appState.ringDiameters = [
                    baseCustom * 1.0,
                    baseCustom * 2.0,
                    baseCustom * 3.0,
                    baseCustom * 4.0,
                    baseCustom * 5.0,
                    baseCustom * 6.0,
                    baseCustom * 7.0,
                    baseCustom * 8.0,
                    baseCustom * 9.0,
                    baseCustom * 10.0
                ];
            }
            break;
    }
}

function detectShots() {
    // Reset shots array
    appState.shots = [];
    appState.totalScore = 0;
    
    // In a real application, you would use computer vision to detect bullet holes
    // For this demo, we'll simulate some random shots
    if (appState.targetCenter) {
        // Create some demo shots around the center
        const randomShots = [
            { offsetX: 15, offsetY: 20 },
            { offsetX: -30, offsetY: 10 },
            { offsetX: 5, offsetY: -25 },
            { offsetX: -10, offsetY: -15 },
            { offsetX: 40, offsetY: 50 }
        ];
        
        for (const shot of randomShots) {
            addShot({
                x: appState.targetCenter.x + shot.offsetX,
                y: appState.targetCenter.y + shot.offsetY
            });
        }
    }
}

function addShot(position) {
    if (!appState.targetCenter) return;
    
    // Calculate distance from center in pixels
    const dx = position.x - appState.targetCenter.x;
    const dy = position.y - appState.targetCenter.y;
    const distancePx = Math.sqrt(dx*dx + dy*dy);
    
    // Convert to mm
    const distanceMm = distancePx * appState.pixelToMmRatio;
    
    // Determine score based on distance
    let score = 0;
    for (let i = 0; i < appState.ringDiameters.length; i++) {
        if (distancePx <= appState.ringDiameters[i] / 2) {
            score = appState.ringValues[i];
            break;
        }
    }
    
    // Create shot object
    const shot = {
        position: position,
        distance: distanceMm,
        score: score,
        x: dx * appState.pixelToMmRatio,
        y: dy * appState.pixelToMmRatio
    };
    
    // Add to shots array
    appState.shots.push(shot);
    
    // Update total score
    appState.totalScore += score;
    
    // Update UI
    updateScoreDisplay();
    updateShotDetailsTable();
    
    // Update statistics
    updateStatistics();
}

function updateStatistics() {
    if (!appState.targetCenter || appState.shots.length === 0) {
        appState.groupSize = 0;
        appState.meanRadius = 0;
        appState.windage = 0;
        appState.elevation = 0;
        updateStatisticsDisplay();
        return;
    }
    
    // Calculate distances, x and y offsets
    const distances = appState.shots.map(shot => shot.distance);
    const xOffsets = appState.shots.map(shot => shot.x);
    const yOffsets = appState.shots.map(shot => shot.y);
    
    // Mean radius (average distance from center)
    appState.meanRadius = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    
    // Group size (extreme spread) - distance between farthest shots
    if (appState.shots.length >= 2) {
        let maxDistance = 0;
        
        for (let i = 0; i < appState.shots.length; i++) {
            for (let j = i + 1; j < appState.shots.length; j++) {
                const shot1 = appState.shots[i];
                const shot2 = appState.shots[j];
                
                const dx = shot1.x - shot2.x;
                const dy = shot1.y - shot2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > maxDistance) {
                    maxDistance = dist;
                }
            }
        }
        
        appState.groupSize = maxDistance;
    } else {
        appState.groupSize = 0;
    }
    
    // Calculate average windage and elevation
    appState.windage = xOffsets.reduce((sum, x) => sum + x, 0) / xOffsets.length;
    appState.elevation = yOffsets.reduce((sum, y) => sum + y, 0) / yOffsets.length;
    
    // Update UI
    updateStatisticsDisplay();
}

function updateScoreDisplay() {
    elements.totalScore.textContent = appState.totalScore;
}

function updateStatisticsDisplay() {
    elements.groupSize.textContent = appState.groupSize.toFixed(1) + ' mm';
    elements.meanRadius.textContent = appState.meanRadius.toFixed(1) + ' mm';
    elements.windage.textContent = appState.windage.toFixed(1) + ' mm';
    elements.elevation.textContent = appState.elevation.toFixed(1) + ' mm';
}

function updateShotDetailsTable() {
    // Clear the table
    elements.shotDetailsBody.innerHTML = '';
    
    // Add each shot to the table
    appState.shots.forEach((shot, index) => {
        const row = document.createElement('tr');
        
        const shotNumCell = document.createElement('td');
        shotNumCell.textContent = index + 1;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = shot.score;
        
        const xCell = document.createElement('td');
        xCell.textContent = shot.x.toFixed(1);
        
        const yCell = document.createElement('td');
        yCell.textContent = shot.y.toFixed(1);
        
        const distanceCell = document.createElement('td');
        distanceCell.textContent = shot.distance.toFixed(1);
        
        row.appendChild(shotNumCell);
        row.appendChild(scoreCell);
        row.appendChild(xCell);
        row.appendChild(yCell);
        row.appendChild(distanceCell);
        
        elements.shotDetailsBody.appendChild(row);
    });
}

function drawAnalyzedImage() {
    if (!appState.targetImage || !appState.targetCenter) return;
    
    const canvas = elements.targetCanvas;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original image
    ctx.drawImage(appState.targetImage, 0, 0);
    
    // Draw target center
    ctx.beginPath();
    ctx.arc(appState.targetCenter.x, appState.targetCenter.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    
    // Draw scoring rings
    for (let i = 0; i < appState.ringDiameters.length; i++) {
        const diameter = appState.ringDiameters[i];
        const radius = diameter / 2;
        
        ctx.beginPath();
        ctx.arc(appState.targetCenter.x, appState.targetCenter.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw ring value
        const value = appState.ringValues[i];
        const angle = Math.PI / 4; // 45 degrees, 2 o'clock position
        const textX = appState.targetCenter.x + radius * Math.cos(angle);
        const textY = appState.targetCenter.y - radius * Math.sin(angle);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'green';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), textX, textY);
    }
    
    // Draw shots
    appState.shots.forEach((shot, index) => {
        // Draw bullet hole
        ctx.beginPath();
        ctx.arc(shot.position.x, shot.position.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill center
        ctx.beginPath();
        ctx.arc(shot.position.x, shot.position.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        
        // Draw shot number
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'left';
        ctx.fillText((index + 1).toString(), shot.position.x + 15, shot.position.y);
    });
}

function toggleAddShotMode() {
    appState.isAddingShot = !appState.isAddingShot;
    elements.addShotOverlay.style.display = appState.isAddingShot ? 'flex' : 'none';
    
    // Toggle active state on button
    if (appState.isAddingShot) {
        elements.addShotBtn.classList.add('active');
    } else {
        elements.addShotBtn.classList.remove('active');
    }
}

function handleCanvasClick(event) {
    if (!appState.isAddingShot || !appState.targetCenter) return;
    
    // Get click coordinates relative to canvas
    const rect = elements.targetCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale coordinates to original image size if canvas was resized
    const scaleX = elements.targetCanvas.width / rect.width;
    const scaleY = elements.targetCanvas.height / rect.height;
    
    // Add shot at this position
    addShot({
        x: x * scaleX,
        y: y * scaleY
    });
    
    // Redraw image
    drawAnalyzedImage();
    
    // Turn off add shot mode
    toggleAddShotMode();
}

function removeLastShot() {
    if (appState.shots.length === 0) return;
    
    // Get the last shot's score
    const lastScore = appState.shots[appState.shots.length - 1].score;
    
    // Remove the last shot
    appState.shots.pop();
    
    // Update total score
    appState.totalScore -= lastScore;
    
    // Update UI
    updateScoreDisplay();
    updateShotDetailsTable();
    
    // Update statistics
    updateStatistics();
    
    // Redraw image
    drawAnalyzedImage();
}

function setTargetType(type) {
    appState.targetType = type;
    
    // Update ring diameters based on target type
    setRingDiametersForCurrentType();
    
    // Recalculate scores
    recalculateScores();
    
    // Redraw image
    drawAnalyzedImage();
}

function calibrateTarget() {
    const value = parseFloat(elements.calibrationInput.value);
    
    if (isNaN(value) || value <= 0) {
        alert('Please enter a valid diameter');
        return;
    }
    
    // Set target type to custom
    appState.targetType = 'custom';
    
    // Get the 10-ring diameter in pixels
    const tenRingDiameterPx = appState.ringDiameters[0];
    
    // Calculate the pixel-to-mm ratio
    appState.pixelToMmRatio = value / tenRingDiameterPx;
    
    // Recalculate scores
    recalculateScores();
    
    // Redraw image
    drawAnalyzedImage();
    
    // Hide calibration modal
    hideModal(elements.calibrationModal);
}

function recalculateScores() {
    if (!appState.targetCenter) return;
    
    // Reset total score
    appState.totalScore = 0;
    
    // Recalculate each shot's score
    const newShots = [];
    
    for (const shot of appState.shots) {
        // Calculate distance from center in pixels
        const dx = shot.position.x - appState.targetCenter.x;
        const dy = shot.position.y - appState.targetCenter.y;
        const distancePx = Math.sqrt(dx*dx + dy*dy);
        
        // Convert to mm
        const distanceMm = distancePx * appState.pixelToMmRatio;
        
        // Determine score based on distance
        let score = 0;
        for (let i = 0; i < appState.ringDiameters.length; i++) {
            if (distancePx <= appState.ringDiameters[i] / 2) {
                score = appState.ringValues[i];
                break;
            }
        }
        
        // Create new shot with updated values
        const newShot = {
            position: shot.position,
            distance: distanceMm,
            score: score,
            x: dx * appState.pixelToMmRatio,
            y: dy * appState.pixelToMmRatio
        };
        
        newShots.push(newShot);
        appState.totalScore += score;
    }
    
    // Update shots array
    appState.shots = newShots;
    
    // Update UI
    updateScoreDisplay();
    updateShotDetailsTable();
    
    // Update statistics
    updateStatistics();
}

function exportResults() {
    // Create a summary text
    const summaryText = `
TargetScan Analysis Results

Total Score: ${appState.totalScore}
Number of Shots: ${appState.shots.length}
Group Size: ${appState.groupSize.toFixed(1)} mm
Mean Radius: ${appState.meanRadius.toFixed(1)} mm
Average Windage: ${appState.windage.toFixed(1)} mm
Average Elevation: ${appState.elevation.toFixed(1)} mm

Shot Details:
${appState.shots.map((shot, index) => 
    `Shot #${index + 1}: Score ${shot.score}, Distance ${shot.distance.toFixed(1)} mm`
).join('\n')}
`;
    
    // Create a download link
    const element = document.createElement('a');
    const file = new Blob([summaryText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `TargetScan_Results_${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Append to body, click, and remove
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
