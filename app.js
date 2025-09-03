/ Professional ACC Telemetry Analysis Application - Setup JSON Upload Version
class ACCTelemetryApp {
    constructor() {
        this.currentSetupData = null;
        this.telemetryData = [];
        this.processedData = null;
        this.charts = {};
        this.analysisResults = {};
        
        // CORRECTED: Analysis thresholds now reflect the inverted USOS calculation logic.
        this.analysisThresholds = {
            oversteer: 1.0,     // Positive USOS = oversteer (need LESS steering than ideal)
            understeer: -2.0,   // Negative USOS = understeer (need MORE steering than ideal)
            minLateralG: 0.3,
            minSpeed: 50, // This is in km/h
            wheelSlipThreshold: 0.15,
            yawDeficitThreshold: 5.0
        };

        // Recommendation groups
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
        this.setupSetupControls(); // IMPLEMENTED
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
            
            // Extract car information
            const carInfo = {
                carName: setup.carName,
                wheelbase: this.getWheelbaseFromCarName(setup.carName)
            };
            
            // Extract alignment data using actual values from JSON
            const alignment = {
                // Use staticCamber values (actual camber in degrees)
                camberFL: setup.basicSetup.alignment.staticCamber[0],
                camberFR: setup.basicSetup.alignment.staticCamber[1], 
                camberRL: setup.basicSetup.alignment.staticCamber[2],
                camberRR: setup.basicSetup.alignment.staticCamber[3],
                
                // Use toeOutLinear values (convert radians to degrees)
                toeFL: setup.basicSetup.alignment.toeOutLinear[0] * 57.2958,
                toeFR: setup.basicSetup.alignment.toeOutLinear[1] * 57.2958,
                toeRL: setup.basicSetup.alignment.toeOutLinear[2] * 57.2958,
                toeRR: setup.basicSetup.alignment.toeOutLinear[3] * 57.2958,
                
                // Caster values
                casterLF: setup.basicSetup.alignment.casterLF,
                casterRF: setup.basicSetup.alignment.casterRF
            };
            
            // Extract other setup parameters
            const currentSetup = {
                // Tire pressures
                pressureFL: setup.basicSetup.tyres.tyrePressure[0],
                pressureFR: setup.basicSetup.tyres.tyrePressure[1],
                pressureRL: setup.basicSetup.tyres.tyrePressure[2], 
                pressureRR: setup.basicSetup.tyres.tyrePressure[3],
                
                // Electronics
                tc1: setup.basicSetup.electronics.tC1,
                tc2: setup.basicSetup.electronics.tC2,
                abs: setup.basicSetup.electronics.abs,
                
                // Mechanical
                arbFront: setup.advancedSetup.mechanicalBalance.aRBFront,
                arbRear: setup.advancedSetup.mechanicalBalance.aRBRear,
                brakeBias: setup.advancedSetup.mechanicalBalance.brakeBias,
                
                // Aero
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

    // Fallback function for wheelbase (can be expanded)
    getWheelbaseFromCarName(carName) {
        const wheelbases = {
            'mercedes_amg_gt3_evo': 2.665,
            'mercedes_amg_gt2': 2.630,
            'bmw_m4_gt3': 2.810,
            'ferrari_488_gt3_evo': 2.650,
            'ferrari_488_gt3': 2.650,
            'audi_r8_lms_evo': 2.650,
            'audi_r8_lms_evo_ii': 2.650,
            'lamborghini_huracan_gt3_evo': 2.620,
            'lamborghini_huracan_gt3_evo2': 2.620,
            'porsche_911ii_gt3_r': 2.457,
            'mclaren_720s_gt3': 2.670,
            'bentley_continental_gt3_2018': 2.851,
            'nissan_gt_r_nismo_gt3': 2.780
        };
        
        return wheelbases[carName] || 2.650; // Default wheelbase
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
                            <div class="alignment-row">
                                <span>Front Camber:</span>
                                <span>${alignment.camberFL.toFixed(1)}° / ${alignment.camberFR.toFixed(1)}°</span>
                            </div>
                            <div class="alignment-row">
                                <span>Rear Camber:</span>
                                <span>${alignment.camberRL.toFixed(1)}° / ${alignment.camberRR.toFixed(1)}°</span>
                            </div>
                            <div class="alignment-row">
                                <span>Front Toe:</span>
                                <span>${alignment.toeFL.toFixed(2)}° / ${alignment.toeFR.toFixed(2)}°</span>
                            </div>
                            <div class="alignment-row">
                                <span>Rear Toe:</span>
                                <span>${alignment.toeRL.toFixed(2)}° / ${alignment.toeRR.toFixed(2)}°</span>
                            </div>
                            <div class="alignment-row">
                                <span>Caster:</span>
                                <span>${alignment.casterLF}° / ${alignment.casterRF}°</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setup-group">
                        <h5>Electronics</h5>
                        <div class="electronics-values">
                            <div class="setup-row">
                                <span>TC1:</span><span>${setup.tc1}</span>
                            </div>
                            <div class="setup-row">
                                <span>TC2:</span><span>${setup.tc2}</span>
                            </div>
                            <div class="setup-row">
                                <span>ABS:</span><span>${setup.abs}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setup-group">
                        <h5>Mechanical</h5>
                        <div class="mechanical-values">
                            <div class="setup-row">
                                <span>ARB Front:</span><span>${setup.arbFront}</span>
                            </div>
                            <div class="setup-row">
                                <span>ARB Rear:</span><span>${setup.arbRear}</span>
                            </div>
                            <div class="setup-row">
                                <span>Brake Bias:</span><span>${setup.brakeBias}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setup-group">
                        <h5>Aerodynamics</h5>
                        <div class="aero-values">
                            <div class="setup-row">
                                <span>Splitter:</span><span>${setup.splitter}</span>
                            </div>
                            <div class="setup-row">
                                <span>Rear Wing:</span><span>${setup.rearWing}</span>
                            </div>
                            <div class="setup-row">
                                <span>Ride Height F/R:</span><span>${setup.rideHeightFront.toFixed(0)} / ${setup.rideHeightRear.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('setupInfo').classList.remove('hidden');
        console.log('Setup information displayed successfully');
    }

    loadSampleData() {
        console.log('Generating professional sample data...');
        this.showStatus('Generating sample telemetry data...', 'info');
        
        this.telemetryData = [];
        const duration = 120;
        const sampleRate = 0.02;

        for (let t = 0; t < duration; t += sampleRate) {
            const lapProgress = (t % 90) / 90;
            const cornerPhase = this.generateCornerPhase(lapProgress);
            
            const dataPoint = {
                Time: t,
                SPEED: this.generateSpeed(lapProgress, cornerPhase),
                STEERANGLE: this.generateSteerAngle(lapProgress, cornerPhase),
                G_LAT: this.generateLateralG(lapProgress, cornerPhase),
                ROTY: this.generateYawRate(lapProgress, cornerPhase),
                THROTTLE: this.generateThrottle(lapProgress, cornerPhase),
                BRAKE: this.generateBrake(lapProgress, cornerPhase),
                // Wheel speed channels
                WHEEL_SPEED_LF: this.generateWheelSpeed('LF', lapProgress, cornerPhase),
                WHEEL_SPEED_RF: this.generateWheelSpeed('RF', lapProgress, cornerPhase),
                WHEEL_SPEED_LR: this.generateWheelSpeed('LR', lapProgress, cornerPhase),
                WHEEL_SPEED_RR: this.generateWheelSpeed('RR', lapProgress, cornerPhase),
                // Suspension telemetry
                SUSP_TRAVEL_LF: this.generateSuspensionTravel('LF', lapProgress, cornerPhase),
                SUSP_TRAVEL_RF: this.generateSuspensionTravel('RF', lapProgress, cornerPhase),
                SUSP_TRAVEL_LR: this.generateSuspensionTravel('LR', lapProgress, cornerPhase),
                SUSP_TRAVEL_RR: this.generateSuspensionTravel('RR', lapProgress, cornerPhase),
            };
            this.telemetryData.push(dataPoint);
        }

        console.log('Generated', this.telemetryData.length, 'data points');
        
        this.validateTelemetryData(Object.keys(this.telemetryData[0]));
        
        const processBtn = document.getElementById('processDataBtn');
        if (processBtn) {
            processBtn.classList.remove('hidden');
        }
        
        this.showStatus(`Sample telemetry data loaded: ${this.telemetryData.length} data points`, 'success');
    }

    // Helper methods for sample data generation
    generateCornerPhase(lapProgress) {
        const corners = [
            {start: 0.1, end: 0.25, severity: 0.8, direction: 1},    // Right turn
            {start: 0.35, end: 0.45, severity: 0.9, direction: -1},  // Left turn
            {start: 0.5, end: 0.55, severity: 0.4, direction: 1},    // Mild right
            {start: 0.7, end: 0.85, severity: 1.0, direction: -1},   // Hard left
        ];

        for (const corner of corners) {
            if (lapProgress >= corner.start && lapProgress <= corner.end) {
                const cornerProgress = (lapProgress - corner.start) / (corner.end - corner.start);
                const intensity = Math.sin(cornerProgress * Math.PI) * corner.severity;
                return {inCorner: true, intensity, direction: corner.direction, corner};
            }
        }
        return {inCorner: false, intensity: 0, direction: 0};
    }

    generateSpeed(lapProgress, cornerPhase) {
        const baseSpeed = 200 + Math.sin(lapProgress * Math.PI * 4) * 50;
        const cornerReduction = cornerPhase.inCorner ? cornerPhase.intensity * 80 : 0;
        return Math.max(60, baseSpeed - cornerReduction + (Math.random() - 0.5) * 10);
    }

    generateSteerAngle(lapProgress, cornerPhase) {
        if (!cornerPhase.inCorner) return (Math.random() - 0.5) * 5;
        
        let baseSteer = cornerPhase.direction * cornerPhase.intensity * 35;
        
        // Create varied scenarios for understeer/oversteer detection
        if (cornerPhase.corner && cornerPhase.corner.direction === -1 && cornerPhase.intensity > 0.7) {
            baseSteer *= 1.3; // More steering needed (understeer scenario)
        }
        if (cornerPhase.corner && cornerPhase.corner.direction === 1 && cornerPhase.intensity > 0.6) {
            baseSteer *= 0.7; // Less steering needed (oversteer scenario)
        }
        
        return baseSteer + (Math.random() - 0.5) * 3;
    }

    generateLateralG(lapProgress, cornerPhase) {
        if (!cornerPhase.inCorner) return (Math.random() - 0.5) * 0.2;
        return cornerPhase.direction * cornerPhase.intensity * 1.8 + (Math.random() - 0.5) * 0.1;
    }

    generateYawRate(lapProgress, cornerPhase) {
        if (!cornerPhase.inCorner) return (Math.random() - 0.5) * 2;
        return cornerPhase.direction * cornerPhase.intensity * 25 + (Math.random() - 0.5) * 2;
    }

    generateThrottle(lapProgress, cornerPhase) {
        const baseThrottle = 85 + Math.sin(lapProgress * Math.PI * 6) * 15;
        const cornerReduction = cornerPhase.inCorner ? cornerPhase.intensity * 40 : 0;
        return Math.max(0, Math.min(100, baseThrottle - cornerReduction + (Math.random() - 0.5) * 8));
    }

    generateBrake(lapProgress, cornerPhase) {
        if (!cornerPhase.inCorner) return Math.max(0, (Math.random() - 0.9) * 50);
        const cornerEntry = cornerPhase.intensity > 0.7 ? 60 : 0;
        return Math.max(0, cornerEntry + (Math.random() - 0.5) * 10);
    }

    generateWheelSpeed(wheel, lapProgress, cornerPhase) {
        const speed = this.generateSpeed(lapProgress, cornerPhase) / 3.6;
        let wheelSpeed = speed;
        
        if (cornerPhase.inCorner) {
            const isInside = (wheel.includes('L') && cornerPhase.direction > 0) || 
                           (wheel.includes('R') && cornerPhase.direction < 0);
            const isDriven = wheel.includes('R');
            
            if (isInside) wheelSpeed *= (1 - cornerPhase.intensity * 0.05);
            if (isDriven && cornerPhase.intensity > 0.5) {
                wheelSpeed *= (1 + cornerPhase.intensity * 0.1);
            }
        }
        
        return wheelSpeed + (Math.random() - 0.5) * 0.5;
    }

    generateSuspensionTravel(wheel, lapProgress, cornerPhase) {
        let baseTravel = 45 + Math.sin(lapProgress * Math.PI * 8) * 10;
        
        if (cornerPhase.inCorner) {
            const isOutside = (wheel.includes('L') && cornerPhase.direction < 0) || 
                            (wheel.includes('R') && cornerPhase.direction > 0);
            if (isOutside) {
                baseTravel += cornerPhase.intensity * 25;
            }
        }
        
        return Math.max(5, Math.min(95, baseTravel + (Math.random() - 0.5) * 5));
    }

    generateSuspensionVelocity(wheel, lapProgress, cornerPhase) {
        if (!cornerPhase.inCorner) return (Math.random() - 0.5) * 2;
        return cornerPhase.direction * cornerPhase.intensity * 15 + (Math.random() - 0.5) * 3;
    }

    validateTelemetryData(headers) {
        console.log('Validating telemetry data channels...');
        const required = ['SPEED', 'STEERANGLE', 'G_LAT', 'ROTY'];
        const optional = ['WHEEL_SPEED_LF', 'WHEEL_SPEED_RF', 'WHEEL_SPEED_LR', 'WHEEL_SPEED_RR',
                         'SUSP_TRAVEL_LF', 'SUSP_TRAVEL_RF', 'SUSP_TRAVEL_LR', 'SUSP_TRAVEL_RR'];
        
        const validation = document.getElementById('dataValidation');
        const results = document.getElementById('validationResults');
        
        if (!validation || !results) {
            console.warn('Validation containers not found');
            return;
        }
        
        let html = '';

        required.forEach(channel => {
            const isValid = headers.includes(channel);
            
            html += `
                <div class="validation-item ${isValid ? 'valid' : 'invalid'}">
                    <div class="validation-icon ${isValid ? 'valid' : 'invalid'}">
                        ${isValid ? '✓' : '✗'}
                    </div>
                    <span>${channel} - ${isValid ? 'Found' : 'Missing (Required)'}</span>
                </div>
            `;
        });

        optional.forEach(channel => {
            const isValid = headers.includes(channel);
            html += `
                <div class="validation-item ${isValid ? 'valid' : 'invalid'}">
                    <div class="validation-icon ${isValid ? 'valid' : 'invalid'}">
                        ${isValid ? '✓' : '○'}
                    </div>
                    <span>${channel} - ${isValid ? 'Found (Enhanced Analysis)' : 'Missing (Optional)'}</span>
                </div>
            `;
        });

        results.innerHTML = html;
        validation.classList.remove('hidden');
        console.log('Data validation complete');
    }

    processData() {
        if (this.telemetryData.length === 0) {
            this.showStatus('Please load telemetry data first', 'error');
            return;
        }

        console.log('Processing telemetry data...');
        this.showStatus('Processing telemetry data...', 'info');
        
        try {
            // Create a default setup if none loaded
            if (!this.currentSetupData) {
                console.log('No setup JSON loaded, creating default setup data...');
                this.currentSetupData = {
                    carInfo: {
                        carName: 'Default Car',
                        wheelbase: 2.650
                    },
                    alignment: {
                        camberFL: -3.5, camberFR: -3.5, camberRL: -2.5, camberRR: -2.5,
                        toeFL: 0, toeFR: 0, toeRL: 0.2, toeRR: 0.2,
                        casterLF: 8, casterRF: 8
                    },
                    currentSetup: {
                        pressureFL: 27.5,
                        tc1: 3, tc2: 3, abs: 5,
                        arbFront: 5, arbRear: 3, brakeBias: 55,
                        splitter: 1, rearWing: 5
                    }
                };
                this.displaySetupInfo(this.currentSetupData);
                this.populateSetupControls(this.currentSetupData.currentSetup);
            }
            
            this.processedData = this.performAdvancedAnalysis();
            this.displayAnalysisResults();
            this.generateGroupedRecommendations();
            this.generateProfessionalReport();
            
            // Show sections
            const sections = ['analysisSection', 'recommendationsSection', 'setupSection', 'reportSection'];
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.remove('hidden');
                }
            });

            this.showStatus('Analysis complete - telemetry processed successfully!', 'success');
            
            setTimeout(() => {
                const analysisSection = document.getElementById('analysisSection');
                if (analysisSection) {
                    analysisSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);
            
        } catch (error) {
            console.error('Error processing data:', error);
            this.showStatus('Error processing data: ' + error.message, 'error');
        }
    }

    // USOS calculation using actual alignment values from JSON
    // THIS METHOD WILL BE REMOVED as its logic is being integrated and improved in performAdvancedAnalysis
    /* calculateUSOS(data, wheelbase) { ... } */

    performAdvancedAnalysis() {
        console.log('Performing advanced telemetry analysis...');
        if (!this.telemetryData || this.telemetryData.length === 0) return [];

        const wheelbase = this.currentSetupData.carInfo.wheelbase;
        const g = 9.81; // Gravity constant

        const processed = this.telemetryData.map(p => {
            const speed_ms = p.SPEED / 3.6;
            
            // Calculate Ideal Yaw Rate from G_LAT for accuracy
            let idealYawRate = 0;
            if (speed_ms > 5) {
                idealYawRate = (p.G_LAT * g / speed_ms) * (180 / Math.PI); // in deg/s
            }

            // Calculate Understeer Angle (USOS)
            let understeerAngle = 0;
            if (speed_ms > 1) { // Only calculate if moving
                understeerAngle = p.STEERANGLE - (idealYawRate * wheelbase / speed_ms * 57.2958);
            }
            
            // Alternative USOS from Yaw Rate
            const yawRateDeficit = idealYawRate - p.ROTY;
            
            const isCorner = Math.abs(p.G_LAT) > this.analysisThresholds.minLateralG && p.SPEED > this.analysisThresholds.minSpeed;
            
            let classification = 'neutral';
            if (isCorner) {
                if (yawRateDeficit > this.analysisThresholds.yawDeficitThreshold) {
                    classification = 'understeer';
                } else if (yawRateDeficit < -this.analysisThresholds.yawDeficitThreshold) {
                    classification = 'oversteer';
                }
            }

            // Fallback to INVERSE_CORNER_RADIUS if available (more robust)
            let icr = 0;
            if (p.INVERSE_CORNER_RADIUS !== undefined) {
                icr = p.INVERSE_CORNER_RADIUS;
            } else if (p.CORNER_RADIUS !== undefined && p.CORNER_RADIUS > 0) {
                icr = 1 / p.CORNER_RADIUS;
            } else if (speed_ms > 5) {
                icr = (p.G_LAT * g) / (speed_ms * speed_ms);
            }

            return {
                ...p,
                idealYawRate,
                understeerAngle,
                yawRateDeficit,
                isCorner,
                classification,
                INVERSE_CORNER_RADIUS: icr
            };
        });

        const cornerPoints = processed.filter(p => p.isCorner);
        const totalCornerPoints = cornerPoints.length;

        const understeerCount = cornerPoints.filter(p => p.classification === 'understeer').length;
        const oversteerCount = cornerPoints.filter(p => p.classification === 'oversteer').length;
        const neutralCount = totalCornerPoints - understeerCount - oversteerCount;

        if (totalCornerPoints > 0) {
            this.analysisResults = {
                usosAverage: cornerPoints.reduce((sum, p) => sum + p.yawRateDeficit, 0) / totalCornerPoints,
                confidence: (totalCornerPoints / processed.length) * 100,
                balanceDistribution: {
                    understeer: (understeerCount / totalCornerPoints) * 100,
                    oversteer: (oversteerCount / totalCornerPoints) * 100,
                    neutral: (neutralCount / totalCornerPoints) * 100,
                },
                suspensionAnalysis: this.analyzeSuspensionData(processed)
            };
        } else {
            this.analysisResults = {
                usosAverage: 0,
                confidence: 0,
                balanceDistribution: { understeer: 0, oversteer: 0, neutral: 100 },
                suspensionAnalysis: this.analyzeSuspensionData(processed)
            };
            this.showStatus("No valid cornering data found to analyze balance.", "warning");
        }

        console.log('Advanced analysis complete.');
        return processed;
    }

    analyzeSuspensionData(data) {
        const susp = { frontTravel: [], rearTravel: [], bumpstopHits: { front: 0, rear: 0 } };
        data.forEach(p => {
            const fT = ((p.SUSP_TRAVEL_LF || 0) + (p.SUSP_TRAVEL_RF || 0)) / 2;
            const rT = ((p.SUSP_TRAVEL_LR || 0) + (p.SUSP_TRAVEL_RR || 0)) / 2;
            susp.frontTravel.push(fT); susp.rearTravel.push(rT);
            if (fT > 90) susp.bumpstopHits.front++; if (rT > 90) susp.bumpstopHits.rear++;
        });
        const avgF = susp.frontTravel.reduce((a, b) => a + b, 0) / (susp.frontTravel.length || 1);
        const avgR = susp.rearTravel.reduce((a, b) => a + b, 0) / (susp.rearTravel.length || 1);
        susp.rideHeightIssues = avgF > 80 || avgR > 80; susp.avgFrontTravel = avgF; susp.avgRearTravel = avgR;
        return susp;
    }

    displayAnalysisResults() {
        console.log('Displaying analysis results...');
        
        try {
            this.updateMetricValues();
            
            setTimeout(() => {
                this.createAdvancedCharts();
            }, 100);
            
            this.displayEnhancedCornerAnalysis();
            this.updateSuspensionMetrics();
            this.updateBalanceBreakdown();
            
        } catch (error) {
            console.error('Error displaying analysis results:', error);
        }
    }

    updateMetricValues() {
        if (!this.analysisResults) return;

        const { usosAverage, confidence, balanceDistribution, suspensionAnalysis } = this.analysisResults;
        document.getElementById('usosValue').textContent = usosAverage.toFixed(2);
        document.getElementById('usosConfidence').textContent = confidence.toFixed(0);
        document.getElementById('balanceDistribution').textContent = `${balanceDistribution.understeer.toFixed(0)}/${balanceDistribution.neutral.toFixed(0)}/${balanceDistribution.oversteer.toFixed(0)}`;
        if (suspensionAnalysis) {
            document.getElementById('suspensionTravel').textContent = `${suspensionAnalysis.avgFrontTravel.toFixed(1)}/${suspensionAnalysis.avgRearTravel.toFixed(1)}`;
            document.getElementById('bumpstopHits').textContent = `${suspensionAnalysis.bumpstopHits.front}/${suspensionAnalysis.bumpstopHits.rear}`;
        }
    }

    updateSuspensionMetrics() {
        if (!this.analysisResults.suspensionAnalysis) return;

        const susp = this.analysisResults.suspensionAnalysis;
        
        document.getElementById('frontAvgTravel').textContent = `${susp.avgFrontTravel.toFixed(1)}%`;
        document.getElementById('rearAvgTravel').textContent = `${susp.avgRearTravel.toFixed(1)}%`;
        document.getElementById('bumpstopCount').textContent = susp.bumpstopHits.front + susp.bumpstopHits.rear;
        const statusEl = document.getElementById('rideHeightStatus');
        statusEl.textContent = susp.rideHeightIssues ? 'Issues Detected' : 'Optimal';
        statusEl.className = `susp-value ${susp.rideHeightIssues ? 'text-warning' : 'text-success'}`;
    }

    updateBalanceBreakdown() {
        if (!this.analysisResults.balanceDistribution) return;

        const dist = this.analysisResults.balanceDistribution;
        
        document.getElementById('understeerPercent').textContent = `${dist.understeer.toFixed(1)}%`;
        document.getElementById('neutralPercent').textContent = `${dist.neutral.toFixed(1)}%`;
        document.getElementById('oversteerPercent').textContent = `${dist.oversteer.toFixed(1)}%`;
    }

    createAdvancedCharts() {
        console.log('Creating advanced charts...');
        try {
            this.createUSOS_Chart();
            this.createBalanceChart();
            this.createSuspensionChart();
        } catch (error) {
            console.error('Error creating charts:', error);
        }
    }

    createUSOS_Chart() {
        const canvas = document.getElementById('usosChart');
        if (!canvas || !this.processedData) return;
        
        if (this.charts.usos) this.charts.usos.destroy();

        const cornerData = this.processedData.filter(p => p.isCorner);
        
        this.charts.usos = new Chart(canvas.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Understeer',
                        data: cornerData.filter(p => p.classification === 'understeer').map(p => ({x: Math.abs(p.G_LAT), y: p.understeerAngle})),
                        backgroundColor: '#B4413C'
                    },
                    {
                        label: 'Oversteer', 
                        data: cornerData.filter(p => p.classification === 'oversteer').map(p => ({x: Math.abs(p.G_LAT), y: p.understeerAngle})),
                        backgroundColor: '#FFC185'
                    },
                    {
                        label: 'Neutral',
                        data: cornerData.filter(p => p.classification === 'neutral').map(p => ({x: Math.abs(p.G_LAT), y: p.understeerAngle})),
                        backgroundColor: '#1FB8CD'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {title: {display: true, text: 'Lateral G (g)'}},
                    y: {
                        title: {display: true, text: 'USOS Angle (deg)'},
                    }
                },
                plugins: {
                    title: {display: true, text: 'USOS Analysis'},
                }
            }
        });
    }

    createBalanceChart() {
        const canvas = document.getElementById('balanceChart');
        if (!canvas || !this.analysisResults) return;
        
        if (this.charts.balance) this.charts.balance.destroy();

        const dist = this.analysisResults.balanceDistribution;
        
        this.charts.balance = new Chart(canvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Understeer', 'Neutral', 'Oversteer'],
                datasets: [{
                    data: [dist.understeer, dist.neutral, dist.oversteer],
                    backgroundColor: ['#B4413C', '#1FB8CD', '#FFC185'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {display: true, text: 'Balance Distribution'},
                    legend: {position: 'bottom'}
                }
            }
        });
    }

    createSuspensionChart() {
        const canvas = document.getElementById('suspensionChart');
        if (!canvas || !this.analysisResults.suspensionAnalysis) return;
        
        if (this.charts.suspension) this.charts.suspension.destroy();

        const suspData = this.analysisResults.suspensionAnalysis;
        const sampledData = suspData.frontTravel.filter((_, i) => i % 10 === 0);
        const sampledRear = suspData.rearTravel.filter((_, i) => i % 10 === 0);
        
        this.charts.suspension = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: sampledData.map((_, i) => (i * 0.2).toFixed(1)),
                datasets: [
                    {
                        label: 'Front Travel (%)',
                        data: sampledData,
                        borderColor: '#1FB8CD',
                        tension: 0.1
                    },
                    {
                        label: 'Rear Travel (%)',
                        data: sampledRear,
                        borderColor: '#B4413C',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {title: {display: true, text: 'Time (s)'}},
                    y: {title: {display: true, text: 'Suspension Travel (%)'}}
                }
            }
        });
    }

    displayEnhancedCornerAnalysis() {
        const container = document.getElementById('cornersTable');
        if (!container || !this.processedData) return;
        
        const cornerGroups = this.groupCornersByPhase(this.processedData.filter(p => p.isCorner));
        
        let html = `
            <div class="corner-row header">
                <div class="corner-cell">Corner #</div>
                <div class="corner-cell">Max Lat G</div>
                <div class="corner-cell">Avg ICR (1/m)</div>
                <div class="corner-cell">Balance</div>
                <div class="corner-cell">Avg USOS</div>
            </div>
        `;

        cornerGroups.slice(0, 10).forEach((corner, index) => {
            html += `
                <div class="corner-row">
                    <div class="corner-cell">${index + 1}</div>
                    <div class="corner-cell">${corner.maxLateralG.toFixed(2)}</div>
                    <div class="corner-cell font-mono">${corner.avgICR.toFixed(3)}</div>
                    <div class="corner-cell">
                        <span class="corner-status ${corner.classification}">${corner.classification}</span>
                    </div>
                    <div class="corner-cell font-mono">${corner.avgUsos.toFixed(2)}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    groupCornersByPhase(cornerData) {
        const groups = [];
        let currentGroup = [];
        
        for (let i = 0; i < cornerData.length; i++) {
            if (Math.abs(cornerData[i].G_LAT) > 0.8) {
                currentGroup.push(cornerData[i]);
            } else if (currentGroup.length > 5) {
                this.processCornerGroup(groups, currentGroup);
                currentGroup = [];
            }
        }
        if (currentGroup.length > 5) { this.processCornerGroup(groups, currentGroup); }
        
        return groups;
    }
    processCornerGroup(groups, groupData) {
        const maxG = Math.max(...groupData.map(p => Math.abs(p.G_LAT)));
        const avgUsos = groupData.reduce((s, p) => s + p.yawRateDeficit, 0) / groupData.length;
        const avgICR = groupData.reduce((s, p) => s + p.INVERSE_CORNER_RADIUS, 0) / groupData.length;

        // REFINED LOGIC: Classify the corner based on its average USOS value.
        let dominantClassification = 'neutral';
        if (avgUsos > this.analysisThresholds.yawDeficitThreshold / 2) {
            dominantClassification = 'understeer';
        } else if (avgUsos < -this.analysisThresholds.yawDeficitThreshold / 2) {
            dominantClassification = 'oversteer';
        }

        groups.push({
            maxLateralG: maxG,
            avgUsos: avgUsos,
            avgICR: avgICR, // Added for display
            classification: dominantClassification,
        });
    }

    generateGroupedRecommendations() {
        if (!this.analysisResults) return;
        const { usosAverage, balanceDistribution } = this.analysisResults;
        let primaryIssue = 'neutral';
        // More sensitive detection of primary issue
        if (usosAverage < -1.0 || balanceDistribution.understeer > 45) {
            primaryIssue = 'understeer';
        } else if (usosAverage > 0.8 || balanceDistribution.oversteer > 40) {
            primaryIssue = 'oversteer';
        }

        console.log(`Primary issue detected: ${primaryIssue}`);

        this.generateConservativeRecommendations(primaryIssue);
        this.generateMechanicalRecommendations(primaryIssue);
        this.generateAerodynamicRecommendations(primaryIssue);
    }

    generateConservativeRecommendations(issue) {
        const container = document.getElementById('conservativeList');
        if (!container) return;
        container.innerHTML = '';
        const currentBB = this.currentSetupData?.currentSetup?.brakeBias || 55.0;

        if (issue === 'understeer') {
            this.addRecommendationItem(container, 'Reduce TC1 for more rotation on exit', '-1 click', 85, 'Allows more wheel slip');
            this.addRecommendationItem(container, 'Lower front tyre pressures', '-0.2 psi', 75, 'Increases front contact patch');
            this.addRecommendationItem(container, 'Increase rear tyre pressures', '+0.2 psi', 70, 'Reduces rear grip to aid rotation');
            this.addRecommendationItem(container, 'Shift brake bias rearward', `${(currentBB - 0.4).toFixed(1)}%`, 80, 'Promotes trail-braking rotation');
            this.addRecommendationItem(container, 'Reduce ABS intervention', '-1 click', 65, 'Can help bite on turn-in');
        } else if (issue === 'oversteer') {
            this.addRecommendationItem(container, 'Increase TC1 for more stability', '+1 click', 85, 'Reduces power oversteer');
            this.addRecommendationItem(container, 'Increase TC2 for better traction', '+1 click', 75, 'Catches snaps on throttle');
            this.addRecommendationItem(container, 'Lower rear tyre pressures', '-0.2 psi', 80, 'Increases rear contact patch');
            this.addRecommendationItem(container, 'Increase front tyre pressures', '+0.2 psi', 70, 'Reduces front grip slightly');
            this.addRecommendationItem(container, 'Shift brake bias forward', `${(currentBB + 0.4).toFixed(1)}%`, 75, 'Reduces lift-off oversteer');
        } else {
            this.addRecommendationItem(container, 'Electronics and Pressures are balanced', 'Maintain', 90, 'No major changes needed');
            this.addRecommendationItem(container, 'Fine-tune tyre pressures for track temp', '±0.1 psi', 80, 'Optimize for conditions');
            this.addRecommendationItem(container, 'Verify brake bias for stability', '±0.2%', 75, 'Adjust for personal preference');
            this.addRecommendationItem(container, 'TC settings appear optimal', 'Maintain', 85, 'Adjust if surface is slippery');
            this.addRecommendationItem(container, 'ABS setting is in a good window', 'Maintain', 80, 'Adjust for heavy braking zones');
        }
    }

    generateMechanicalRecommendations(issue) {
        const container = document.getElementById('mechanicalList');
        if (!container) return;
        container.innerHTML = '';
        const susp = this.analysisResults.suspensionAnalysis;
        const frontHits = susp?.bumpstopHits?.front || 0;

        if (issue === 'understeer') {
            this.addRecommendationItem(container, 'Soften front Anti-Roll Bar', '-2 clicks', 90, 'Increases front mechanical grip');
            this.addRecommendationItem(container, 'Stiffen rear Anti-Roll Bar', '+1 click', 80, 'Reduces rear grip to aid rotation');
            this.addRecommendationItem(container, 'Increase front negative camber', '-0.2 deg', 75, 'Improves mid-corner front grip');
            this.addRecommendationItem(container, 'Add slight front toe out', '±0.05 deg', 70, 'Improves turn-in response');
            if (frontHits > 5) {
                this.addRecommendationItem(container, 'Stiffen front bumpstop rate', '+2 clicks', 85, 'Prevents bottoming out, maintains platform');
            } else {
                this.addRecommendationItem(container, 'Soften front springs', '-1 click', 70, 'Allows more weight transfer forward');
            }
        } else if (issue === 'oversteer') {
            this.addRecommendationItem(container, 'Stiffen front Anti-Roll Bar', '+2 clicks', 90, 'Reduces front grip, balances car');
            this.addRecommendationItem(container, 'Soften rear Anti-Roll Bar', '-2 clicks', 85, 'Increases rear mechanical grip');
            this.addRecommendationItem(container, 'Reduce rear toe-in', '±0.05 deg', 75, 'Frees up the rear on entry');
            this.addRecommendationItem(container, 'Soften rear springs', '-1 click', 80, 'Improves traction and stability');
            this.addRecommendationItem(container, 'Increase rear negative camber', '-0.2 deg', 70, 'Improves rear grip mid-corner');
        } else {
            this.addRecommendationItem(container, 'Mechanical balance is strong', 'Maintain', 90, 'ARBs and Springs are in a good window');
            this.addRecommendationItem(container, 'Check front toe for responsiveness', '±0.03 deg', 80, 'Fine-tune turn-in feel');
            this.addRecommendationItem(container, 'Verify camber angles for tyre wear', '±0.1 deg', 75, 'Optimize for long runs');
            this.addRecommendationItem(container, 'Suspension settings are effective', 'Maintain', 85, 'Platform is stable');
             if (frontHits > 5) {
                this.addRecommendationItem(container, 'Front bumpstops are active', 'Consider +1 click', 85, 'Potential to improve stability');
            } else {
                this.addRecommendationItem(container, 'Bumpstop settings appear optimal', 'Maintain', 80, 'Not hitting bumpstops excessively');
            }
        }
    }

    generateAerodynamicRecommendations(issue) {
        const container = document.getElementById('aerodynamicList');
        if (!container) return;
        container.innerHTML = '';
        const susp = this.analysisResults.suspensionAnalysis;
        const frontHits = susp?.bumpstopHits?.front || 0;

        if (issue === 'understeer') {
            // CORRECTED LOGIC: To fix understeer, you need MORE front downforce or LESS rear.
            this.addRecommendationItem(container, 'Increase front splitter', '+1 click', 85, 'Shifts aero balance forward');
            this.addRecommendationItem(container, 'Decrease rear wing', '-1 click', 90, 'Reduces rear downforce to aid rotation');
            this.addRecommendationItem(container, 'Lower front ride height', '-2 mm', 80, 'Increases rake, shifts aero forward');
            this.addRecommendationItem(container, 'Raise rear ride height', '+2 mm', 80, 'Increases rake, shifts aero forward');
             if (frontHits > 5) {
                this.addRecommendationItem(container, 'Front is bottoming out', 'WARNING', 95, 'Stiffen front springs before lowering ride height');
            } else {
                this.addRecommendationItem(container, 'Aero platform is stable', 'Safe to adjust', 70, 'No excessive bottoming out detected');
            }
        } else if (issue === 'oversteer') {
            // CORRECTED LOGIC: To fix oversteer, you need LESS front downforce or MORE rear.
            this.addRecommendationItem(container, 'Increase rear wing', '+1 click', 90, 'Increases rear stability');
            this.addRecommendationItem(container, 'Decrease front splitter', '-1 click', 85, 'Shifts aero balance rearward');
            this.addRecommendationItem(container, 'Raise front ride height', '+2 mm', 80, 'Reduces rake, shifts aero rearward');
            this.addRecommendationItem(container, 'Lower rear ride height', '-2 mm', 80, 'Reduces rake, shifts aero rearward');
            this.addRecommendationItem(container, 'Check diffuser stall', 'Ensure RH > 60mm', 70, 'A stalled diffuser causes sudden oversteer');
        } else {
            this.addRecommendationItem(container, 'Aero balance is effective', 'Maintain', 90, 'Wing and splitter settings are well-matched');
            this.addRecommendationItem(container, 'Ride height and rake are optimal', 'Maintain', 85, 'Platform is working efficiently');
            this.addRecommendationItem(container, 'Consider track type for aero level', 'High/Low DF', 75, 'Adjust overall downforce for the circuit');
            this.addRecommendationItem(container, 'Current wing setting is a good baseline', 'Fine-tune', 80, 'Adjust by ±1 click for balance');
             if (frontHits > 5) {
                this.addRecommendationItem(container, 'Front ride height is at its limit', 'WARNING', 95, 'Do not lower front further without spring changes');
            } else {
                this.addRecommendationItem(container, 'Aero platform is stable', 'Safe to adjust', 70, 'No excessive bottoming out detected');
            }
        }
    }

    addRecommendationItem(container, text, change, confidence, impact) {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        
        const confidenceClass = confidence > 80 ? 'high' : 
                               confidence > 65 ? 'medium' : 'low';
        
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
                <p>Avg USOS Factor: ${this.analysisResults.usosAverage.toFixed(2)}°</p>
            `;
        }
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

    // IMPLEMENTED: Make setup sliders interactive
    setupSetupControls() {
        document.querySelectorAll('.setup-slider').forEach(slider => {
            slider.addEventListener('input', this.handleSliderInput.bind(this));
        });
    }

    handleSliderInput(event) {
        const slider = event.target;
        document.getElementById(`${slider.id}Value`).textContent = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 1 : 0);
    }

    // IMPLEMENTED: Populate sliders with loaded setup data
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
            appVersion: 'ACC Telemetry Analysis - Setup JSON Version'
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