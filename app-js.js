// TargetScan - Dual-Target Analysis Web App
// Main application script

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const cameraButton = document.getElementById('camera-button');
    const cameraContainer = document.getElementById('camera-container');
    const cameraPreview = document.getElementById('camera-preview');
    const captureButton = document.getElementById('capture-button');
    const closeCamera = document.getElementById('close-camera');
    const uploadSection = document.getElementById('upload-section');
    const analysisSection = document.getElementById('analysis-section');
    const targetCanvas = document.getElementById('target-canvas');
    const leftTargetBtn = document.getElementById('left-target-btn');
    const rightTargetBtn = document.getElementById('right-target-btn');
    const autoDetectBtn = document.getElementById('auto-detect-btn');
    const manualModeBtn = document.getElementById('manual-mode-btn');
    const clearShotsBtn = document.getElementById('clear-shots-btn');
    const exportBtn = document.getElementById('export-btn');
    const shotCount = document.getElementById('shot-count');
    const totalScore = document.getElementById('total-score');
    const groupSize = document.getElementById('group-size');
    const meanRadius = document.getElementById('mean-radius');
    const windage = document.getElementById('windage');
    const elevation = document.getElementById('elevation');
    const shotTableBody = document.getElementById('shot-table-body');
    const themeSwitch = document.getElementById('theme-switch');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    // Application State
    const state = {
        targetImage: null,
        ctx: targetCanvas.getContext('2d'),
        currentTarget: 'left', // 'left' or 'right'
        manualMode: false,
        leftTargetShots: [],
        rightTargetShots: [],
        targetCenter: { x: 0, y: 0 },
        targetRadius: 0,
        pixelsPerInch: 0,
        stream: null,
        darkMode: false
    };

    // Constants
    const MAX_SHOTS = 10;
    const RING_VALUES = {
        bullseye: 11,
        ring10: 10,
        ring9: 9,
        ring8: 8,
        ring7: 7,
        outside: 0
    };

    // Show instructions modal on first load
    instructionsModal.style.display = 'block';

    // Close modal on X click
    closeModal.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });

    // Close modal on button click
    modalOkBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === instructionsModal) {
            instructionsModal.style.display = 'none';
        }
    });

    // Theme switcher
    themeSwitch.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        state.darkMode = !state.darkMode;
        
        const icon = themeSwitch.querySelector('i');
        const text = themeSwitch.querySelector('span');
        
        if (state.darkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            text.textContent = 'Light Mode';
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            text.textContent = 'Dark Mode';
        }
    });

    // File Input Handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    state.targetImage = img;
                    initializeAnalysis();
                };
                img.src = event.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });

    // Camera Handlers
    cameraButton.addEventListener('click', () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then((stream) => {
                    state.stream = stream;
                    cameraPreview.srcObject = stream;
                    cameraContainer.hidden = false;
                })
                .catch((error) => {
                    console.error("Error accessing camera:", error);
                    alert("Error accessing camera. Please check permissions.");
                });
        } else {
            alert("Camera not supported in this browser.");
        }
    });

    captureButton.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = cameraPreview.videoWidth;
        canvas.height = cameraPreview.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
        
        const img = new Image();
        img.onload = () => {
            state.targetImage = img;
            stopCamera();
            initializeAnalysis();
        };
        img.src = canvas.toDataURL('image/png');
    });

    closeCamera.addEventListener('click', stopCamera);

    function stopCamera() {
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
        }
        cameraContainer.hidden = true;
    }

    // Initialize Analysis View
    function initializeAnalysis() {
        uploadSection.classList.add('hidden');
        analysisSection.classList.remove('hidden');
        
        // Set up canvas
        const aspectRatio = state.targetImage.height / state.targetImage.width;
        targetCanvas.width = 500; // Fixed width
        targetCanvas.height = targetCanvas.width * aspectRatio;
        
        // Draw image on canvas
        drawTargetImage();
        
        // Reset shot data
        state.leftTargetShots = [];
        state.rightTargetShots = [];
        updateShotDisplay();
    }

    // Draw the target image on canvas
    function drawTargetImage() {
        state.ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        state.ctx.drawImage(state.targetImage, 0, 0, targetCanvas.width, targetCanvas.height);
    }

    // Target toggle handlers
    leftTargetBtn.addEventListener('click', () => {
        state.currentTarget = 'left';
        leftTargetBtn.classList.add('active');
        rightTargetBtn.classList.remove('active');
        updateShotDisplay();
    });

    rightTargetBtn.addEventListener('click', () => {
        state.currentTarget = 'right';
        rightTargetBtn.classList.add('active');
        leftTargetBtn.classList.remove('active');
        updateShotDisplay();
    });

    // Auto-detect shots
    autoDetectBtn.addEventListener('click', () => {
        // In a real app, this would use computer vision to detect shots
        // For this demo, we'll simulate detection with random shots
        simulateAutoDetection();
    });

    // Simulate automatic shot detection (placeholder)
    function simulateAutoDetection() {
        const currentShots = getCurrentShots();
        
        if (currentShots.length >= MAX_SHOTS) {
            alert("Maximum shots reached for this target.");
            return;
        }
        
        // Calculate target center based on which target is selected (left or right)
        detectTargetCenter();
        
        // Generate some simulated shots around the center
        const shotsToAdd = Math.min(MAX_SHOTS - currentShots.length, 10);
        
        for (let i = 0; i < shotsToAdd; i++) {
            // Random distance from center (mostly within rings but some outliers)
            const distance = Math.random() * state.targetRadius * 1.2;
            // Random angle
            const angle = Math.random() * Math.PI * 2;
            
            // Calculate x and y coordinates based on distance and angle
            const x = state.targetCenter.x + Math.cos(angle) * distance;
            const y = state.targetCenter.y + Math.sin(angle) * distance;
            
            // Add the shot
            addShot(x, y);
        }
        
        updateShotDisplay();
    }

    // Detect target center and radius
    function detectTargetCenter() {
        // In a real app, this would use image processing to find the target
        // For this demo, we'll estimate based on the image dimensions
        
        const canvasWidth = targetCanvas.width;
        const canvasHeight = targetCanvas.height;
        
        // Estimate the radius as 1/6 of the canvas height
        state.targetRadius = canvasHeight / 6;
        
        // Calculate the centers of the left and right targets
        // Assuming they're positioned at 1/4 and 3/4 of the width
        if (state.currentTarget === 'left') {
            state.targetCenter = {
                x: canvasWidth * 0.25,
                y: canvasHeight * 0.5
            };
        } else {
            state.targetCenter = {
                x: canvasWidth * 0.75,
                y: canvasHeight * 0.5
            };
        }
        
        // Estimate pixels per inch (assuming the standard target diameter is about 4 inches)
        state.pixelsPerInch = (state.targetRadius * 2) / 4;
    }

    // Toggle manual mode
    manualModeBtn.addEventListener('click', () => {
        state.manualMode = !state.manualMode;
        
        if (state.manualMode) {
            manualModeBtn.classList.add('active');
            targetCanvas.style.cursor = 'crosshair';
            alert("Manual mode enabled. Click on the target to place shots.");
        } else {
            manualModeBtn.classList.remove('active');
            targetCanvas.style.cursor = 'default';
        }
    });

    // Canvas click handler for manual shot placement
    targetCanvas.addEventListener('click', (e) => {
        if (!state.manualMode) return;
        
        const currentShots = getCurrentShots();
        if (currentShots.length >= MAX_SHOTS) {
            alert("Maximum shots reached for this target.");
            return;
        }
        
        // Get click coordinates relative to canvas
        const rect = targetCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (targetCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (targetCanvas.height / rect.height);
        
        addShot(x, y);
        updateShotDisplay();
    });

    // Add a shot to the current target
    function addShot(x, y) {
        // Ensure we have a target center
        if (state.targetCenter.x === 0 && state.targetCenter.y === 0) {
            detectTargetCenter();
        }
        
        // Calculate distance from center in pixels
        const distancePixels = Math.sqrt(
            Math.pow(x - state.targetCenter.x, 2) + 
            Math.pow(y - state.targetCenter.y, 2)
        );
        
        // Convert to inches
        const distanceInches = state.pixelsPerInch > 0 ? 
            distancePixels / state.pixelsPerInch : 
            distancePixels / 50; // Fallback estimate
        
        // Determine ring/score based on distance
        let score;
        if (distancePixels <= state.targetRadius * 0.1) {
            score = RING_VALUES.bullseye; // Bullseye
        } else if (distancePixels <= state.targetRadius * 0.2) {
            score = RING_VALUES.ring10;
        } else if (distancePixels <= state.targetRadius * 0.4) {
            score = RING_VALUES.ring9;
        } else if (distancePixels <= state.targetRadius * 0.6) {
            score = RING_VALUES.ring8;
        } else if (distancePixels <= state.targetRadius * 0.8) {
            score = RING_VALUES.ring7;
        } else {
            score = RING_VALUES.outside; // Outside scoring rings
        }
        
        // Calculate position relative to center in inches
        const xOffset = state.pixelsPerInch > 0 ? 
            (x - state.targetCenter.x) / state.pixelsPerInch : 
            (x - state.targetCenter.x) / 50;
        
        const yOffset = state.pixelsPerInch > 0 ? 
            (y - state.targetCenter.y) / state.pixelsPerInch : 
            (y - state.targetCenter.y) / 50;
        
        // Create shot object
        const shot = {
            x: x,
            y: y,
            score: score,
            distanceInches: distanceInches.toFixed(2),
            xOffset: xOffset.toFixed(2),
            yOffset: yOffset.toFixed(2)
        };
        
        // Add to appropriate target
        if (state.currentTarget === 'left') {
            state.leftTargetShots.push(shot);
        } else {
            state.rightTargetShots.push(shot);
        }
    }

    // Clear shots for current target
    clearShotsBtn.addEventListener('click', () => {
        if (state.currentTarget === 'left') {
            state.leftTargetShots = [];
        } else {
            state.rightTargetShots = [];
        }
        updateShotDisplay();
    });

    // Export results
    exportBtn.addEventListener('click', () => {
        const leftTotal = calculateTotalScore(state.leftTargetShots);
        const rightTotal = calculateTotalScore(state.rightTargetShots);
        const grandTotal = leftTotal + rightTotal;
        
        const leftStats = calculateStatistics(state.leftTargetShots);
        const rightStats = calculateStatistics(state.rightTargetShots);
        
        const exportText = `TargetScan Results\n` +
            `Date: ${new Date().toLocaleDateString()}\n\n` +
            `Left Target:\n` +
            `- Total Score: ${leftTotal}\n` +
            `- Shots: ${state.leftTargetShots.length}/10\n` +
            `- Group Size: ${leftStats.groupSize}"\n` +
            `- Mean Radius: ${leftStats.meanRadius}"\n` +
            `- Windage: ${leftStats.windage}"\n` +
            `- Elevation: ${leftStats.elevation}"\n\n` +
            `Right Target:\n` +
            `- Total Score: ${rightTotal}\n` +
            `- Shots: ${state.rightTargetShots.length}/10\n` +
            `- Group Size: ${rightStats.groupSize}"\n` +
            `- Mean Radius: ${rightStats.meanRadius}"\n` +
            `- Windage: ${rightStats.windage}"\n` +
            `- Elevation: ${rightStats.elevation}"\n\n` +
            `Grand Total: ${grandTotal}\n\n` +
            `Shot Details (Left Target):\n` +
            formatShotDetails(state.leftTargetShots) + `\n\n` +
            `Shot Details (Right Target):\n` +
            formatShotDetails(state.rightTargetShots);
        
        // Create download link for text file
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TargetScan_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Format shot details for export
    function formatShotDetails(shots) {
        if (shots.length === 0) return "No shots recorded.";
        
        let details = "";
        shots.forEach((shot, index) => {
            details += `Shot ${index + 1}: Score ${shot.score}, ` +
                `Position (${shot.xOffset}", ${shot.yOffset}"), ` +
                `Distance ${shot.distanceInches}"\n`;
        });
        
        return details;
    }

    // Helper to get current shots array
    function getCurrentShots() {
        return state.currentTarget === 'left' ? state.leftTargetShots : state.rightTargetShots;
    }

    // Update shot display and statistics
    function updateShotDisplay() {
        // Redraw target image
        drawTargetImage();
        
        const currentShots = getCurrentShots();
        
        // Update shot counter
        shotCount.textContent = currentShots.length;
        
        // Draw shots on canvas
        drawShots(currentShots);
        
        // Update statistics
        updateStatistics(currentShots);
        
        // Update shot table
        updateShotTable(currentShots);
    }

    // Draw shots on canvas
    function drawShots(shots) {
        shots.forEach((shot, index) => {
            // Draw shot marker
            state.ctx.beginPath();
            state.ctx.arc(shot.x, shot.y, 5, 0, Math.PI * 2);
            state.ctx.fillStyle = getScoreColor(shot.score);
            state.ctx.fill();
            
            // Draw shot number
            state.ctx.fillStyle = 'white';
            state.ctx.strokeStyle = 'black';
            state.ctx.lineWidth = 2;
            state.ctx.font = 'bold 10px Arial';
            state.ctx.textAlign = 'center';
            state.ctx.textBaseline = 'middle';
            state.ctx.strokeText(index + 1, shot.x, shot.y);
            state.ctx.fillText(index + 1, shot.x, shot.y);
        });
    }

    // Get color based on score
    function getScoreColor(score) {
        if (score === RING_VALUES.bullseye) return 'red';
        if (score === RING_VALUES.ring10) return 'orange';
        if (score === RING_VALUES.ring9) return 'yellow';
        if (score === RING_VALUES.ring8) return 'green';
        if (score === RING_VALUES.ring7) return 'blue';
        return 'purple'; // Outside scoring rings
    }

    // Calculate total score
    function calculateTotalScore(shots) {
        return shots.reduce((total, shot) => total + shot.score, 0);
    }

    // Calculate statistics for shots
    function calculateStatistics(shots) {
        if (shots.length < 2) {
            return {
                groupSize: "0.0",
                meanRadius: "0.0",
                windage: "0.0",
                elevation: "0.0"
            };
        }
        
        // Calculate mean center of shots
        const xSum = shots.reduce((sum, shot) => sum + parseFloat(shot.xOffset), 0);
        const ySum = shots.reduce((sum, shot) => sum + parseFloat(shot.yOffset), 0);
        const meanX = xSum / shots.length;
        const meanY = ySum / shots.length;
        
        // Calculate mean radius (average distance from center of target)
        const radiusSum = shots.reduce((sum, shot) => sum + parseFloat(shot.distanceInches), 0);
        const meanRadiusValue = radiusSum / shots.length;
        
        // Calculate group size (maximum distance between any two shots)
        let maxDistance = 0;
        for (let i = 0; i < shots.length; i++) {
            for (let j = i + 1; j < shots.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(parseFloat(shots[i].xOffset) - parseFloat(shots[j].xOffset), 2) +
                    Math.pow(parseFloat(shots[i].yOffset) - parseFloat(shots[j].yOffset), 2)
                );
                maxDistance = Math.max(maxDistance, distance);
            }
        }
        
        return {
            groupSize: maxDistance.toFixed(2),
            meanRadius: meanRadiusValue.toFixed(2),
            windage: meanX.toFixed(2),
            elevation: meanY.toFixed(2)
        };
    }

    // Update statistics display
    function updateStatistics(shots) {
        const score = calculateTotalScore(shots);
        totalScore.textContent = score;
        
        const stats = calculateStatistics(shots);
        groupSize.textContent = stats.groupSize + '"';
        meanRadius.textContent = stats.meanRadius + '"';
        windage.textContent = stats.windage + '"';
        elevation.textContent = stats.elevation + '"';
    }

    // Update shot table
    function updateShotTable(shots) {
        // Clear table
        shotTableBody.innerHTML = '';
        
        // Add shots to table
        shots.forEach((shot, index) => {
            const row = document.createElement('tr');
            
            const numberCell = document.createElement('td');
            numberCell.textContent = index + 1;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = shot.score;
            
            const xPosCell = document.createElement('td');
            xPosCell.textContent = shot.xOffset + '"';
            
            const yPosCell = document.createElement('td');
            yPosCell.textContent = shot.yOffset + '"';
            
            const distanceCell = document.createElement('td');
            distanceCell.textContent = shot.distanceInches + '"';
            
            row.appendChild(numberCell);
            row.appendChild(scoreCell);
            row.appendChild(xPosCell);
            row.appendChild(yPosCell);
            row.appendChild(distanceCell);
            
            shotTableBody.appendChild(row);
        });
        
        // Add empty rows if needed
        const emptyRows = MAX_SHOTS - shots.length;
        for (let i = 0; i < emptyRows; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('td');
                cell.textContent = '-';
                row.appendChild(cell);
            }
            shotTableBody.appendChild(row);
        }
    }
});