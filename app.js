// ACC Telemetry Analysis Application - Enhanced Version
class ACCTelemetryAnalyzer {
    constructor() {
        this.telemetryData = [];
        this.setupData = {};
        this.analysisResults = {};
        this.isProcessing = false;
        this.charts = {};
        
        // Enhanced configuration with additional parameters
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
            {"key": "brake_balance", "label": "Brake Balance (%)", "min": 50.0, "max": 70.0, "step": 0.1},
            // New parameters from provided data
            {"key": "front_ride_height", "label": "Front Ride Height (mm)", "min": 50, "max": 90, "step": 1},
            {"key": "rear_ride_height", "label": "Rear Ride Height (mm)", "min": 50, "max": 90, "step": 1},
            {"key": "tyre_press_lf", "label": "Tyre Pressure LF (psi)", "min": 21.0, "max": 27.0, "step": 0.1},
            {"key": "tyre_press_rf", "label": "Tyre Pressure RF (psi)", "min": 21.0, "max": 27.0, "step": 0.1},
            {"key": "tyre_press_lr", "label": "Tyre Pressure LR (psi)", "min": 21.0, "max": 27.0, "step": 0.1},
            {"key": "tyre_press_rr", "label": "Tyre Pressure RR (psi)", "min": 21.0, "max": 27.0, "step": 0.1}
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
            "brake_balance": 58.5,
            "front_ride_height": 70,
            "rear_ride_height": 75,
            "tyre_press_lf": 23.5,
            "tyre_press_rf": 23.5,
            "tyre_press_lr": 24.0,
            "tyre_press_rr": 24.0
        };

        // Smoothing configuration
        this.smoothingConfig = {
            rdp_epsilon: 0.5,
            moving_avg_window: 20,
            max_points: 10000
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

        this.currentTheme = 'auto';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.generateSampleTelemetryData();
        this.setupChartInteractions();
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

        // Toast close button
        document.getElementById('toastClose').addEventListener('click', () => {
            this.hideToast();
        });

        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Initialize theme based on system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.updateThemeIcon(prefersDark);
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeIcon = document.querySelector('.theme-icon');
        
        if (html.dataset.colorScheme === 'dark') {
            html.dataset.colorScheme = 'light';
            themeIcon.textContent = '🌙';
            this.currentTheme = 'light';
        } else {
            html.dataset.colorScheme = 'dark';
            themeIcon.textContent = '☀️';
            this.currentTheme = 'dark';
        }

        // Re-render charts with new theme
        if (Object.keys(this.charts).length > 0) {
            setTimeout(() => this.renderCharts(), 100);
        }
    }

    updateThemeIcon(isDark) {
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
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

    // Smoothing utilities
    ramerDouglasPeucker(points, epsilon) {
        if (points.length <= 2) return points;

        const getPerpendicularDistance = (point, lineStart, lineEnd) => {
            const A = lineEnd.y - lineStart.y;
            const B = lineStart.x - lineEnd.x;
            const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
            return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
        };

        let maxDistance = 0;
        let maxIndex = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const distance = getPerpendicularDistance(points[i], points[0], points[points.length - 1]);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        if (maxDistance > epsilon) {
            const left = this.ramerDouglasPeucker(points.slice(0, maxIndex + 1), epsilon);
            const right = this.ramerDouglasPeucker(points.slice(maxIndex), epsilon);
            return left.slice(0, -1).concat(right);
        } else {
            return [points[0], points[points.length - 1]];
        }
    }

    movingAverage(data, windowSize) {
        const result = [];
        const halfWindow = Math.floor(windowSize / 2);
        
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - halfWindow);
            const end = Math.min(data.length, i + halfWindow + 1);
            const slice = data.slice(start, end);
            const sum = slice.reduce((acc, val) => acc + val, 0);
            result.push(sum / slice.length);
        }
        
        return result;
    }

    downsampleData(data, maxPoints) {
        if (data.length <= maxPoints) return data;
        
        const step = Math.ceil(data.length / maxPoints);
        return data.filter((_, index) => index % step === 0);
    }

    safeValue(value, fallback = 0) {
        return (value !== null && value !== undefined && !isNaN(value)) ? value : fallback;
    }

    async handleCSVUpload(file) {
        if (!file || !file.name.toLowerCase().endsWith('.csv')) {
            this.showToast('Please select a valid CSV file', 'error');
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
            this.showToast('Error processing CSV file: ' + error.message, 'error');
            this.showUploadStatus('csvStatus', 'Error processing CSV file', 'error');
            this.hideProgress('csvProgress');
        }
    }

    async handleSetupUpload(file) {
        if (!file || !file.name.toLowerCase().endsWith('.json')) {
            this.showToast('Please select a valid JSON file', 'error');
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
            this.showToast('Error processing setup file: Invalid JSON format', 'error');
            this.showUploadStatus('setupStatus', 'Error processing setup file', 'error');
            this.hideProgress('setupProgress');
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async processCSVData(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file appears to be empty or invalid');
        }
        
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
                        const numericValue = parseFloat(value);
                        dataPoint[header] = isNaN(numericValue) ? value : numericValue;
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

        // Downsample if necessary
        if (this.telemetryData.length > this.smoothingConfig.max_points) {
            this.telemetryData = this.downsampleData(this.telemetryData, this.smoothingConfig.max_points);
        }
    }

    generateSampleTelemetryData() {
        this.sampleTelemetryData = [];
        const trackLength = 2000;
        const dataPoints = 500; // More data points for better smoothing demonstration
        
        for (let i = 0; i < dataPoints; i++) {
            const distance = (i / dataPoints) * trackLength;
            const time = i * 0.08;
            
            // More realistic track simulation with corners and straights
            const trackProgress = distance / trackLength;
            const cornerPhase = Math.sin(trackProgress * Math.PI * 6) * 0.5 + 0.5; // More corners
            const straightSpeed = 220 + Math.sin(trackProgress * Math.PI * 2) * 40;
            const speed = straightSpeed * (1 - cornerPhase * 0.5);
            
            // More realistic physics simulation
            const lateralG = cornerPhase * 2.2 + (Math.random() - 0.5) * 0.3;
            const yawRate = cornerPhase * 1.2 + (Math.random() - 0.5) * 0.2;
            const steerAngle = cornerPhase * 35 + (Math.random() - 0.5) * 8;
            
            // Add some setup-dependent behavior
            const setupInfluence = this.calculateSetupInfluenceOnTelemetry(cornerPhase);
            
            this.sampleTelemetryData.push({
                Time: time,
                Distance: distance,
                SPEED: this.safeValue(speed),
                LateralG: this.safeValue(lateralG + setupInfluence.lateralG),
                ROTY: this.safeValue(yawRate + setupInfluence.yawRate),
                Yaw_Rate: this.safeValue(yawRate + setupInfluence.yawRate),
                STEERANGLE: this.safeValue(steerAngle),
                THROTTLE: Math.max(0, 100 - cornerPhase * 70 + (Math.random() - 0.5) * 10),
                BRAKE: Math.max(0, (cornerPhase - 0.2) * 80 + (Math.random() - 0.5) * 5),
                GEAR: Math.max(2, Math.min(6, Math.floor(speed / 45)))
            });
        }
    }

    calculateSetupInfluenceOnTelemetry(cornerPhase) {
        if (!this.setupData || Object.keys(this.setupData).length === 0) {
            return { lateralG: 0, yawRate: 0 };
        }

        let lateralGInfluence = 0;
        let yawRateInfluence = 0;

        // Spring rate influence
        const springBalance = (this.setupData.rear_spring_rate || 110000) - (this.setupData.front_spring_rate || 120000);
        lateralGInfluence += (springBalance / 100000) * 0.1 * cornerPhase;

        // Camber influence on grip
        const camberEffect = Math.abs(this.setupData.front_camber || -3.2) * 0.02;
        lateralGInfluence += camberEffect * cornerPhase;

        // Toe influence on stability
        const toeEffect = (this.setupData.front_toe || 0.05) * 2;
        yawRateInfluence += toeEffect * cornerPhase;

        return { lateralG: lateralGInfluence, yawRate: yawRateInfluence };
    }

    loadSampleData() {
        this.showLoadingOverlay('Loading sample telemetry data...');
        
        setTimeout(() => {
            this.generateSampleTelemetryData(); // Regenerate with current setup
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
                <div class="slider-tooltip" id="${param.key}_tooltip"></div>
            `;

            container.appendChild(controlDiv);

            // Add event listeners for real-time updates and tooltips
            const slider = controlDiv.querySelector(`#${param.key}_slider`);
            const valueDisplay = controlDiv.querySelector(`#${param.key}_value`);
            const tooltip = controlDiv.querySelector(`#${param.key}_tooltip`);
            
            let updateTimeout;
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = this.formatValue(value, param.step);
                this.setupData[param.key] = value;
                
                // Show tooltip during drag
                tooltip.textContent = this.formatValue(value, param.step);
                tooltip.classList.add('visible');
                
                // Debounce updates
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    this.updateAnalysis();
                }, 300);
            });

            slider.addEventListener('mouseup', () => {
                tooltip.classList.remove('visible');
            });

            slider.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
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
            
            const lateralG = this.safeValue(current.LateralG);
            const yawRate = this.safeValue(current.ROTY || current.Yaw_Rate);
            const steerAngle = this.safeValue(current.STEERANGLE);
            const speed = this.safeValue(current.SPEED, 1);
            
            if (lateralG !== 0 || yawRate !== 0 || steerAngle !== 0) {
                const gradient = this.calculateUndersteerGradient(current, previous);
                results.push({
                    distance: this.safeValue(current.Distance, i * 10),
                    time: this.safeValue(current.Time, i * 0.1),
                    gradient: gradient.gradient,
                    state: gradient.state,
                    severity: gradient.severity
                });
            }
        }

        // Apply smoothing to stability data
        if (results.length > this.smoothingConfig.moving_avg_window) {
            const gradients = results.map(r => r.gradient);
            const smoothedGradients = this.movingAverage(gradients, this.smoothingConfig.moving_avg_window);
            
            results.forEach((result, index) => {
                if (smoothedGradients[index] !== undefined) {
                    result.gradient = smoothedGradients[index];
                    result.state = result.gradient > this.physicsConstants.UNDERSTEER_THRESHOLD ? 'understeer' : 
                                  result.gradient < this.physicsConstants.OVERSTEER_THRESHOLD ? 'oversteer' : 'neutral';
                    result.severity = Math.abs(result.gradient);
                }
            });
        }

        return results;
    }

    calculateUndersteerGradient(currentPoint, previousPoint) {
        const lateralG = Math.abs(this.safeValue(currentPoint.LateralG));
        const yawRate = this.safeValue(currentPoint.ROTY || currentPoint.Yaw_Rate);
        const steeringAngle = this.safeValue(currentPoint.STEERANGLE) * Math.PI / 180;
        const velocity = Math.max(1, this.safeValue(currentPoint.SPEED, 50) / 3.6);

        // Calculate theoretical yaw rate based on bicycle model
        const theoreticalYawRate = (velocity * Math.tan(steeringAngle)) / this.physicsConstants.WHEELBASE;
        
        // Apply setup modifications
        const setupModifier = this.calculateSetupImpact();
        
        // Calculate understeer gradient with better normalization
        const baseGradient = (yawRate - theoreticalYawRate) / Math.max(lateralG, 0.1);
        const understeerGradient = baseGradient + setupModifier.understeerImpact - setupModifier.oversteerImpact;
        
        // Clamp gradient to reasonable range
        const clampedGradient = Math.max(-0.5, Math.min(0.5, understeerGradient));
        
        return {
            gradient: clampedGradient,
            state: clampedGradient > this.physicsConstants.UNDERSTEER_THRESHOLD ? 'understeer' : 
                   clampedGradient < this.physicsConstants.OVERSTEER_THRESHOLD ? 'oversteer' : 'neutral',
            severity: Math.abs(clampedGradient)
        };
    }

    calculateSetupImpact() {
        let understeerImpact = 0;
        let oversteerImpact = 0;
        
        // Spring rate impact
        const springRateDelta = (this.safeValue(this.setupData.rear_spring_rate, 110000) - 
                                this.safeValue(this.setupData.front_spring_rate, 120000)) / 10000;
        understeerImpact += springRateDelta * 0.01;
        
        // Anti-roll bar impact
        const arbDelta = this.safeValue(this.setupData.rear_arb, 4) - this.safeValue(this.setupData.front_arb, 3);
        understeerImpact += arbDelta * 0.02;
        
        // Ride height impact
        const rideHeightDelta = (this.safeValue(this.setupData.rear_ride_height, 75) - 
                               this.safeValue(this.setupData.front_ride_height, 70)) / 10;
        understeerImpact += rideHeightDelta * 0.005;
        
        // Tire pressure impact
        const frontTyrePressAvg = (this.safeValue(this.setupData.tyre_press_lf, 23.5) + 
                                  this.safeValue(this.setupData.tyre_press_rf, 23.5)) / 2;
        const rearTyrePressAvg = (this.safeValue(this.setupData.tyre_press_lr, 24) + 
                                 this.safeValue(this.setupData.tyre_press_rr, 24)) / 2;
        const pressureDelta = rearTyrePressAvg - frontTyrePressAvg;
        understeerImpact += pressureDelta * 0.01;
        
        // Toe impact
        understeerImpact += this.safeValue(this.setupData.front_toe, 0.05) * 0.1;
        understeerImpact += this.safeValue(this.setupData.rear_toe, 0.15) * -0.05;
        
        // Camber impact
        const camberBalance = Math.abs(this.safeValue(this.setupData.rear_camber, -1.8)) - 
                             Math.abs(this.safeValue(this.setupData.front_camber, -3.2));
        understeerImpact += camberBalance * 0.01;
        
        // Differential impact
        oversteerImpact += (this.safeValue(this.setupData.differential_power, 65) - 50) * 0.003;
        
        // Brake balance impact
        const brakeBalance = this.safeValue(this.setupData.brake_balance, 58.5) - 55;
        understeerImpact += brakeBalance * 0.002;

        return { understeerImpact, oversteerImpact };
    }

    calculateTrajectoryAnalysis() {
        const results = {
            optimal: [],
            actual: []
        };

        if (this.telemetryData.length === 0) return results;

        // Generate trajectory data
        const trajectoryPoints = [];
        for (let i = 0; i < this.telemetryData.length; i++) {
            const distance = this.safeValue(this.telemetryData[i].Distance, i * 10);
            const trackProgress = (distance % 2000) / 2000;
            
            const x = Math.cos(trackProgress * Math.PI * 4) * 120 + trackProgress * 500;
            const y = Math.sin(trackProgress * Math.PI * 4) * 80 + 250;
            
            trajectoryPoints.push({ x, y, distance });
        }

        // Apply RDP smoothing to trajectory
        if (trajectoryPoints.length > 10) {
            const smoothedTrajectory = this.ramerDouglasPeucker(trajectoryPoints, this.smoothingConfig.rdp_epsilon);
            
            // Generate optimal line (simplified)
            results.optimal = smoothedTrajectory.map(point => ({ x: point.x, y: point.y }));
            
            // Generate actual trajectory with setup-based deviations
            results.actual = smoothedTrajectory.map((point, index) => {
                const stabilityData = this.analysisResults.stabilityAnalysis[index];
                let deviation = 0;
                
                if (stabilityData) {
                    deviation = stabilityData.gradient * 15;
                }
                
                return {
                    x: point.x + deviation + (Math.random() - 0.5) * 5,
                    y: point.y + deviation * 0.5 + (Math.random() - 0.5) * 3
                };
            });
        }

        return results;
    }

    setupChartInteractions() {
        ['stabilityChart', 'trajectoryChart'].forEach(chartId => {
            const canvas = document.getElementById(chartId);
            const tooltip = document.getElementById(chartId.replace('Chart', 'Tooltip'));
            
            canvas.addEventListener('mousemove', (e) => {
                this.handleChartHover(e, chartId, tooltip);
            });
            
            canvas.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });
    }

    handleChartHover(event, chartId, tooltip) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Scale coordinates to canvas size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;
        
        let tooltipContent = '';
        
        if (chartId === 'stabilityChart' && this.analysisResults.stabilityAnalysis) {
            const data = this.analysisResults.stabilityAnalysis;
            const padding = 50;
            const chartWidth = canvas.width - 2 * padding;
            const maxDistance = Math.max(...data.map(d => d.distance));
            
            if (canvasX >= padding && canvasX <= canvas.width - padding) {
                const relativeX = (canvasX - padding) / chartWidth;
                const distance = relativeX * maxDistance;
                const nearestPoint = this.findNearestDataPoint(data, distance);
                
                if (nearestPoint) {
                    tooltipContent = `
                        Distance: ${nearestPoint.distance.toFixed(0)}m<br>
                        Gradient: ${nearestPoint.gradient.toFixed(3)}<br>
                        State: ${nearestPoint.state}
                    `;
                }
            }
        }
        
        if (tooltipContent) {
            tooltip.innerHTML = tooltipContent;
            tooltip.style.left = `${x + 10}px`;
            tooltip.style.top = `${y - 10}px`;
            tooltip.classList.add('visible');
        } else {
            tooltip.classList.remove('visible');
        }
    }

    findNearestDataPoint(data, targetDistance) {
        let nearest = null;
        let minDiff = Infinity;
        
        for (const point of data) {
            const diff = Math.abs(point.distance - targetDistance);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = point;
            }
        }
        
        return nearest;
    }

    renderCharts() {
        this.renderStabilityChart();
        this.renderTrajectoryChart();
    }

    renderStabilityChart() {
        const canvas = document.getElementById('stabilityChart');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for HiDPI
        const rect = canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        const width = rect.width;
        const height = rect.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Get theme colors
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim();
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        if (!this.analysisResults.stabilityAnalysis || this.analysisResults.stabilityAnalysis.length === 0) {
            return;
        }
        
        const data = this.analysisResults.stabilityAnalysis;
        const maxDistance = Math.max(...data.map(d => d.distance));
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const zeroY = height / 2;
        
        // Draw gridlines
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 0.5;
        
        // Distance gridlines (every 250m as requested)
        const distanceStep = 250;
        const numGridlines = Math.ceil(maxDistance / distanceStep);
        for (let i = 0; i <= numGridlines; i++) {
            const distance = i * distanceStep;
            const x = padding + (distance / maxDistance) * chartWidth;
            if (x <= width - padding) {
                ctx.beginPath();
                ctx.moveTo(x, padding);
                ctx.lineTo(x, height - padding);
                ctx.stroke();
            }
        }
        
        // Horizontal gridlines
        for (let i = 0; i <= 8; i++) {
            const y = padding + (i / 8) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw y-axis scale (-0.5 to +0.5 as requested)
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        const yLabels = ['+0.5', '+0.25', '0', '-0.25', '-0.5'];
        yLabels.forEach((label, index) => {
            const y = padding + (index / (yLabels.length - 1)) * chartHeight;
            ctx.fillText(label, padding - 10, y + 3);
        });
        
        // Draw zero line
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(padding, zeroY);
        ctx.lineTo(width - padding, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw stability regions with transparency
        ctx.globalAlpha = 0.2;
        
        // Understeer region (red)
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(padding, padding, chartWidth, (chartHeight / 2) * 0.8);
        
        // Oversteer region (blue)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(padding, zeroY + (chartHeight / 2) * 0.2, chartWidth, (chartHeight / 2) * 0.8);
        
        // Neutral region (green)
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(padding, zeroY - (chartHeight / 2) * 0.2, chartWidth, (chartHeight / 2) * 0.4);
        
        ctx.globalAlpha = 1;
        
        // Draw smoothed stability line
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (point.distance / maxDistance) * chartWidth;
            // Clamp gradient to ±0.5 range for display
            const clampedGradient = Math.max(-0.5, Math.min(0.5, point.gradient));
            const y = zeroY - (clampedGradient * chartHeight * 0.8);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw critical events
        data.forEach(point => {
            if (point.severity > 0.25) {
                const x = padding + (point.distance / maxDistance) * chartWidth;
                const clampedGradient = Math.max(-0.5, Math.min(0.5, point.gradient));
                const y = zeroY - (clampedGradient * chartHeight * 0.8);
                
                ctx.fillStyle = point.state === 'understeer' ? '#e74c3c' : '#3498db';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderTrajectoryChart() {
        const canvas = document.getElementById('trajectoryChart');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for HiDPI
        const rect = canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        const width = rect.width;
        const height = rect.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        if (!this.analysisResults.trajectoryAnalysis || 
            this.analysisResults.trajectoryAnalysis.optimal.length === 0) {
            return;
        }
        
        const data = this.analysisResults.trajectoryAnalysis;
        const padding = 30;
        
        // Find bounds
        const allX = [...data.optimal.map(p => p.x), ...data.actual.map(p => p.x)];
        const allY = [...data.optimal.map(p => p.y), ...data.actual.map(p => p.y)];
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minY = Math.min(...allY);
        const maxY = Math.max(...allY);
        
        const scaleX = (width - 2 * padding) / (maxX - minX);
        const scaleY = (height - 2 * padding) / (maxY - minY);
        
        const transform = (x, y) => ({
            x: padding + (x - minX) * scaleX,
            y: padding + (y - minY) * scaleY
        });
        
        // Draw optimal racing line (smooth green dashed line)
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
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
        
        // Draw actual trajectory (smooth red line)
        ctx.strokeStyle = '#e74c3c';
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
    }

    generateRecommendations() {
        const container = document.getElementById('recommendationsList');
        container.innerHTML = '';

        const recommendations = this.analyzeSetupRecommendations();
        
        recommendations.forEach(rec => {
            const recDiv = document.createElement('div');
            recDiv.className = `recommendation-item ${rec.priority}`;
            
            let targetsHTML = '';
            if (rec.targets && rec.targets.length > 0) {
                targetsHTML = `
                    <div class="recommendation-targets">
                        ${rec.targets.map(target => `
                            <div class="target-row">
                                <span class="target-current">${target.parameter}: ${target.current}</span>
                                <span class="target-arrow">→</span>
                                <span class="target-new">${target.recommended}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            recDiv.innerHTML = `
                <div class="recommendation-header">
                    <h4 class="recommendation-title">
                        <span class="recommendation-icon">${rec.icon}</span>
                        ${rec.title}
                    </h4>
                    <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
                </div>
                <p class="recommendation-description">${rec.description}</p>
                ${targetsHTML}
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
                priority: 'minor',
                icon: '📊',
                targets: []
            }];
        }

        const understeerCount = stability.filter(s => s.state === 'understeer').length;
        const oversteerCount = stability.filter(s => s.state === 'oversteer').length;
        const totalPoints = stability.length;
        const understeerPercentage = (understeerCount / totalPoints) * 100;
        const oversteerPercentage = (oversteerCount / totalPoints) * 100;

        // Critical understeer recommendations
        if (understeerPercentage > 30) {
            const currentFrontCamber = this.setupData.front_camber || -3.2;
            const newFrontCamber = Math.max(-5.0, currentFrontCamber - 0.4);
            const currentFrontArb = this.setupData.front_arb || 3;
            const newFrontArb = Math.max(1, currentFrontArb - 1);
            const currentFrontRideHeight = this.setupData.front_ride_height || 70;
            const newFrontRideHeight = Math.max(50, currentFrontRideHeight - 3);

            recommendations.push({
                title: 'Excessive Understeer Detected',
                description: `${understeerPercentage.toFixed(1)}% of track shows understeer. Reducing front grip and increasing front downforce will help.`,
                improvement: 'Expected: 15-25% reduction in understeer tendency',
                priority: 'critical',
                icon: '🔧',
                targets: [
                    { parameter: 'Front Camber', current: `${currentFrontCamber.toFixed(1)}°`, recommended: `${newFrontCamber.toFixed(1)}°` },
                    { parameter: 'Front ARB', current: `${currentFrontArb}`, recommended: `${newFrontArb}` },
                    { parameter: 'Front Ride Height', current: `${currentFrontRideHeight}mm`, recommended: `${newFrontRideHeight}mm` }
                ]
            });
        }

        // Critical oversteer recommendations
        if (oversteerPercentage > 25) {
            const currentRearCamber = this.setupData.rear_camber || -1.8;
            const newRearCamber = Math.min(0.0, currentRearCamber + 0.3);
            const currentRearArb = this.setupData.rear_arb || 4;
            const newRearArb = Math.min(6, currentRearArb + 1);
            const currentRearRideHeight = this.setupData.rear_ride_height || 75;
            const newRearRideHeight = Math.min(90, currentRearRideHeight + 4);
            const currentDiffPower = this.setupData.differential_power || 65;
            const newDiffPower = Math.max(0, currentDiffPower - 10);

            recommendations.push({
                title: 'Oversteer Issues Present',
                description: `${oversteerPercentage.toFixed(1)}% of track shows oversteer. Increasing rear grip and reducing diff aggressiveness will improve stability.`,
                improvement: 'Expected: 10-20% improvement in rear stability',
                priority: 'critical',
                icon: '🔧',
                targets: [
                    { parameter: 'Rear Camber', current: `${currentRearCamber.toFixed(1)}°`, recommended: `${newRearCamber.toFixed(1)}°` },
                    { parameter: 'Rear ARB', current: `${currentRearArb}`, recommended: `${newRearArb}` },
                    { parameter: 'Rear Ride Height', current: `${currentRearRideHeight}mm`, recommended: `${newRearRideHeight}mm` },
                    { parameter: 'Diff Power', current: `${currentDiffPower}%`, recommended: `${newDiffPower}%` }
                ]
            });
        }

        // Tire pressure recommendations
        const avgFrontPressure = (this.setupData.tyre_press_lf + this.setupData.tyre_press_rf) / 2;
        const avgRearPressure = (this.setupData.tyre_press_lr + this.setupData.tyre_press_rr) / 2;
        
        if (avgFrontPressure > 25.5 || avgRearPressure > 25.5) {
            const newFrontPressure = Math.max(21.0, avgFrontPressure - 0.5);
            const newRearPressure = Math.max(21.0, avgRearPressure - 0.5);
            
            recommendations.push({
                title: 'High Tire Pressures',
                description: 'Tire pressures are high which may cause reduced grip and increased tire wear.',
                improvement: 'Expected: Better mechanical grip and tire longevity',
                priority: 'moderate',
                icon: '⚙️',
                targets: [
                    { parameter: 'Front Tire Pressure', current: `${avgFrontPressure.toFixed(1)} psi`, recommended: `${newFrontPressure.toFixed(1)} psi` },
                    { parameter: 'Rear Tire Pressure', current: `${avgRearPressure.toFixed(1)} psi`, recommended: `${newRearPressure.toFixed(1)} psi` }
                ]
            });
        }

        if (avgFrontPressure < 22.5 || avgRearPressure < 22.5) {
            const newFrontPressure = Math.min(27.0, avgFrontPressure + 0.3);
            const newRearPressure = Math.min(27.0, avgRearPressure + 0.3);
            
            recommendations.push({
                title: 'Low Tire Pressures',
                description: 'Tire pressures are low which may cause sluggish handling and increased tire wear.',
                improvement: 'Expected: Improved responsiveness and tire life',
                priority: 'moderate',
                icon: '⚙️',
                targets: [
                    { parameter: 'Front Tire Pressure', current: `${avgFrontPressure.toFixed(1)} psi`, recommended: `${newFrontPressure.toFixed(1)} psi` },
                    { parameter: 'Rear Tire Pressure', current: `${avgRearPressure.toFixed(1)} psi`, recommended: `${newRearPressure.toFixed(1)} psi` }
                ]
            });
        }

        // Spring rate balance
        const springRateRatio = this.setupData.rear_spring_rate / this.setupData.front_spring_rate;
        if (springRateRatio > 1.05 && understeerPercentage > 20) {
            const currentRearSpring = this.setupData.rear_spring_rate;
            const newRearSpring = Math.max(80000, currentRearSpring - 8000);
            
            recommendations.push({
                title: 'Spring Rate Balance',
                description: 'Rear springs are significantly stiffer than front, promoting understeer.',
                improvement: 'Expected: More balanced handling characteristics',
                priority: 'moderate',
                icon: '⚙️',
                targets: [
                    { parameter: 'Rear Spring Rate', current: `${(currentRearSpring/1000).toFixed(0)}k N/m`, recommended: `${(newRearSpring/1000).toFixed(0)}k N/m` }
                ]
            });
        }

        // Toe settings
        if (this.setupData.front_toe > 0.10) {
            const currentFrontToe = this.setupData.front_toe;
            const newFrontToe = 0.05;
            
            recommendations.push({
                title: 'High Front Toe',
                description: 'Excessive front toe-in causes understeer and tire wear.',
                improvement: 'Expected: Better turn-in response and tire life',
                priority: 'moderate',
                icon: '⚙️',
                targets: [
                    { parameter: 'Front Toe', current: `${currentFrontToe.toFixed(2)}°`, recommended: `${newFrontToe.toFixed(2)}°` }
                ]
            });
        }

        // Brake balance
        if (this.setupData.brake_balance > 62) {
            const currentBrakeBalance = this.setupData.brake_balance;
            const newBrakeBalance = 59.0;
            
            recommendations.push({
                title: 'Brake Balance Too Forward',
                description: 'High brake balance may cause front lock-up under heavy braking.',
                improvement: 'Expected: More stable braking performance',
                priority: 'minor',
                icon: '⚙️',
                targets: [
                    { parameter: 'Brake Balance', current: `${currentBrakeBalance.toFixed(1)}%`, recommended: `${newBrakeBalance.toFixed(1)}%` }
                ]
            });
        }

        // Ride height aerodynamics
        const avgRideHeight = (this.setupData.front_ride_height + this.setupData.rear_ride_height) / 2;
        if (avgRideHeight > 80) {
            const currentFrontRideHeight = this.setupData.front_ride_height;
            const currentRearRideHeight = this.setupData.rear_ride_height;
            const newFrontRideHeight = Math.max(50, currentFrontRideHeight - 5);
            const newRearRideHeight = Math.max(50, currentRearRideHeight - 5);
            
            recommendations.push({
                title: 'High Ride Height',
                description: 'High ride height reduces aerodynamic efficiency and can affect handling.',
                improvement: 'Expected: Improved downforce and stability at high speed',
                priority: 'minor',
                icon: '⚙️',
                targets: [
                    { parameter: 'Front Ride Height', current: `${currentFrontRideHeight}mm`, recommended: `${newFrontRideHeight}mm` },
                    { parameter: 'Rear Ride Height', current: `${currentRearRideHeight}mm`, recommended: `${newRearRideHeight}mm` }
                ]
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                title: 'Setup Looks Balanced',
                description: 'Current setup shows good handling characteristics across the track.',
                improvement: 'Consider fine-tuning based on driver preference and track conditions',
                priority: 'minor',
                icon: '✅',
                targets: []
            });
        }

        return recommendations;
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const messageElement = document.getElementById('toastMessage');
        
        toast.className = `toast ${type}`;
        messageElement.textContent = message;
        toast.classList.add('visible');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('visible');
    }

    // Utility methods (unchanged but enhanced error handling)
    showUploadStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `upload-status ${type}`;
        }
    }

    showProgress(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            const fill = progressBar.querySelector('.progress-fill');
            progressBar.classList.add('visible');
            if (fill) {
                fill.style.width = `${percentage}%`;
            }
        }
    }

    hideProgress(elementId) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            progressBar.classList.remove('visible');
        }
    }

    showLoadingOverlay(message) {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');
        
        if (messageElement) {
            messageElement.textContent = message;
        }
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ACCTelemetryAnalyzer();
});

// Handle window resize for charts
window.addEventListener('resize', () => {
    const analyzer = window.accAnalyzer;
    if (analyzer && analyzer.charts && Object.keys(analyzer.charts).length > 0) {
        setTimeout(() => analyzer.renderCharts(), 100);
    }
});

// Store analyzer instance globally for resize handling
window.addEventListener('load', () => {
    if (window.accAnalyzer) return;
    window.accAnalyzer = new ACCTelemetryAnalyzer();
});
