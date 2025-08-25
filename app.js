// ACC Telemetry Analysis Application
class ACCTelemetryAnalyzer {
    constructor() {
        this.telemetryData = [];
        this.setupData = {};
        this.analysisResults = {};
        this.isProcessing = false;
        
        // Configuration from provided data
        this.setupParameters = [
            {"key": "front_spring_rate", "label": "Front Spring Rate (N/m)", "min": 80000, "max": 200000, "step": 1000},
            {"key": "rear_spring_rate", "label": "Rear Spring Rate (N/m)", "min": 80000, "max": 200000, "step": 1000},
            {"key": "front_toe", "label": "Front Toe (°)", "min": -0.30, "max": 0.30, "step": 0.01},
            {"key": "rear_toe", "label": "Rear Toe (°)", "min": -0.30, "max": 0.30, "step": 0.01},
            {"key": "front_camber", "label": "Front Camber (°)", "min": -5.0, "max": 0.0, "step": 0.1},
            {"key": "rear_camber", "label": "Rear Camber (°)", "min": -3.0, "max": 0.0, "step": 0.1},
            {"key": "front_arb", "label": "Front Anti-Roll Bar", "min": 1, "max": 6, "step": 1},
            {"key": "rear_arb", "label": "Rear Anti-Roll Bar", "min": 1, "max": 6, "step": 1},
            {"key": "differential_power", "label": "Differential Power (%)", "min": 0, "max": 100, "step": 1},
            {"key": "brake_balance", "label": "Brake Balance (%)", "min": 50.0, "max": 70.0, "step": 0.1}
        ];

        this.sampleSetup = {
            "front_spring_rate": 120000,
            "rear_spring_rate": 110000,
            "front_toe": 0.05,
            "rear_toe": 0.15,
            "front_camber": -3.2,
            "rear_camber": -1.8,
            "front_arb": 3,
            "rear_arb": 4,
            "differential_power": 65,
            "brake_balance": 58.5
        };

        this.physicsConstants = {
            UNDERSTEER_THRESHOLD: 0.1,
            OVERSTEER_THRESHOLD: -0.1,
            WHEELBASE: 2.7,
            TRACK_WIDTH: 1.65,
            MASS: 1300,
            CENTER_OF_GRAVITY_HEIGHT: 0.5,
            MAX_LATERAL_G: 2.5
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateSampleTelemetryData();
    }

    setupEventListeners() {
        // File upload listeners
        document.getElementById('csvFileInput').addEventListener('change', (e) => {
            this.handleCSVUpload(e.target.files[0]);
        });

        document.getElementById('setupFileInput').addEventListener('change', (e) => {
            this.handleSetupUpload(e.target.files[0]);
        });

        // Sample data button
        document.getElementById('loadSampleData').addEventListener('click', () => {
            this.loadSampleData();
        });

        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const csvUpload = document.getElementById('csvUpload');
        const setupUpload = document.getElementById('setupUpload');

        [csvUpload, setupUpload].forEach(element => {
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                element.classList.add('dragover');
            });

            element.addEventListener('dragleave', () => {
                element.classList.remove('dragover');
            });

            element.addEventListener('drop', (e) => {
                e.preventDefault();
                element.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    if (element.id === 'csvUpload') {
                        this.handleCSVUpload(files[0]);
                    } else {
                        this.handleSetupUpload(files[0]);
                    }
                }
            });
        });
    }

    async handleCSVUpload(file) {
        if (!file || !file.name.toLowerCase().endsWith('.csv')) {
            this.showUploadStatus('csvStatus', 'Please select a valid CSV file', 'error');
            return;
        }

        this.showUploadStatus('csvStatus', 'Processing CSV file...', 'processing');
        this.showProgress('csvProgress', 0);

        try {
            const text = await this.readFileAsText(file);
            await this.processCSVData(text);
            this.showUploadStatus('csvStatus', `✓ Processed ${this.telemetryData.length} data points`, 'success');
            this.hideProgress('csvProgress');
            
            if (Object.keys(this.setupData).length > 0) {
                this.startAnalysis();
            }
        } catch (error) {
            console.error('CSV processing error:', error);
            this.showUploadStatus('csvStatus', 'Error processing CSV file', 'error');
            this.hideProgress('csvProgress');
        }
    }

    async handleSetupUpload(file) {
        if (!file || !file.name.toLowerCase().endsWith('.json')) {
            this.showUploadStatus('setupStatus', 'Please select a valid JSON file', 'error');
            return;
        }

        this.showUploadStatus('setupStatus', 'Loading setup configuration...', 'processing');
        this.showProgress('setupProgress', 50);

        try {
            const text = await this.readFileAsText(file);
            const setupData = JSON.parse(text);
            
            this.setupData = { ...this.sampleSetup, ...setupData };
            this.generateSetupControls();
            this.showUploadStatus('setupStatus', '✓ Setup configuration loaded', 'success');
            this.hideProgress('setupProgress');
            
            if (this.telemetryData.length > 0) {
                this.startAnalysis();
            }
        } catch (error) {
            console.error('Setup file processing error:', error);
            this.showUploadStatus('setupStatus', 'Error processing setup file', 'error');
            this.hideProgress('setupProgress');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async processCSVData(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        this.telemetryData = [];
        const chunkSize = 1000;
        const totalLines = lines.length - 1;

        for (let i = 1; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, Math.min(i + chunkSize, lines.length));
            
            chunk.forEach(line => {
                if (line.trim()) {
                    const values = line.split(',').map(v => v.trim());
                    const dataPoint = {};
                    
                    headers.forEach((header, index) => {
                        const value = values[index];
                        dataPoint[header] = isNaN(value) ? value : parseFloat(value);
                    });
                    
                    this.telemetryData.push(dataPoint);
                }
            });

            // Update progress
            const progress = Math.min(100, (i / totalLines) * 100);
            this.showProgress('csvProgress', progress);
            
            // Allow UI updates
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    generateSampleTelemetryData() {
        // Generate more comprehensive sample data for demo
        this.sampleTelemetryData = [];
        const trackLength = 2000; // 2km track
        const dataPoints = 200;
        
        for (let i = 0; i < dataPoints; i++) {
            const distance = (i / dataPoints) * trackLength;
            const time = i * 0.1;
            
            // Simulate a lap with varying conditions
            const straightSpeed = 200 + Math.sin(distance / 200) * 30;
            const cornerFactor = Math.abs(Math.sin(distance / 100));
            const speed = straightSpeed * (1 - cornerFactor * 0.4);
            
            const lateralG = cornerFactor * 1.8 + (Math.random() - 0.5) * 0.2;
            const yawRate = cornerFactor * 0.8 + (Math.random() - 0.5) * 0.1;
            const steerAngle = cornerFactor * 25 + (Math.random() - 0.5) * 5;
            
            this.sampleTelemetryData.push({
                Time: time,
                Distance: distance,
                SPEED: speed,
                LateralG: lateralG,
                ROTY: yawRate,
                Yaw_Rate: yawRate,
                STEERANGLE: steerAngle,
                THROTTLE: Math.max(0, 100 - cornerFactor * 60),
                BRAKE: Math.max(0, (cornerFactor - 0.3) * 100),
                GEAR: Math.max(2, Math.min(6, Math.floor(speed / 40)))
            });
        }
    }

    loadSampleData() {
        this.showLoadingOverlay('Loading sample telemetry data...');
        
        setTimeout(() => {
            this.telemetryData = [...this.sampleTelemetryData];
            this.setupData = { ...this.sampleSetup };
            
            this.showUploadStatus('csvStatus', `✓ Sample data loaded (${this.telemetryData.length} points)`, 'success');
            this.showUploadStatus('setupStatus', '✓ Sample setup configuration loaded', 'success');
            
            this.generateSetupControls();
            this.startAnalysis();
            
            this.hideLoadingOverlay();
        }, 1000);
    }

    generateSetupControls() {
        const container = document.getElementById('setupSliders');
        container.innerHTML = '';

        this.setupParameters.forEach(param => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'slider-control';

            const currentValue = this.setupData[param.key] || ((param.min + param.max) / 2);
            
            controlDiv.innerHTML = `
                <div class="slider-label">
                    <h4>${param.label}</h4>
                    <span class="slider-value" id="${param.key}_value">${this.formatValue(currentValue, param.step)}</span>
                </div>
                <input 
                    type="range" 
                    class="slider-input" 
                    id="${param.key}_slider"
                    min="${param.min}" 
                    max="${param.max}" 
                    step="${param.step}" 
                    value="${currentValue}"
                >
                <div class="slider-range">
                    <span>${this.formatValue(param.min, param.step)}</span>
                    <span>${this.formatValue(param.max, param.step)}</span>
                </div>
            `;

            container.appendChild(controlDiv);

            // Add event listener for real-time updates
            const slider = controlDiv.querySelector(`#${param.key}_slider`);
            const valueDisplay = controlDiv.querySelector(`#${param.key}_value`);
            
            let updateTimeout;
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = this.formatValue(value, param.step);
                this.setupData[param.key] = value;
                
                // Debounce updates
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    this.updateAnalysis();
                }, 300);
            });
        });

        document.getElementById('setupControls').classList.remove('hidden');
    }

    formatValue(value, step) {
        if (step >= 1) {
            return Math.round(value).toString();
        } else if (step >= 0.1) {
            return value.toFixed(1);
        } else {
            return value.toFixed(2);
        }
    }

    startAnalysis() {
        this.showLoadingOverlay('Analyzing telemetry data...');
        
        setTimeout(() => {
            this.performAnalysis();
            this.renderCharts();
            this.generateRecommendations();
            
            document.getElementById('analysisSection').classList.remove('hidden');
            this.hideLoadingOverlay();
        }, 1500);
    }

    updateAnalysis() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        setTimeout(() => {
            this.performAnalysis();
            this.renderCharts();
            this.generateRecommendations();
            this.isProcessing = false;
        }, 100);
    }

    performAnalysis() {
        this.analysisResults.stabilityAnalysis = this.calculateStabilityAnalysis();
        this.analysisResults.trajectoryAnalysis = this.calculateTrajectoryAnalysis();
    }

    calculateStabilityAnalysis() {
        const results = [];
        
        for (let i = 1; i < this.telemetryData.length; i++) {
            const current = this.telemetryData[i];
            const previous = this.telemetryData[i - 1];
            
            if (current.LateralG && current.ROTY && current.STEERANGLE && current.SPEED) {
                const gradient = this.calculateUndersteerGradient(current, previous);
                results.push({
                    distance: current.Distance || i * 10,
                    time: current.Time || i * 0.1,
                    gradient: gradient.gradient,
                    state: gradient.state,
                    severity: gradient.severity
                });
            }
        }

        return results;
    }

    calculateUndersteerGradient(currentPoint, previousPoint) {
        const lateralG = Math.abs(currentPoint.LateralG || 0);
        const yawRate = currentPoint.ROTY || currentPoint.Yaw_Rate || 0;
        const steeringAngle = (currentPoint.STEERANGLE || 0) * Math.PI / 180;
        const velocity = Math.max(1, (currentPoint.SPEED || 50) / 3.6); // Convert km/h to m/s

        // Calculate theoretical yaw rate based on bicycle model
        const theoreticalYawRate = (velocity * Math.tan(steeringAngle)) / this.physicsConstants.WHEELBASE;
        
        // Apply setup modifications
        const setupModifier = this.calculateSetupImpact();
        
        // Calculate understeer gradient
        const understeerGradient = ((yawRate - theoreticalYawRate) / Math.max(lateralG, 0.1)) + setupModifier.understeerImpact - setupModifier.oversteerImpact;
        
        return {
            gradient: understeerGradient,
            state: understeerGradient > this.physicsConstants.UNDERSTEER_THRESHOLD ? 'understeer' : 
                   understeerGradient < this.physicsConstants.OVERSTEER_THRESHOLD ? 'oversteer' : 'neutral',
            severity: Math.abs(understeerGradient)
        };
    }

    calculateSetupImpact() {
        let understeerImpact = 0;
        let oversteerImpact = 0;
        
        // Spring rate impact - stiffer rear promotes understeer
        const springRateDelta = (this.setupData.rear_spring_rate - this.setupData.front_spring_rate) / 10000;
        understeerImpact += springRateDelta * 0.01;
        
        // Anti-roll bar impact - stiffer rear promotes understeer
        const arbDelta = this.setupData.rear_arb - this.setupData.front_arb;
        understeerImpact += arbDelta * 0.02;
        
        // Toe impact - front toe-in promotes understeer, rear toe-in promotes oversteer
        understeerImpact += (this.setupData.front_toe * 0.1) + (this.setupData.rear_toe * -0.05);
        
        // Camber impact - more negative camber generally improves cornering
        const camberBalance = Math.abs(this.setupData.rear_camber) - Math.abs(this.setupData.front_camber);
        understeerImpact += camberBalance * 0.01;
        
        // Differential impact - higher power setting can cause oversteer
        oversteerImpact += (this.setupData.differential_power - 50) * 0.003;
        
        // Brake balance impact
        const brakeBalance = this.setupData.brake_balance - 55; // Neutral around 55%
        understeerImpact += brakeBalance * 0.002;

        return { understeerImpact, oversteerImpact };
    }

    calculateTrajectoryAnalysis() {
        const results = {
            optimal: [],
            actual: []
        };

        // Generate optimal racing line (simplified)
        for (let i = 0; i < this.telemetryData.length; i++) {
            const distance = this.telemetryData[i].Distance || i * 10;
            const trackProgress = (distance % 2000) / 2000; // Assume 2km track
            
            // Simplified track shape
            const x = Math.cos(trackProgress * Math.PI * 4) * 100 + trackProgress * 400;
            const y = Math.sin(trackProgress * Math.PI * 4) * 50 + 200;
            
            results.optimal.push({ x, y });
            
            // Actual trajectory with some deviation based on handling
            const stabilityData = this.analysisResults.stabilityAnalysis[i];
            const deviation = stabilityData ? stabilityData.gradient * 20 : 0;
            
            results.actual.push({
                x: x + Math.random() * deviation,
                y: y + Math.random() * deviation
            });
        }

        return results;
    }

    renderCharts() {
        this.renderStabilityChart();
        this.renderTrajectoryChart();
    }

    renderStabilityChart() {
        const canvas = document.getElementById('stabilityChart');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 400;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (!this.analysisResults.stabilityAnalysis) return;
        
        const data = this.analysisResults.stabilityAnalysis;
        const maxDistance = Math.max(...data.map(d => d.distance));
        const padding = 50;
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = padding + (i / 10) * (canvas.width - 2 * padding);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvas.height - padding);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let i = 0; i <= 8; i++) {
            const y = padding + (i / 8) * (canvas.height - 2 * padding);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }
        
        // Draw zero line
        const zeroY = canvas.height / 2;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(canvas.width - padding, zeroY);
        ctx.stroke();
        
        // Draw stability regions
        const chartHeight = canvas.height - 2 * padding;
        const chartWidth = canvas.width - 2 * padding;
        
        // Background regions
        ctx.globalAlpha = 0.3;
        
        // Understeer region (top)
        ctx.fillStyle = '#ff5555';
        ctx.fillRect(padding, padding, chartWidth, chartHeight / 2 * 0.8);
        
        // Oversteer region (bottom)
        ctx.fillStyle = '#5555ff';
        ctx.fillRect(padding, zeroY + chartHeight * 0.1, chartWidth, chartHeight / 2 * 0.8);
        
        // Neutral region (middle)
        ctx.fillStyle = '#55aa55';
        ctx.fillRect(padding, zeroY - chartHeight * 0.1, chartWidth, chartHeight * 0.2);
        
        ctx.globalAlpha = 1;
        
        // Draw stability line
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (point.distance / maxDistance) * chartWidth;
            const y = zeroY - (point.gradient * chartHeight * 0.4);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw critical events
        data.forEach(point => {
            if (point.severity > 0.3) {
                const x = padding + (point.distance / maxDistance) * chartWidth;
                const y = zeroY - (point.gradient * chartHeight * 0.4);
                
                ctx.fillStyle = point.state === 'understeer' ? '#ff3333' : '#3333ff';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Draw labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Track Distance (m)', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Understeer Gradient', 0, 0);
        ctx.restore();
    }

    renderTrajectoryChart() {
        const canvas = document.getElementById('trajectoryChart');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 400;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (!this.analysisResults.trajectoryAnalysis) return;
        
        const data = this.analysisResults.trajectoryAnalysis;
        const padding = 50;
        
        // Find bounds
        const allX = [...data.optimal.map(p => p.x), ...data.actual.map(p => p.x)];
        const allY = [...data.optimal.map(p => p.y), ...data.actual.map(p => p.y)];
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minY = Math.min(...allY);
        const maxY = Math.max(...allY);
        
        const scaleX = (canvas.width - 2 * padding) / (maxX - minX);
        const scaleY = (canvas.height - 2 * padding) / (maxY - minY);
        
        // Transform coordinates
        const transform = (x, y) => ({
            x: padding + (x - minX) * scaleX,
            y: padding + (y - minY) * scaleY
        });
        
        // Draw optimal racing line
        ctx.strokeStyle = '#55aa55';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        data.optimal.forEach((point, index) => {
            const pos = transform(point.x, point.y);
            if (index === 0) {
                ctx.moveTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
        });
        
        ctx.stroke();
        
        // Draw actual trajectory
        ctx.strokeStyle = '#ff5555';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        
        data.actual.forEach((point, index) => {
            const pos = transform(point.x, point.y);
            if (index === 0) {
                ctx.moveTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
        });
        
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Track Position', canvas.width / 2, canvas.height - 10);
    }

    generateRecommendations() {
        const container = document.getElementById('recommendationsList');
        container.innerHTML = '';

        const recommendations = this.analyzeSetupRecommendations();
        
        recommendations.forEach(rec => {
            const recDiv = document.createElement('div');
            recDiv.className = `recommendation-item ${rec.priority}`;
            
            recDiv.innerHTML = `
                <div class="recommendation-header">
                    <h4 class="recommendation-title">${rec.title}</h4>
                    <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
                </div>
                <p class="recommendation-description">${rec.description}</p>
                <div class="recommendation-improvement">${rec.improvement}</div>
            `;
            
            container.appendChild(recDiv);
        });
    }

    analyzeSetupRecommendations() {
        const recommendations = [];
        const stability = this.analysisResults.stabilityAnalysis;
        
        if (!stability || stability.length === 0) {
            return [{
                title: 'Load Telemetry Data',
                description: 'Upload telemetry data to receive setup recommendations',
                improvement: 'Analysis will be available after data upload',
                priority: 'info'
            }];
        }

        const understeerCount = stability.filter(s => s.state === 'understeer').length;
        const oversteerCount = stability.filter(s => s.state === 'oversteer').length;
        const totalPoints = stability.length;

        const understeerPercentage = (understeerCount / totalPoints) * 100;
        const oversteerPercentage = (oversteerCount / totalPoints) * 100;

        // Analyze major handling issues
        if (understeerPercentage > 30) {
            recommendations.push({
                title: 'Excessive Understeer Detected',
                description: `${understeerPercentage.toFixed(1)}% of track shows understeer. Consider softening front springs or stiffening rear anti-roll bar.`,
                improvement: 'Expected: 15-25% reduction in understeer tendency',
                priority: 'critical'
            });
        }

        if (oversteerPercentage > 25) {
            recommendations.push({
                title: 'Oversteer Issues Present',
                description: `${oversteerPercentage.toFixed(1)}% of track shows oversteer. Consider reducing differential power or adjusting rear toe.`,
                improvement: 'Expected: 10-20% improvement in rear stability',
                priority: 'critical'
            });
        }

        // Spring rate analysis
        const springRateRatio = this.setupData.rear_spring_rate / this.setupData.front_spring_rate;
        if (springRateRatio > 1.1 && understeerPercentage > 20) {
            recommendations.push({
                title: 'Spring Rate Balance',
                description: 'Rear springs significantly stiffer than front. This promotes understeer.',
                improvement: 'Reduce rear spring rate by 5-10k N/m for better balance',
                priority: 'moderate'
            });
        }

        // Toe settings analysis
        if (this.setupData.front_toe > 0.1) {
            recommendations.push({
                title: 'Front Toe Setting',
                description: 'High front toe-in can cause understeer and tire wear.',
                improvement: 'Reduce front toe to 0.05° or less for improved turn-in',
                priority: 'moderate'
            });
        }

        // Differential analysis
        if (this.setupData.differential_power > 75 && oversteerPercentage > 15) {
            recommendations.push({
                title: 'Differential Power Too High',
                description: 'High differential setting causing power oversteer on corner exit.',
                improvement: 'Reduce to 60-70% for better traction and stability',
                priority: 'moderate'
            });
        }

        // Brake balance
        if (this.setupData.brake_balance > 62) {
            recommendations.push({
                title: 'Brake Balance Too Forward',
                description: 'High brake balance may cause front lock-up under heavy braking.',
                improvement: 'Adjust to 58-60% for optimal brake performance',
                priority: 'minor'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                title: 'Setup Looks Good',
                description: 'Current setup shows balanced handling characteristics across the track.',
                improvement: 'Fine-tune based on driver preference and track conditions',
                priority: 'minor'
            });
        }

        return recommendations;
    }

    // Utility methods
    showUploadStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `upload-status ${type}`;
    }

    showProgress(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        const fill = progressBar.querySelector('.progress-fill');
        
        progressBar.classList.add('visible');
        fill.style.width = `${percentage}%`;
    }

    hideProgress(elementId) {
        const progressBar = document.getElementById(elementId);
        progressBar.classList.remove('visible');
    }

    showLoadingOverlay(message) {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');
        
        messageElement.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ACCTelemetryAnalyzer();
});
