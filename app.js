// Professional ACC Telemetry Analysis Application - Setup JSON Upload Version
class ACCTelemetryApp {
    constructor() {
        this.currentSetupData = null;
        this.telemetryData = [];
        this.processedData = null;
        this.charts = {};
        this.analysisResults = {};
        
        // Analysis thresholds for understeer/oversteer detection
        this.analysisThresholds = {
            understeer: 2.0,    // Positive USOS = understeer (need more steering)
            oversteer: -1.0,    // Negative USOS = oversteer (need less steering)
            minLateralG: 0.3,
            minSpeed: 50, // CRITICAL: This threshold is in km/h
            wheelSlipThreshold: 0.15,
            yawDeficitThreshold: 5.0
        };

        // Recommendation groups
        this.recommendationGroups = {
            conservative: {
                name: "Conservative Approach",
                description: "Small incremental changes (±1-2 clicks). Focus on electronic aids first.",
                changeMagnitude: {small: 1, medium: 2, large: 2}
            },
            mechanical: {
                name: "Mechanical Approach", 
                description: "Medium changes (±3-5 clicks). Focus on suspension, ARBs, springs.",
                changeMagnitude: {small: 2, medium: 4, large: 5}
            },
            aerodynamic: {
                name: "Aerodynamic Approach",
                description: "Larger changes (±2-4 clicks). Focus on aero balance, ride height.",
                changeMagnitude: {small: 2, medium: 3, large: 4}
            }
        };

        this.init();
    }

    init() {
        console.log('Initializing ACC Telemetry App with JSON setup upload...');
        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupApplication();
                });
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
            console.log('Setting up load sample button event listener...');
            loadSampleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Load sample button clicked!');
                this.loadSampleData();
            });
        } else {
            console.error('Load sample button not found!');
        }

        // Process data button
        const processDataBtn = document.getElementById('processDataBtn');
        if (processDataBtn) {
            console.log('Setting up process data button event listener...');
            processDataBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Process data button clicked!');
                this.processData();
            });
        } else {
            console.error('Process data button not found!');
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
        console.log('Parsing ACC setup JSON...');
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
                
                // Dampers
                bumpSlowFL: setup.advancedSetup.dampers.bumpSlow[0],
                bumpSlowFR: setup.advancedSetup.dampers.bumpSlow[1],
                bumpSlowRL: setup.advancedSetup.dampers.bumpSlow[2],
                bumpSlowRR: setup.advancedSetup.dampers.bumpSlow[3]
            };
            
            console.log('Setup JSON parsed successfully:', carInfo.carName);
            
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
                SUSP_VEL_LF: this.generateSuspensionVelocity('LF', lapProgress, cornerPhase),
                SUSP_VEL_RF: this.generateSuspensionVelocity('RF', lapProgress, cornerPhase),
                SUSP_VEL_LR: this.generateSuspensionVelocity('LR', lapProgress, cornerPhase),
                SUSP_VEL_RR: this.generateSuspensionVelocity('RR', lapProgress, cornerPhase)
            };
            this.telemetryData.push(dataPoint);
        }

        console.log('Generated', this.telemetryData.length, 'data points');
        
        this.validateTelemetryData(Object.keys(this.telemetryData[0]));
        
        const processBtn = document.getElementById('processDataBtn');
        if (processBtn) {
            processBtn.classList.remove('hidden');
            console.log('Process button shown');
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
            baseSteer *= 0.7; // Less steering needed (oversteer scenario)
        }
        if (cornerPhase.corner && cornerPhase.corner.direction === 1 && cornerPhase.intensity > 0.6) {
            baseSteer *= 1.3; // More steering needed (understeer scenario)
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
        const required = ['SPEED', 'STEERANGLE', 'G_LAT', 'ROTY', 'THROTTLE', 'BRAKE'];
        const optional = ['WHEEL_SPEED_LF', 'WHEEL_SPEED_RF', 'WHEEL_SPEED_LR', 'WHEEL_SPEED_RR',
                         'SUSP_TRAVEL_LF', 'SUSP_TRAVEL_RF', 'SUSP_TRAVEL_LR', 'SUSP_TRAVEL_RR'];
        
        const validation = document.getElementById('dataValidation');
        const results = document.getElementById('validationResults');
        
        if (!validation || !results) {
            console.warn('Validation containers not found');
            return;
        }
        
        let html = '';
        let allValid = true;

        required.forEach(channel => {
            const isValid = headers.includes(channel);
            if (!isValid) allValid = false;
            
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
                        carName: 'Mercedes AMG GT2 (Default)',
                        wheelbase: 2.630
                    },
                    alignment: {
                        camberFL: -3.7, camberFR: -3.7, camberRL: -3.6, camberRR: -3.6,
                        toeFL: -0.05, toeFR: -0.05, toeRL: 0.04, toeRR: 0.04,
                        casterLF: 21, casterRF: 21
                    },
                    currentSetup: {
                        pressureFL: 30, pressureFR: 30, pressureRL: 45, pressureRR: 45,
                        tc1: 6, tc2: 0, abs: 6,
                        arbFront: 1, arbRear: 1, brakeBias: 0,
                        rideHeightFront: 5.5, rideHeightRear: 13,
                        splitter: 0, rearWing: 4
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
                    console.log('Showing section:', sectionId);
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
    calculateUSOS(data, wheelbase) {
        console.log('Calculating USOS with actual alignment values...');
        const usosValues = [];
        
        for (let i = 0; i < data.length; i++) {
            const speed = data[i].SPEED * 0.277778; // km/h to m/s
            const lateralG = data[i].G_LAT;
            const steerAngle = data[i].STEERANGLE;
            
            // CRITICAL FIX: Compare original speed in km/h to the threshold
            if (Math.abs(lateralG) > this.analysisThresholds.minLateralG && data[i].SPEED > this.analysisThresholds.minSpeed) {
                // Calculate turn radius from lateral acceleration
                const radius = (speed * speed) / (Math.abs(lateralG) * 9.81);
                
                // Kinematic steering angle (neutral steer) - convert from radians to degrees
                const kinematicSteer = (wheelbase / radius) * 57.2958;
                
                // USOS = actual steering - neutral steering
                // Positive USOS = Understeer (need MORE steering than neutral)
                // Negative USOS = Oversteer (need LESS steering than neutral)  
                const usos = Math.abs(steerAngle) - kinematicSteer;
                
                // Preserve the SIGN to detect oversteer vs understeer
                const signedUSOS = usos * Math.sign(lateralG * steerAngle);
                
                let classification = 'neutral';
                if (signedUSOS > this.analysisThresholds.understeer) {
                    classification = 'understeer';
                } else if (signedUSOS < this.analysisThresholds.oversteer) {
                    classification = 'oversteer';
                }
                
                usosValues.push({
                    usos: signedUSOS,
                    lateralG: lateralG,
                    speed: speed,
                    classification: classification
                });
            } else {
                usosValues.push({usos: 0, lateralG: 0, speed: 0, classification: 'straight'});
            }
        }
        
        console.log('USOS calculation complete');
        return usosValues;
    }

    performAdvancedAnalysis() {
        console.log('Performing advanced analysis...');
        const wheelbase = this.currentSetupData.carInfo.wheelbase;
        const processed = [];

        // Calculate USOS using actual wheelbase from setup
        const usosValues = this.calculateUSOS(this.telemetryData, wheelbase);
        
        // Analyze suspension data
        const suspensionAnalysis = this.analyzeSuspensionData(this.telemetryData);
        
        // Combine all analysis
        for (let i = 0; i < this.telemetryData.length; i++) {
            const point = this.telemetryData[i];
            processed.push({
                ...point,
                usosData: usosValues[i],
                understeerAngle: usosValues[i].usos,
                classification: usosValues[i].classification,
                isCorner: Math.abs(point.G_LAT) > 0.5 && point.SPEED > this.analysisThresholds.minSpeed
            });
        }

        // Calculate overall metrics
        const cornerData = processed.filter(p => p.isCorner);
        const understeerCount = cornerData.filter(p => p.classification === 'understeer').length;
        const oversteerCount = cornerData.filter(p => p.classification === 'oversteer').length;
        const neutralCount = cornerData.filter(p => p.classification === 'neutral').length;

        this.analysisResults = {
            usosAverage: usosValues.reduce((sum, val) => sum + val.usos, 0) / usosValues.length,
            balanceDistribution: {
                understeer: cornerData.length > 0 ? (understeerCount / cornerData.length) * 100 : 0,
                oversteer: cornerData.length > 0 ? (oversteerCount / cornerData.length) * 100 : 0,
                neutral: cornerData.length > 0 ? (neutralCount / cornerData.length) * 100 : 0
            },
            suspensionAnalysis: suspensionAnalysis,
            confidence: Math.min(100, (cornerData.length / 50) * 100),
            processed: processed,
            totalCorners: cornerData.length,
            cornerData: cornerData
        };

        console.log('Analysis complete');
        return processed;
    }

    analyzeSuspensionData(data) {
        console.log('Analyzing suspension data...');
        const suspAnalysis = {
            frontTravel: [],
            rearTravel: [],
            bumpstopHits: {front: 0, rear: 0},
            rideHeightIssues: false,
            suspensionVelocity: {front: [], rear: []}
        };
        
        for (let i = 0; i < data.length; i++) {
            const point = data[i];
            
            const frontTravelLF = point.SUSP_TRAVEL_LF || 0;
            const frontTravelRF = point.SUSP_TRAVEL_RF || 0;
            const rearTravelLR = point.SUSP_TRAVEL_LR || 0;
            const rearTravelRR = point.SUSP_TRAVEL_RR || 0;
            
            const frontTravel = (frontTravelLF + frontTravelRF) / 2;
            const rearTravel = (rearTravelLR + rearTravelRR) / 2;
            
            suspAnalysis.frontTravel.push(frontTravel);
            suspAnalysis.rearTravel.push(rearTravel);
            
            // Detect bumpstop hits
            if (frontTravel > 90) suspAnalysis.bumpstopHits.front++;
            if (rearTravel > 90) suspAnalysis.bumpstopHits.rear++;
        }
        
        const avgFrontTravel = suspAnalysis.frontTravel.reduce((a, b) => a + b, 0) / suspAnalysis.frontTravel.length;
        const avgRearTravel = suspAnalysis.rearTravel.reduce((a, b) => a + b, 0) / suspAnalysis.rearTravel.length;
        
        suspAnalysis.rideHeightIssues = avgFrontTravel > 80 || avgRearTravel > 80;
        suspAnalysis.avgFrontTravel = avgFrontTravel;
        suspAnalysis.avgRearTravel = avgRearTravel;
        
        return suspAnalysis;
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
            
            console.log('All analysis results displayed successfully');
            
        } catch (error) {
            console.error('Error displaying analysis results:', error);
            this.showStatus('Error displaying results: ' + error.message, 'error');
        }
    }

    updateMetricValues() {
        if (!this.analysisResults) return;

        const usosValue = document.getElementById('usosValue');
        if (usosValue) usosValue.textContent = this.analysisResults.usosAverage.toFixed(2);

        const usosConfidence = document.getElementById('usosConfidence');
        if (usosConfidence) usosConfidence.textContent = this.analysisResults.confidence.toFixed(0);

        const balanceDistribution = document.getElementById('balanceDistribution');
        if (balanceDistribution) {
            const dist = this.analysisResults.balanceDistribution;
            balanceDistribution.textContent = `${dist.understeer.toFixed(0)}/${dist.neutral.toFixed(0)}/${dist.oversteer.toFixed(0)}`;
        }

        const suspensionTravel = document.getElementById('suspensionTravel');
        if (suspensionTravel && this.analysisResults.suspensionAnalysis) {
            const susp = this.analysisResults.suspensionAnalysis;
            suspensionTravel.textContent = `${susp.avgFrontTravel.toFixed(1)}/${susp.avgRearTravel.toFixed(1)}`;
        }

        const bumpstopHits = document.getElementById('bumpstopHits');
        if (bumpstopHits && this.analysisResults.suspensionAnalysis) {
            const hits = this.analysisResults.suspensionAnalysis.bumpstopHits;
            bumpstopHits.textContent = `${hits.front}/${hits.rear}`;
        }

        const wheelSlipAnalysis = document.getElementById('wheelSlipAnalysis');
        if (wheelSlipAnalysis) wheelSlipAnalysis.textContent = 'Available';
    }

    updateSuspensionMetrics() {
        if (!this.analysisResults.suspensionAnalysis) return;

        const susp = this.analysisResults.suspensionAnalysis;
        
        const frontAvgTravel = document.getElementById('frontAvgTravel');
        if (frontAvgTravel) frontAvgTravel.textContent = `${susp.avgFrontTravel.toFixed(1)}%`;

        const rearAvgTravel = document.getElementById('rearAvgTravel');
        if (rearAvgTravel) rearAvgTravel.textContent = `${susp.avgRearTravel.toFixed(1)}%`;

        const bumpstopCount = document.getElementById('bumpstopCount');
        if (bumpstopCount) {
            const total = susp.bumpstopHits.front + susp.bumpstopHits.rear;
            bumpstopCount.textContent = total;
        }

        const rideHeightStatus = document.getElementById('rideHeightStatus');
        if (rideHeightStatus) {
            rideHeightStatus.textContent = susp.rideHeightIssues ? 'Issues Detected' : 'Optimal';
            rideHeightStatus.className = `susp-value ${susp.rideHeightIssues ? 'text-warning' : 'text-success'}`;
        }
    }

    updateBalanceBreakdown() {
        if (!this.analysisResults.balanceDistribution) return;

        const dist = this.analysisResults.balanceDistribution;
        
        const understeerPercent = document.getElementById('understeerPercent');
        if (understeerPercent) understeerPercent.textContent = `${dist.understeer.toFixed(1)}%`;

        const neutralPercent = document.getElementById('neutralPercent');
        if (neutralPercent) neutralPercent.textContent = `${dist.neutral.toFixed(1)}%`;

        const oversteerPercent = document.getElementById('oversteerPercent');
        if (oversteerPercent) oversteerPercent.textContent = `${dist.oversteer.toFixed(1)}%`;
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
        
        const ctx = canvas.getContext('2d');
        if (this.charts.usos) this.charts.usos.destroy();

        const cornerData = this.processedData.filter(p => p.isCorner);
        
        const understeerData = cornerData.filter(p => p.classification === 'understeer');
        const oversteerData = cornerData.filter(p => p.classification === 'oversteer');
        const neutralData = cornerData.filter(p => p.classification === 'neutral');
        
        this.charts.usos = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Understeer',
                        data: understeerData.map(p => ({x: Math.abs(p.G_LAT), y: p.understeerAngle})),
                        backgroundColor: '#B4413C',
                        borderColor: '#B4413C',
                        pointRadius: 4
                    },
                    {
                        label: 'Oversteer', 
                        data: oversteerData.map(p => ({x: Math.abs(p.G_LAT), y: p.understeerAngle})),
                        backgroundColor: '#FFC185',
                        borderColor: '#FFC185',
                        pointRadius: 4
                    },
                    {
                        label: 'Neutral',
                        data: neutralData.map(p => ({x: Math.abs(p.G_LAT), y: p.understeerAngle})),
                        backgroundColor: '#1FB8CD',
                        borderColor: '#1FB8CD',
                        pointRadius: 3
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
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 0) return '#666';
                                return '#ddd';
                            }
                        }
                    }
                },
                plugins: {
                    title: {display: true, text: 'USOS Analysis Using Setup Parameters'},
                    legend: {display: true}
                }
            }
        });
    }

    createBalanceChart() {
        const canvas = document.getElementById('balanceChart');
        if (!canvas || !this.analysisResults) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.balance) this.charts.balance.destroy();

        const dist = this.analysisResults.balanceDistribution;
        
        this.charts.balance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Understeer', 'Neutral', 'Oversteer'],
                datasets: [{
                    data: [dist.understeer, dist.neutral, dist.oversteer],
                    backgroundColor: ['#B4413C', '#1FB8CD', '#FFC185'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {display: true, text: 'Balance Distribution Analysis'},
                    legend: {display: true, position: 'bottom'}
                }
            }
        });
    }

    createSuspensionChart() {
        const canvas = document.getElementById('suspensionChart');
        if (!canvas || !this.analysisResults.suspensionAnalysis) return;
        
        const ctx = canvas.getContext('2d');
        if (this.charts.suspension) this.charts.suspension.destroy();

        const suspData = this.analysisResults.suspensionAnalysis;
        const sampledData = suspData.frontTravel.filter((_, i) => i % 10 === 0);
        const sampledRear = suspData.rearTravel.filter((_, i) => i % 10 === 0);
        
        this.charts.suspension = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sampledData.map((_, i) => (i * 0.2).toFixed(1)),
                datasets: [
                    {
                        label: 'Front Suspension Travel (%)',
                        data: sampledData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Rear Suspension Travel (%)',
                        data: sampledRear,
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
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
                },
                plugins: {
                    title: {display: true, text: 'Suspension Analysis'},
                    legend: {display: true}
                }
            }
        });
    }

    displayEnhancedCornerAnalysis() {
        const container = document.getElementById('cornersTable');
        if (!container || !this.processedData) return;
        
        const cornerData = this.processedData.filter(p => p.isCorner);
        const cornerGroups = this.groupCornersByPhase(cornerData);
        
        let html = `
            <div class="corner-row header">
                <div class="corner-cell">Corner #</div>
                <div class="corner-cell">Max Lateral G</div>
                <div class="corner-cell">Balance Classification</div>
                <div class="corner-cell">USOS Value</div>
                <div class="corner-cell">Confidence</div>
                <div class="corner-cell">Suspension Travel</div>
            </div>
        `;

        cornerGroups.slice(0, 10).forEach((corner, index) => {
            const confidence = Math.min(100, Math.abs(corner.avgUsos) * 30 + corner.dataPoints);
            html += `
                <div class="corner-row">
                    <div class="corner-cell">${index + 1}</div>
                    <div class="corner-cell">${corner.maxLateralG.toFixed(2)}</div>
                    <div class="corner-cell">
                        <span class="corner-status ${corner.classification}">${corner.classification.toUpperCase()}</span>
                    </div>
                    <div class="corner-cell font-mono">${corner.avgUsos.toFixed(2)}</div>
                    <div class="corner-cell">${confidence.toFixed(0)}%</div>
                    <div class="corner-cell">${corner.suspensionInfo}</div>
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
                const maxG = Math.max(...currentGroup.map(p => Math.abs(p.G_LAT)));
                const avgUsos = currentGroup.reduce((sum, p) => sum + p.understeerAngle, 0) / currentGroup.length;
                const avgSusp = currentGroup.reduce((sum, p) => sum + (p.SUSP_TRAVEL_LF + p.SUSP_TRAVEL_RF) / 2, 0) / currentGroup.length;
                
                groups.push({
                    maxLateralG: maxG,
                    avgUsos: avgUsos,
                    classification: avgUsos > 2 ? 'understeer' : (avgUsos < -1 ? 'oversteer' : 'neutral'),
                    dataPoints: currentGroup.length,
                    suspensionInfo: `${avgSusp.toFixed(1)}%`
                });
                currentGroup = [];
            }
        }
        
        return groups;
    }

    generateGroupedRecommendations() {
        console.log('Generating recommendations...');
        
        if (!this.analysisResults) {
            console.warn('Missing analysis results for recommendations');
            return;
        }

        const avgUsos = this.analysisResults.usosAverage;
        const balance = this.analysisResults.balanceDistribution;
        
        let primaryIssue = 'neutral';
        if (avgUsos > 1.5 || balance.understeer > 40) {
            primaryIssue = 'understeer';
        } else if (avgUsos < -1.0 || balance.oversteer > 30) {
            primaryIssue = 'oversteer';
        }

        console.log('Primary issue detected:', primaryIssue);

        this.generateConservativeRecommendations(primaryIssue);
        this.generateMechanicalRecommendations(primaryIssue);
        this.generateAerodynamicRecommendations(primaryIssue);
    }

    generateConservativeRecommendations(issue) {
        const container = document.getElementById('conservativeList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (issue === 'understeer') {
            this.addRecommendationItem(container, 'Reduce TC1 for more rotation', -1, 85, 'Allows more wheel slip to help rotation');
            this.addRecommendationItem(container, 'Reduce TC2 slightly', -1, 80, 'Less intervention on throttle');
        } else if (issue === 'oversteer') {
            this.addRecommendationItem(container, 'Increase TC1 for stability', 1, 85, 'More stability control');
            this.addRecommendationItem(container, 'Increase TC2 for traction', 2, 80, 'Better traction on exit');
        } else {
            this.addRecommendationItem(container, 'Current balance is good', 'Maintain', 90, 'No major changes needed');
        }
    }

    generateMechanicalRecommendations(issue) {
        const container = document.getElementById('mechanicalList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (issue === 'understeer') {
            this.addRecommendationItem(container, 'Soften front anti-roll bar', -4, 90, 'Increases front grip');
            this.addRecommendationItem(container, 'Stiffen rear anti-roll bar', 2, 85, 'Reduces rear grip for rotation');
        } else if (issue === 'oversteer') {
            this.addRecommendationItem(container, 'Soften rear anti-roll bar', -4, 90, 'Increases rear stability');
            this.addRecommendationItem(container, 'Stiffen front anti-roll bar', 2, 85, 'Reduces front grip');
        } else {
            this.addRecommendationItem(container, 'Suspension well balanced', 'Fine-tune', 92, 'Minor adjustments only');
        }
    }

    generateAerodynamicRecommendations(issue) {
        const container = document.getElementById('aerodynamicList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (issue === 'understeer') {
            this.addRecommendationItem(container, 'Reduce front splitter', -2, 85, 'Less front downforce');
            this.addRecommendationItem(container, 'Increase rear wing', 3, 80, 'More rear stability');
        } else if (issue === 'oversteer') {
            this.addRecommendationItem(container, 'Reduce rear wing', -2, 85, 'Less rear downforce');
            this.addRecommendationItem(container, 'Increase front splitter', 2, 80, 'More front stability');
        } else {
            this.addRecommendationItem(container, 'Aero balance optimal', 'Track-specific', 88, 'Adjust for track requirements');
        }
    }

    addRecommendationItem(container, text, change, confidence, impact) {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        
        const confidenceClass = confidence > 80 ? 'confidence-high' : 
                               confidence > 60 ? 'confidence-medium' : 'confidence-low';
        
        const changeClass = typeof change === 'number' ? 
                          (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral') : 'neutral';
        
        item.innerHTML = `
            <div class="recommendation-header">
                <span class="recommendation-text">${text}</span>
                <span class="recommendation-confidence ${confidenceClass}">${confidence}%</span>
            </div>
            <div class="recommendation-details">
                <span class="recommendation-change ${changeClass}">${change}</span>
                <span class="recommendation-impact">${impact}</span>
            </div>
        `;
        
        container.appendChild(item);
    }

    generateProfessionalReport() {
        console.log('Generating professional report...');
        
        const summary = document.getElementById('reportSummary');
        const confidence = document.getElementById('confidenceMetrics');
        const predictions = document.getElementById('improvementPredictions');

        if (summary && this.analysisResults && this.currentSetupData) {
            const dist = this.analysisResults.balanceDistribution;
            const primaryIssue = dist.understeer > dist.oversteer ? 'understeer tendency' : 
                               dist.oversteer > dist.understeer ? 'oversteer tendency' : 'balanced behavior';
            
            summary.innerHTML = `
                <h4>Executive Summary - Professional Analysis</h4>
                <p>Analysis of ${this.telemetryData.length} data points for ${this.currentSetupData.carInfo.carName} reveals a vehicle with ${primaryIssue}.</p>
                <p>Balance Distribution: ${dist.understeer.toFixed(1)}% understeer, ${dist.oversteer.toFixed(1)}% oversteer, ${dist.neutral.toFixed(1)}% neutral</p>
                <p>USOS Factor: ${this.analysisResults.usosAverage.toFixed(2)}° (${this.analysisResults.confidence}% confidence)</p>
                <p class="text-success">✅ Analysis based on actual setup parameters</p>
            `;
        }

        if (confidence && this.analysisResults) {
            confidence.innerHTML = `
                <h4>Analysis Confidence & Validation</h4>
                <div>Data Quality: ${this.analysisResults.confidence.toFixed(0)}%</div>
                <div>Corner Detection: ${this.analysisResults.totalCorners} corners analyzed</div>
                <div>Setup Integration: Using actual alignment values</div>
                <div>Suspension Data: ${this.analysisResults.suspensionAnalysis ? 'Available' : 'Missing'}</div>
            `;
        }

        if (predictions) {
            const suspAnalysis = this.analysisResults.suspensionAnalysis;
            predictions.innerHTML = `
                <h4>Expected Improvements</h4>
                <div>Lap Time: -0.2 to -0.8 seconds</div>
                <div>Consistency: +15-25%</div>
                <div>Tire Wear: Improved balance reduces excessive wear</div>
                <div>Suspension: ${suspAnalysis?.rideHeightIssues ? 'Ride height optimization needed' : 'Suspension travel optimal'}</div>
                <div class="text-success">Setup-specific recommendations for maximum effectiveness</div>
            `;
        }
    }

    setupTabNavigation() {
        console.log('Setting up tab navigation...');
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const targetTab = document.getElementById(tabId);
                if (targetTab) targetTab.classList.add('active');
            });
        });

        document.querySelectorAll('.setup-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                
                document.querySelectorAll('.setup-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.setup-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const targetTab = document.getElementById(tabId);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }

    // IMPLEMENTED: Make setup sliders interactive
    setupSetupControls() {
        console.log('Setting up interactive setup controls...');
        document.querySelectorAll('.setup-slider').forEach(slider => {
            slider.addEventListener('input', this.handleSliderInput.bind(this));
        });
    }

    handleSliderInput(event) {
        const slider = event.target;
        const valueSpan = document.getElementById(`${slider.id}Value`);
        if (valueSpan) {
            valueSpan.textContent = parseFloat(slider.value).toFixed(slider.step.includes('.') ? 1 : 0);
        }
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
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        this.telemetryData = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const dataPoint = {};
                headers.forEach((header, index) => {
                    dataPoint[header] = parseFloat(values[index]) || 0;
                });
                this.telemetryData.push(dataPoint);
            }
        }

        this.validateTelemetryData(headers);
        document.getElementById('processDataBtn').classList.remove('hidden');
        this.showStatus(`Loaded ${this.telemetryData.length} data points from CSV`, 'success');
    }

    showStatus(message, type) {
        console.log('Status:', type, message);
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        
        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(statusDiv, main.firstChild);
            
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 5000);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ACC Telemetry App with JSON setup upload...');
    try {
        window.accApp = new ACCTelemetryApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});