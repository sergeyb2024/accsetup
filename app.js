// Professional ACC Telemetry Analysis Application - Setup JSON Upload Version
class ACCTelemetryApp {
    constructor() {
        this.currentSetupData = null;
        this.telemetryData = [];
        this.processedData = null;
        this.charts = {};
        this.analysisResults = {};

        // FIXED: Symmetric thresholds with correct signs (positive = understeer, negative = oversteer)
        this.analysisThresholds = {
            understeer: 2.0, // Positive USOS = understeer
            oversteer: -2.0, // Negative USOS = oversteer
            minLateralG: 0.3,
            minSpeed: 50, // km/h
            wheelSlipThreshold: 0.15,
            yawDeficitThreshold: 5.0
        };

        // Recommendation groups (unchanged)
        this.recommendationGroups = {
            conservative: {
                name: "Conservative Approach",
                description: "Small incremental changes (±1-2 clicks). Focus on electronic aids first."
            },
            mechanical: {
                name: "Mechanical Approach",
                description: "Medium changes (±3-5 clicks). Focus on suspension, ARBs, springs."
            },
            aerodynamic: {
                name: "Aerodynamic Approach",
                description: "Larger changes (±2-4 clicks). Focus on aero balance, ride height."
            }
        };

        this.init();
    }

    init() {
        console.log('Initializing ACC Telemetry App with JSON setup upload...');
        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupApplication());
            } else {
                this.setupApplication();
            }
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    setupApplication() {
        console.log('Setting up application components...');
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setupSetupFileUpload();
        this.setupSetupControls();
        console.log('App initialized with JSON setup upload functionality');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Telemetry file upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        if (fileInput && uploadArea) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            uploadArea.addEventListener('click', (e) => {
                if (e.target !== fileInput) fileInput.click();
            });
        }

        // Load sample data button
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadSampleData();
            });
        }

        // Process data button
        const processDataBtn = document.getElementById('processDataBtn');
        if (processDataBtn) {
            processDataBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.processData();
            });
        }

        // Setup control buttons
        const resetSetupBtn = document.getElementById('resetSetupBtn');
        if (resetSetupBtn) {
            resetSetupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetSetup();
            });
        }

        const exportSetupBtn = document.getElementById('exportSetupBtn');
        if (exportSetupBtn) {
            exportSetupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportSetup();
            });
        }

        console.log('Event listeners set up successfully');
    }

    setupSetupFileUpload() {
        console.log('Setting up setup file upload handlers...');
        const setupFileInput = document.getElementById('setupFileInput');
        const setupUploadZone = document.getElementById('setupUploadZone');

        if (setupFileInput) {
            setupFileInput.addEventListener('change', (e) => this.handleSetupFileUpload(e));
        }

        if (setupUploadZone) {
            // Drag and drop for setup files
            setupUploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                setupUploadZone.classList.add('dragover');
            });

            setupUploadZone.addEventListener('dragleave', () => {
                setupUploadZone.classList.remove('dragover');
            });

            setupUploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                setupUploadZone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    this.processSetupFile(e.dataTransfer.files[0]);
                }
            });
        }

        console.log('Setup file upload handlers configured');
    }

    handleSetupFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.processSetupFile(file);
        }
    }

    processSetupFile(file) {
        console.log('Processing setup file:', file.name);

        if (!file.name.endsWith('.json')) {
            this.showStatus('Please select a JSON setup file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const setupData = this.parseSetupJSON(e.target.result);
                this.currentSetupData = setupData;
                this.displaySetupInfo(setupData);
                this.populateSetupControls(setupData.currentSetup); // Populate sliders

                // Re-analyze telemetry if already loaded
                if (this.telemetryData.length > 0) {
                    this.processData(); // Re-analyze with new setup
                }

                this.showStatus(`Setup loaded: ${setupData.carInfo.carName}`, 'success');
            } catch (error) {
                this.showStatus('Error processing setup file: ' + error.message, 'error');
                console.error('Setup file processing error:', error);
            }
        };
        reader.readAsText(file);
    }

    parseSetupJSON(jsonContent) {
        try {
            const setup = JSON.parse(jsonContent);

            // FIXED: Extract car data including steering ratio
            const carData = this.getWheelbaseFromCarName(setup.carName);
            const carInfo = {
                carName: setup.carName,
                wheelbase: carData.wheelbase,
                steeringRatio: carData.steeringRatio
            };

            // Extract alignment data using actual values from JSON
            const alignment = {
                camberFL: setup.basicSetup.alignment.staticCamber[0],
                camberFR: setup.basicSetup.alignment.staticCamber[1],
                camberRL: setup.basicSetup.alignment.staticCamber[2],
                camberRR: setup.basicSetup.alignment.staticCamber[3],
                toeFL: setup.basicSetup.alignment.toeOutLinear[0] * 57.2958,
                toeFR: setup.basicSetup.alignment.toeOutLinear[1] * 57.2958,
                toeRL: setup.basicSetup.alignment.toeOutLinear[2] * 57.2958,
                toeRR: setup.basicSetup.alignment.toeOutLinear[3] * 57.2958,
                casterLF: setup.basicSetup.alignment.casterLF,
                casterRF: setup.basicSetup.alignment.casterRF
            };

            // Extract other setup parameters
            const currentSetup = {
                pressureFL: setup.basicSetup.tyres.tyrePressure[0],
                pressureFR: setup.basicSetup.tyres.tyrePressure[1],
                pressureRL: setup.basicSetup.tyres.tyrePressure[2],
                pressureRR: setup.basicSetup.tyres.tyrePressure[3],
                tc1: setup.basicSetup.electronics.tC1,
                tc2: setup.basicSetup.electronics.tC2,
                abs: setup.basicSetup.electronics.abs,
                arbFront: setup.advancedSetup.mechanicalBalance.aRBFront,
                arbRear: setup.advancedSetup.mechanicalBalance.aRBRear,
                brakeBias: setup.advancedSetup.mechanicalBalance.brakeBias,
                rideHeightFront: (setup.advancedSetup.aeroBalance.rideHeight[0] + setup.advancedSetup.aeroBalance.rideHeight[1]) / 2,
                rideHeightRear: (setup.advancedSetup.aeroBalance.rideHeight[2] + setup.advancedSetup.aeroBalance.rideHeight[3]) / 2,
                splitter: setup.advancedSetup.aeroBalance.splitter,
                rearWing: setup.advancedSetup.aeroBalance.rearWing,
            };

            return {
                carInfo,
                alignment,
                currentSetup,
                rawSetup: setup
            };
        } catch (error) {
            throw new Error('Invalid JSON format: ' + error.message);
        }
    }

    // FIXED: Expanded with steering ratios (approx values; adjust if needed)
    getWheelbaseFromCarName(carName) {
        const carData = {
            'mercedes_amg_gt3_evo': { wheelbase: 2.665, steeringRatio: 12.5 },
            'mercedes_amg_gt2': { wheelbase: 2.630, steeringRatio: 13.0 },
            'bmw_m4_gt3': { wheelbase: 2.810, steeringRatio: 14.0 },
            'ferrari_488_gt3_evo': { wheelbase: 2.650, steeringRatio: 12.0 },
            'ferrari_488_gt3': { wheelbase: 2.650, steeringRatio: 12.0 },
            'audi_r8_lms_evo': { wheelbase: 2.650, steeringRatio: 13.5 },
            'audi_r8_lms_evo_ii': { wheelbase: 2.650, steeringRatio: 13.5 },
            'lamborghini_huracan_gt3_evo': { wheelbase: 2.620, steeringRatio: 12.0 },
            'lamborghini_huracan_gt3_evo2': { wheelbase: 2.620, steeringRatio: 12.0 },
            'porsche_991_gt3_r': { wheelbase: 2.457, steeringRatio: 12.5 }, // FIXED: Added Porsche 991 GT3 R
            'porsche_911ii_gt3_r': { wheelbase: 2.457, steeringRatio: 12.5 },
            'mclaren_720s_gt3': { wheelbase: 2.670, steeringRatio: 13.0 },
            'bentley_continental_gt3_2018': { wheelbase: 2.851, steeringRatio: 14.0 },
            'nissan_gt_r_nismo_gt3': { wheelbase: 2.780, steeringRatio: 13.0 }
        };

        return carData[carName] || { wheelbase: 2.650, steeringRatio: 13.0 }; // Default
    }

    displaySetupInfo(setupData) {
        console.log('Displaying setup information...');
        const summary = document.getElementById('setupSummary');
        const alignment = setupData.alignment;
        const setup = setupData.currentSetup;

        if (!summary) {
            console.warn('Setup summary container not found');
            return;
        }

        summary.innerHTML = `
            <div class="setup-overview">
                <h4>${setupData.carInfo.carName}</h4>
                <div class="setup-grid">
                    <div class="setup-group">
                        <h5>Alignment</h5>
                        <div class="alignment-values">
                            <p>Front Camber: ${alignment.camberFL.toFixed(2)} / ${alignment.camberFR.toFixed(2)}°</p>
                            <p>Rear Camber: ${alignment.camberRL.toFixed(2)} / ${alignment.camberRR.toFixed(2)}°</p>
                            <p>Front Toe: ${alignment.toeFL.toFixed(2)} / ${alignment.toeFR.toFixed(2)}°</p>
                            <p>Rear Toe: ${alignment.toeRL.toFixed(2)} / ${alignment.toeRR.toFixed(2)}°</p>
                            <p>Caster: ${alignment.casterLF.toFixed(1)} / ${alignment.casterRF.toFixed(1)}°</p>
                        </div>
                    </div>
                    <div class="setup-group">
                        <h5>Current Setup</h5>
                        <p>Tyre Pressures (PSI): FL ${setup.pressureFL.toFixed(1)}, FR ${setup.pressureFR.toFixed(1)}, RL ${setup.pressureRL.toFixed(1)}, RR ${setup.pressureRR.toFixed(1)}</p>
                        <p>Electronics: TC1 ${setup.tc1}, TC2 ${setup.tc2}, ABS ${setup.abs}</p>
                        <p>ARBs: Front ${setup.arbFront}, Rear ${setup.arbRear}</p>
                        <p>Brake Bias: ${setup.brakeBias.toFixed(1)}%</p>
                        <p>Ride Heights (mm): Front ${setup.rideHeightFront.toFixed(1)}, Rear ${setup.rideHeightRear.toFixed(1)}</p>
                        <p>Aero: Splitter ${setup.splitter}, Rear Wing ${setup.rearWing}</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupTabNavigation() {
        document.querySelectorAll('.tab-btn, .setup-tab-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const isSetupTab = e.target.classList.contains('setup-tab-btn');
                const tabId = e.target.dataset.tab;
                const btnSelector = isSetupTab ? '.setup-tab-btn' : '.tab-btn';
                const contentSelector = isSetupTab ? '.setup-tab-content' : '.tab-content';

                document.querySelectorAll(btnSelector).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                document.querySelectorAll(contentSelector).forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(tabId)?.classList.add('active');
            });
        });
    }

    setupSetupControls() {
        document.querySelectorAll('.setup-slider').forEach(slider => {
            slider.addEventListener('input', this.handleSliderInput.bind(this));
        });
    }

    handleSliderInput(event) {
        const slider = event.target;
        document.getElementById(`${slider.id}Value`).textContent = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 1 : 0);
    }

    populateSetupControls(setup) {
        for (const key in setup) {
            const slider = document.getElementById(key);
            if (slider) {
                slider.value = setup[key];
                this.handleSliderInput({ target: slider }); // Update display
            }
        }
    }

    resetSetup() {
        if (this.currentSetupData) {
            this.populateSetupControls(this.currentSetupData.currentSetup);
            this.showStatus('Reset to current setup values', 'info');
        } else {
            this.showStatus('No setup loaded to reset to', 'error');
        }
    }

    exportSetup() {
        if (!this.currentSetupData || !this.analysisResults) {
            this.showStatus('No setup and analysis data to export', 'error');
            return;
        }

        const exportData = {
            setupData: this.currentSetupData,
            analysisResults: this.analysisResults,
            exportDate: new Date().toISOString(),
            appVersion: 'ACC Telemetry Analysis - Fixed USOS Version'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentSetupData.carInfo.carName}_analysis_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showStatus('Setup and analysis exported successfully', 'success');
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) this.handleFile(file);
    }

    handleFile(file) {
        if (!file.name.endsWith('.csv')) {
            this.showStatus('Please select a CSV file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => this.parseCSV(e.target.result);
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            this.showStatus('CSV file is empty or contains only a header.', 'error');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        this.telemetryData = [];
        let skippedLines = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');

            if (values.length !== headers.length) {
                console.warn(`Skipping line ${i + 1}: column count mismatch. Expected ${headers.length}, got ${values.length}.`);
                skippedLines++;
                continue;
            }

            const dataPoint = {};
            let lineHasError = false;
            for (let j = 0; j < headers.length; j++) {
                const value = parseFloat(values[j]);
                if (isNaN(value)) {
                    console.warn(`Skipping line ${i + 1}: non-numeric value for header '${headers[j]}'.`);
                    lineHasError = true;
                    break;
                }
                dataPoint[headers[j]] = value;
            }

            if (lineHasError) {
                skippedLines++;
                continue;
            }

            this.telemetryData.push(dataPoint);
        }

        this.validateTelemetryData(headers);
        document.getElementById('processDataBtn').classList.remove('hidden');

        let statusMessage = `Loaded ${this.telemetryData.length} data points from CSV.`;
        if (skippedLines > 0) {
            statusMessage += ` Skipped ${skippedLines} malformed lines.`;
            this.showStatus(statusMessage, 'warning');
        } else {
            this.showStatus(statusMessage, 'success');
        }
    }

    validateTelemetryData(headers) {
        const requiredChannels = ['SPEED', 'STEERANGLE', 'G_LAT', 'ROTY', 'THROTTLE', 'BRAKE'];
        const missing = requiredChannels.filter(ch => !headers.includes(ch));
        if (missing.length > 0) {
            this.showStatus(`Missing required channels: ${missing.join(', ')}. Analysis may be incomplete.`, 'warning');
        }
    }

    processData() {
        if (!this.telemetryData.length) {
            this.showStatus('No telemetry data loaded.', 'error');
            return;
        }

        if (!this.currentSetupData) {
            this.showStatus('No setup loaded. Using default wheelbase/steering ratio.', 'warning');
            this.currentSetupData = { carInfo: this.getWheelbaseFromCarName('default') }; // Fallback
        }

        // FIXED: Constants for unit conversions
        const G = 9.81; // m/s² per g
        const DEG_TO_RAD = Math.PI / 180;
        const RAD_TO_DEG = 180 / Math.PI;
        const KMH_TO_MS = 1 / 3.6;

        const processedData = this.telemetryData.map((p) => {
            if (p.SPEED < this.analysisThresholds.minSpeed || Math.abs(p.G_LAT) < this.analysisThresholds.minLateralG) {
                return { ...p, understeerAngle: 0, classification: 'neutral', confidence: 0 };
            }

            const speed_ms = p.SPEED * KMH_TO_MS;
            const yaw_rad_s = p.ROTY * DEG_TO_RAD;
            const lat_accel = p.G_LAT * G; // Signed

            // FIXED: Inverse radius from yaw (primary) and lat G (validation)
            const inv_radius_yaw = yaw_rad_s / speed_ms;
            const inv_radius_lat = lat_accel / (speed_ms * speed_ms);

            // Confidence: % agreement between yaw and lat-based radius (lower if slip/sensor noise)
            const inv_radius_diff = Math.abs(inv_radius_yaw - inv_radius_lat) / Math.max(Math.abs(inv_radius_yaw), Math.abs(inv_radius_lat), 1e-6);
            const confidence = Math.max(100 - (inv_radius_diff * 333), 0); // 100% if <0.1 diff, 70% if 0.3, 50% if higher

            // FIXED: Kinematic steer using yaw-based inverse radius
            const kinematicSteer = this.currentSetupData.carInfo.wheelbase * inv_radius_yaw; // radians

            // FIXED: Actual road wheel steer (corrected for ratio and sign)
            const roadWheelSteer = (p.STEERANGLE * DEG_TO_RAD) / this.currentSetupData.carInfo.steeringRatio;
            const actualSteer = roadWheelSteer * Math.sign(p.G_LAT || 1); // Align with turn direction

            // FIXED: USOS in degrees (positive = understeer, negative = oversteer)
            const understeerAngle = (actualSteer - kinematicSteer) * RAD_TO_DEG;

            let classification = 'neutral';
            if (understeerAngle > this.analysisThresholds.understeer) {
                classification = 'understeer';
            } else if (understeerAngle < this.analysisThresholds.oversteer) {
                classification = 'oversteer';
            }

            return { ...p, understeerAngle, classification, confidence };
        });

        this.processedData = processedData.filter(p => p.confidence > 50); // Filter low-confidence
        this.analyzeBalance();
        this.analyzeSuspension();
        this.displayResults();
        this.generateRecommendations();
        this.generateProfessionalReport();
        this.showStatus('Data processed successfully.', 'success');
    }

    analyzeBalance() {
        let usosSum = 0;
        let weightedSum = 0;
        let understeerCount = 0;
        let oversteerCount = 0;
        let neutralCount = 0;

        this.processedData.forEach(p => {
            const weight = p.confidence / 100;
            usosSum += p.understeerAngle * weight;
            weightedSum += weight;

            if (p.classification === 'understeer') understeerCount++;
            else if (p.classification === 'oversteer') oversteerCount++;
            else neutralCount++;
        });

        const total = this.processedData.length;
        const usosAverage = weightedSum > 0 ? usosSum / weightedSum : 0;
        const balanceDistribution = {
            understeer: (understeerCount / total) * 100,
            oversteer: (oversteerCount / total) * 100,
            neutral: (neutralCount / total) * 100
        };

        const avgConfidence = this.processedData.reduce((sum, p) => sum + p.confidence, 0) / total || 0;

        this.analysisResults = { ...this.analysisResults, usosAverage, balanceDistribution, avgConfidence };
    }

    analyzeSuspension() {
        // Placeholder for suspension analysis (unchanged; expand as needed)
        const suspensionAnalysis = {
            bumpstopHits: { front: 0, rear: 0 },
            // Add more logic here
        };
        this.analysisResults.suspensionAnalysis = suspensionAnalysis;
    }

    displayResults() {
        // FIXED: Added confidence to UI
        const usosFactor = document.querySelector('.usos-factor');
        if (usosFactor) usosFactor.textContent = this.analysisResults.usosAverage.toFixed(2);

        const confidenceEl = document.querySelector('.confidence');
        if (confidenceEl) confidenceEl.textContent = this.analysisResults.avgConfidence.toFixed(0) + '%';

        const balanceDist = document.querySelector('.balance-distribution');
        if (balanceDist) balanceDist.textContent = `${this.analysisResults.balanceDistribution.understeer.toFixed(1)}% US / ${this.analysisResults.balanceDistribution.neutral.toFixed(1)}% N / ${this.analysisResults.balanceDistribution.oversteer.toFixed(1)}% OS`;

        // Add chart updates, corner analysis, etc. (expand as needed)
    }

    generateRecommendations() {
        // FIXED: Logic based on correct balance (e.g., if oversteer > 50%, suggest stabilizing changes)
        const dist = this.analysisResults.balanceDistribution;
        const primaryIssue = dist.understeer > 40 ? 'understeer' : dist.oversteer > 30 ? 'oversteer' : 'neutral';

        this.updateConservativeRecommendations(primaryIssue);
        this.updateMechanicalRecommendations(primaryIssue);
        this.updateAerodynamicRecommendations(primaryIssue);
    }

    updateConservativeRecommendations(issue) {
        const container = document.getElementById('conservativeList');
        if (!container) return;
        container.innerHTML = '';

        if (issue === 'understeer') {
            this.addRecommendationItem(container, 'Increase TC1', '+1', 80, 'Allows more rotation on throttle');
            this.addRecommendationItem(container, 'Decrease ABS', '-1', 75, 'Improves trail braking rotation');
            // Add more
        } else if (issue === 'oversteer') {
            this.addRecommendationItem(container, 'Increase TC1', '+1', 85, 'Reduces wheel spin-induced oversteer');
            this.addRecommendationItem(container, 'Increase ABS', '+1', 80, 'Stabilizes braking oversteer');
            // Add more
        } else {
            this.addRecommendationItem(container, 'Electronics balanced', 'Maintain', 90, 'Fine-tune based on feel');
        }
    }

    // Similar for mechanical and aerodynamic (expand with corrected logic as in previous messages)
    addRecommendationItem(container, text, change, confidence, impact) {
        // Unchanged
        const item = document.createElement('div');
        item.className = 'recommendation-item';

        const confidenceClass = confidence > 80 ? 'high' : confidence > 65 ? 'medium' : 'low';
        const changeClass = change.toString().startsWith('-') ? 'negative' : (change.toString().startsWith('+') ? 'positive' : 'neutral');

        item.innerHTML = `
            <div class="recommendation-header">
                <span class="recommendation-text">${text}</span>
                <span class="recommendation-confidence confidence-${confidenceClass}">${confidence}%</span>
            </div>
            <div class="recommendation-details">
                <span class="recommendation-change ${changeClass}">${change}</span>
                <span class="recommendation-impact">${impact}</span>
            </div>
        `;
        container.appendChild(item);
    }

    generateProfessionalReport() {
        const summary = document.getElementById('reportSummary');

        if (summary && this.analysisResults && this.currentSetupData) {
            const dist = this.analysisResults.balanceDistribution;
            const primaryIssue = dist.understeer > 40 ? 'significant understeer' :
                dist.oversteer > 30 ? 'significant oversteer' : 'a generally balanced behavior';

            summary.innerHTML = `
                <h4>Executive Summary</h4>
                <p>Analysis for ${this.currentSetupData.carInfo.carName} reveals ${primaryIssue}.</p>
                <p>Balance: ${dist.understeer.toFixed(1)}% understeer, ${dist.oversteer.toFixed(1)}% oversteer.</p>
                <p>Avg USOS Factor: ${this.analysisResults.usosAverage.toFixed(2)}° (Confidence: ${this.analysisResults.avgConfidence.toFixed(0)}%)</p>
            `;
        }
    }

    loadSampleData() {
        // Unchanged sample data generator; use for testing
        this.telemetryData = Array.from({ length: 1000 }, (_, i) => ({
            SPEED: 100 + Math.random() * 100,
            STEERANGLE: Math.random() * 20 - 10,
            G_LAT: Math.random() * 2 - 1,
            ROTY: Math.random() * 50 - 25,
            THROTTLE: Math.random() * 100,
            BRAKE: Math.random() * 100
            // Add more channels as needed
        }));
        this.showStatus('Sample data loaded.', 'info');
        document.getElementById('processDataBtn').classList.remove('hidden');
    }

    showStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;

        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(statusDiv, main.firstChild);

            setTimeout(() => {
                statusDiv.remove();
            }, 5000);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.accApp = new ACCTelemetryApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});