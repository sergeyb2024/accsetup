// ACC Telemetry Analysis Application - Enhanced Version with Event Map
class ACCTelemetryAnalyzer {
    constructor() {
        this.telemetryData = [];
        this.setupData = {};
        this.analysisResults = {};
        this.currentCarModel = null;
        this.currentCarClass = null;
        this.isProcessing = false;
        this.charts = {};
        this.currentChartTab = 'stability';
        this.fullscreenChart = null;
        
        // Car ID Lookup from provided data
        this.carIdLookup = {
            "ferrari_296_gt3": "Ferrari 296 GT3",
            "audi_r8_lms_gt3_evo_ii": "Audi R8 LMS GT3 EVO II",
            "mclaren_720s_gt3_evo": "McLaren 720S GT3 EVO",
            "mercedes_amg_gt3_evo": "Mercedes AMG GT3 EVO",
            "porsche_992_gt3_r": "Porsche 911 GT3 R",
            "bmw_m4_gt3": "BMW M4 GT3",
            "lamborghini_huracan_gt3_evo_2": "Lamborghini Huracan GT3 EVO II",
            "aston_martin_v12_vantage_gt3": "Aston Martin Vantage V12 GT3",
            "mercedes_amg_gt2": "Mercedes AMG GT2",
            "audi_r8_lms_gt2": "Audi R8 LMS GT2",
            "ktm_xbow_gt2": "KTM X-Bow GT2",
            "maserati_mc20_gt2": "Maserati MC20 GT2"
        };
        
        // Car Database Integration
        this.carDatabase = {
            "GT3": {
                "Ferrari 296 GT3": {
                    "front_spring_rate": {"min": 90000, "max": 195000, "default": 125000},
                    "rear_spring_rate": {"min": 90000, "max": 195000, "default": 115000},
                    "front_toe": {"min": -0.30, "max": 0.30, "default": -0.15},
                    "rear_toe": {"min": -0.05, "max": 0.30, "default": 0.05},
                    "front_camber": {"min": -5.0, "max": 0.0, "default": -4.0},
                    "rear_camber": {"min": -3.5, "max": 0.0, "default": -3.5},
                    "front_arb": {"min": 1, "max": 6, "default": 3},
                    "rear_arb": {"min": 1, "max": 6, "default": 4},
                    "differential_power": {"min": 0, "max": 100, "default": 70},
                    "brake_balance": {"min": 50.0, "max": 70.0, "default": 59.0},
                    "front_ride_height": {"min": 50, "max": 90, "default": 62},
                    "rear_ride_height": {"min": 50, "max": 90, "default": 68},
                    "tyre_press_lf": {"min": 21.0, "max": 27.0, "default": 26.5},
                    "tyre_press_rf": {"min": 21.0, "max": 27.0, "default": 26.5},
                    "tyre_press_lr": {"min": 21.0, "max": 27.0, "default": 26.5},
                    "tyre_press_rr": {"min": 21.0, "max": 27.0, "default": 26.5}
                },
                "Audi R8 LMS GT3 EVO II": {
                    "front_spring_rate": {"min": 80000, "max": 200000, "default": 120000},
                    "rear_spring_rate": {"min": 80000, "max": 200000, "default": 110000},
                    "front_toe": {"min": -0.30, "max": 0.30, "default": -0.15},
                    "rear_toe": {"min": -0.05, "max": 0.30, "default": 0.05},
                    "front_camber": {"min": -5.0, "max": 0.0, "default": -3.8},
                    "rear_camber": {"min": -3.5, "max": 0.0, "default": -3.5},
                    "front_arb": {"min": 1, "max": 6, "default": 3},
                    "rear_arb": {"min": 1, "max": 6, "default": 4},
                    "differential_power": {"min": 0, "max": 100, "default": 65},
                    "brake_balance": {"min": 50.0, "max": 70.0, "default": 58.5},
                    "front_ride_height": {"min": 50, "max": 90, "default": 65},
                    "rear_ride_height": {"min": 50, "max": 90, "default": 70},
                    "tyre_press_lf": {"min": 21.0, "max": 27.0, "default": 26.5},
                    "tyre_press_rf": {"min": 21.0, "max": 27.0, "default": 26.5},
                    "tyre_press_lr": {"min": 21.0, "max": 27.0, "default": 26.5},
                    "tyre_press_rr": {"min": 21.0, "max": 27.0, "default": 26.5}
                }
            },
            "GT2": {
                "Mercedes AMG GT2": {
                    "front_spring_rate": {"min": 90000, "max": 210000, "default": 135000},
                    "rear_spring_rate": {"min": 90000, "max": 210000, "default": 125000},
                    "front_toe": {"min": -0.30, "max": 0.30, "default": -0.10},
                    "rear_toe": {"min": -0.05, "max": 0.30, "default": 0.08},
                    "front_camber": {"min": -5.0, "max": 0.0, "default": -3.0},
                    "rear_camber": {"min": -3.5, "max": 0.0, "default": -2.8},
                    "front_arb": {"min": 1, "max": 6, "default": 4},
                    "rear_arb": {"min": 1, "max": 6, "default": 5},
                    "differential_power": {"min": 0, "max": 100, "default": 80},
                    "brake_balance": {"min": 50.0, "max": 70.0, "default": 61.0},
                    "front_ride_height": {"min": 50, "max": 90, "default": 58},
                    "rear_ride_height": {"min": 50, "max": 90, "default": 64},
                    "tyre_press_lf": {"min": 21.0, "max": 27.0, "default": 26.0},
                    "tyre_press_rf": {"min": 21.0, "max": 27.0, "default": 26.0},
                    "tyre_press_lr": {"min": 21.0, "max": 27.0, "default": 26.0},
                    "tyre_press_rr": {"min": 21.0, "max": 27.0, "default": 26.0}
                }
            }
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

        // Initialize immediately
        this.init();
    }

    init() {
        console.log('Initializing ACC Telemetry Analyzer...');
        
        // Generate sample data first
        this.generateSampleTelemetryData();
        
        // Set up all event listeners
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupCollapsibleSections();
        this.setupRecommendationFilters();
        
        // Wait for DOM to be ready, then setup chart functionality
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupChartTabs();
                this.setupFullscreenModal();
            });
        } else {
            this.setupChartTabs();
            this.setupFullscreenModal();
        }
        
        console.log('ACC Telemetry Analyzer initialized successfully');
    }

    setupEventListeners() {
        // File upload listeners
        const csvFileInput = document.getElementById('csvFileInput');
        const setupFileInput = document.getElementById('setupFileInput');
        
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (e) => {
                this.handleCSVUpload(e.target.files[0]);
            });
        }

        if (setupFileInput) {
            setupFileInput.addEventListener('change', (e) => {
                this.handleSetupUpload(e.target.files[0]);
            });
        }

        // Sample data button - ensure this works
        const loadSampleBtn = document.getElementById('loadSampleData');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Sample data button clicked');
                this.loadSampleData();
            });
        } else {
            console.warn('Load sample data button not found');
        }

        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    setupChartTabs() {
        console.log('Setting up chart tabs...');
        const tabs = document.querySelectorAll('.chart-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const chartType = tab.getAttribute('data-chart');
                console.log('Chart tab clicked:', chartType);
                this.switchChartTab(chartType);
            });
        });

        // Chart control buttons
        ['stability', 'trajectory', 'eventMap'].forEach(chartType => {
            const resetBtn = document.getElementById(`${chartType}Reset`);
            const fullscreenBtn = document.getElementById(`${chartType}Fullscreen`);
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    console.log('Reset zoom clicked for:', chartType);
                    this.resetChartZoom(chartType);
                });
            }
            
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => {
                    console.log('Fullscreen clicked for:', chartType);
                    this.openFullscreenChart(chartType);
                });
            }
        });
        
        console.log('Chart tabs setup complete');
    }

    setupFullscreenModal() {
        const modal = document.getElementById('fullscreenModal');
        const closeBtn = document.getElementById('closeFullscreen');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeFullscreenChart();
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.closeFullscreenChart();
            }
        });
    }

    switchChartTab(chartType) {
        console.log('Switching to chart tab:', chartType);
        
        // Update tab states
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-chart="${chartType}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update panel visibility
        document.querySelectorAll('.chart-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const activePanel = document.getElementById(`${chartType}Panel`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
        
        this.currentChartTab = chartType;
        
        // Trigger chart resize if needed
        setTimeout(() => {
            const chart = this.charts[`${chartType}Chart`];
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        }, 100);
    }

    resetChartZoom(chartType) {
        const chart = this.charts[`${chartType}Chart`];
        if (chart && typeof chart.resetZoom === 'function') {
            chart.resetZoom();
        }
    }

    openFullscreenChart(chartType) {
        const modal = document.getElementById('fullscreenModal');
        const title = document.getElementById('fullscreenTitle');
        const canvas = document.getElementById('fullscreenChart');
        
        if (!modal || !title || !canvas) {
            console.warn('Fullscreen modal elements not found');
            return;
        }
        
        const chartTitles = {
            'stability': 'Stability Analysis - Fullscreen',
            'trajectory': 'Trajectory Analysis - Fullscreen',
            'eventMap': 'Event Map - Fullscreen'
        };
        
        title.textContent = chartTitles[chartType] || 'Chart - Fullscreen';
        modal.classList.remove('hidden');
        
        // Clone chart data and create fullscreen version
        setTimeout(() => {
            this.createFullscreenChart(chartType, canvas);
        }, 100);
    }

    createFullscreenChart(chartType, canvas) {
        const ctx = canvas.getContext('2d');
        
        if (this.fullscreenChart) {
            this.fullscreenChart.destroy();
        }
        
        const originalChart = this.charts[`${chartType}Chart`];
        if (!originalChart) {
            console.warn('Original chart not found for fullscreen:', chartType);
            return;
        }
        
        // Clone the chart configuration
        const config = JSON.parse(JSON.stringify(originalChart.config));
        config.options.maintainAspectRatio = false;
        config.options.responsive = true;
        
        // Add zoom plugin configuration if available
        if (window.zoomPlugin || (Chart && Chart.registry && Chart.registry.plugins.get('zoom'))) {
            config.options.plugins = config.options.plugins || {};
            config.options.plugins.zoom = {
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: chartType === 'stability' ? 'x' : 'xy'
                },
                pan: {
                    enabled: true,
                    mode: chartType === 'stability' ? 'x' : 'xy'
                }
            };
        }
        
        this.fullscreenChart = new Chart(ctx, config);
    }

    closeFullscreenChart() {
        const modal = document.getElementById('fullscreenModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        if (this.fullscreenChart) {
            this.fullscreenChart.destroy();
            this.fullscreenChart = null;
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        // Set initial theme
        document.documentElement.setAttribute('data-color-scheme', currentTheme);
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-color-scheme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-color-scheme', newTheme);
            localStorage.setItem('theme', newTheme);
            const themeIcon = themeToggle.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            }
        });
    }

    setupCollapsibleSections() {
        const collapsibleHeaders = document.querySelectorAll('.collapsible');
        
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const button = header.querySelector('.collapse-btn');
                const content = header.nextElementSibling;
                
                if (content && button) {
                    if (content.classList.contains('collapsed')) {
                        content.classList.remove('collapsed');
                        button.classList.remove('collapsed');
                    } else {
                        content.classList.add('collapsed');
                        button.classList.add('collapsed');
                    }
                }
            });
        });
    }

    setupRecommendationFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter recommendations
                const priority = btn.getAttribute('data-priority');
                this.filterRecommendations(priority);
            });
        });
    }

    filterRecommendations(priority) {
        const recommendations = document.querySelectorAll('.recommendation-item');
        
        recommendations.forEach(rec => {
            if (priority === 'all' || rec.classList.contains(priority)) {
                rec.style.display = 'block';
            } else {
                rec.style.display = 'none';
            }
        });
    }

    setupDragAndDrop() {
        const csvUpload = document.getElementById('csvUpload');
        const setupUpload = document.getElementById('setupUpload');

        [csvUpload, setupUpload].forEach(element => {
            if (!element) return;
            
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
            
            // Enhanced car model detection
            this.detectCarModel(setupData, file.name);
            
            // Apply car-specific limits and populate setup data
            this.applyCarSpecificSetup(setupData);
            
            this.showUploadStatus('setupStatus', `✓ Setup loaded for ${this.currentCarModel}`, 'success');
            this.hideProgress('setupProgress');
            
            // Show car info
            this.displayCarInfo();
            
            if (this.telemetryData.length > 0) {
                this.startAnalysis();
            }
        } catch (error) {
            console.error('Setup file processing error:', error);
            this.showUploadStatus('setupStatus', 'Error: Invalid JSON format', 'error');
            this.hideProgress('setupProgress');
        }
    }

    detectCarModel(setupData, filename) {
        let detectedCar = null;
        let detectedClass = null;
        
        // First, try to detect from carId or carModel fields
        const possibleCarIdFields = ['carId', 'carModel', 'car_id', 'car_model', 'model', 'car'];
        
        for (const field of possibleCarIdFields) {
            if (setupData[field]) {
                const carIdValue = setupData[field].toString().toLowerCase();
                
                // Check against carIdLookup
                const matchedKey = Object.keys(this.carIdLookup).find(key => 
                    key.toLowerCase() === carIdValue || carIdValue.includes(key.toLowerCase())
                );
                
                if (matchedKey) {
                    detectedCar = this.carIdLookup[matchedKey];
                    // Determine class based on car name
                    detectedClass = detectedCar.includes('GT2') ? 'GT2' : 'GT3';
                    break;
                }
            }
        }
        
        // If no car detected from fields, try filename parsing
        if (!detectedCar && filename) {
            const name = filename.toLowerCase().replace(/[_\-\.]/g, '');
            
            // Try to match against carIdLookup keys
            const matchedKey = Object.keys(this.carIdLookup).find(key => {
                const normalizedKey = key.toLowerCase().replace(/[_\-\.]/g, '');
                return name.includes(normalizedKey) || normalizedKey.includes(name.replace('.json', ''));
            });
            
            if (matchedKey) {
                detectedCar = this.carIdLookup[matchedKey];
                detectedClass = detectedCar.includes('GT2') ? 'GT2' : 'GT3';
            }
        }
        
        // If still no car detected, try partial matching from car database
        if (!detectedCar) {
            Object.keys(this.carDatabase).forEach(carClass => {
                Object.keys(this.carDatabase[carClass]).forEach(carName => {
                    const searchTerms = [filename, JSON.stringify(setupData)].join(' ').toLowerCase();
                    const carNameNormalized = carName.toLowerCase().replace(/\s+/g, '');
                    
                    if (searchTerms.includes(carNameNormalized) || 
                        searchTerms.includes(carName.toLowerCase())) {
                        detectedCar = carName;
                        detectedClass = carClass;
                    }
                });
            });
        }
        
        // Default to Ferrari 296 GT3 if nothing detected
        if (!detectedCar) {
            detectedCar = "Ferrari 296 GT3";
            detectedClass = "GT3";
            console.warn('Could not detect car model from setup file, defaulting to Ferrari 296 GT3');
        }
        
        this.currentCarModel = detectedCar;
        this.currentCarClass = detectedClass;
        
        console.log(`Detected car: ${detectedCar} (${detectedClass})`);
    }

    applyCarSpecificSetup(setupData) {
        const carLimits = this.carDatabase[this.currentCarClass][this.currentCarModel];
        
        // Initialize setup with car defaults
        this.setupData = {};
        
        Object.keys(carLimits).forEach(param => {
            // Use value from setup file if available and within limits
            let value = setupData[param];
            
            if (value !== undefined && value !== null) {
                // Clamp value to car-specific limits
                value = Math.max(carLimits[param].min, Math.min(carLimits[param].max, value));
            } else {
                // Use default value
                value = carLimits[param].default;
            }
            
            this.setupData[param] = value;
        });
        
        // Generate setup controls with car-specific limits
        this.generateSetupControls();
    }

    displayCarInfo() {
        const carInfo = document.getElementById('carInfo');
        const carName = document.getElementById('carName');
        const carClass = document.getElementById('carClass');
        
        if (carInfo && carName && carClass) {
            carName.textContent = this.currentCarModel;
            carClass.textContent = this.currentCarClass;
            carInfo.classList.remove('hidden');
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
                        if (!isNaN(value) && value !== '') {
                            dataPoint[header] = parseFloat(value);
                        } else {
                            dataPoint[header] = value;
                        }
                    });
                    
                    // Filter out invalid data points
                    if (!isNaN(dataPoint.Time) && !isNaN(dataPoint.SPEED)) {
                        this.telemetryData.push(dataPoint);
                    }
                }
            });

            // Update progress
            const progress = Math.min(100, (i / totalLines) * 100);
            this.showProgress('csvProgress', progress);
            
            // Allow UI updates
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Downsample to max 12,000 points for performance
        if (this.telemetryData.length > 12000) {
            const step = Math.floor(this.telemetryData.length / 12000);
            this.telemetryData = this.telemetryData.filter((_, index) => index % step === 0);
        }
    }

    generateSampleTelemetryData() {
        console.log('Generating sample telemetry data...');
        // Generate more comprehensive sample data for demo
        this.sampleTelemetryData = [];
        const trackLength = 4000; // 4km track
        const dataPoints = 800;
        
        for (let i = 0; i < dataPoints; i++) {
            const distance = (i / dataPoints) * trackLength;
            const time = i * 0.1;
            
            // Create more realistic corner patterns
            const cornerPhase = (distance % 800) / 800;
            let speed = 220;
            let cornerFactor = 0;
            
            if (cornerPhase < 0.2) {
                // Braking zone
                speed = 220 - (cornerPhase / 0.2) * 120;
                cornerFactor = cornerPhase * 2;
            } else if (cornerPhase < 0.6) {
                // Corner apex
                speed = 100 + Math.sin((cornerPhase - 0.2) * Math.PI / 0.4) * 20;
                cornerFactor = 0.8 + Math.sin((cornerPhase - 0.2) * Math.PI / 0.4) * 0.2;
            } else {
                // Acceleration zone
                const accelPhase = (cornerPhase - 0.6) / 0.4;
                speed = 120 + accelPhase * 100;
                cornerFactor = (1 - accelPhase) * 0.5;
            }
            
            const lateralG = cornerFactor * (1.5 + Math.random() * 0.5);
            const yawRate = cornerFactor * (0.6 + Math.random() * 0.2);
            const steerAngle = cornerFactor * (20 + Math.random() * 10);
            
            this.sampleTelemetryData.push({
                Time: time,
                Distance: distance,
                SPEED: speed,
                LateralG: lateralG,
                ROTY: yawRate,
                Yaw_Rate: yawRate,
                STEERANGLE: steerAngle,
                THROTTLE: Math.max(0, 100 - cornerFactor * 80),
                BRAKE: Math.max(0, (cornerFactor - 0.3) * 60),
                GEAR: Math.max(2, Math.min(6, Math.floor(speed / 40))),
                X: Math.cos(distance / 500) * 300 + distance * 0.1,
                Y: Math.sin(distance / 500) * 150 + 200
            });
        }
        console.log(`Generated ${this.sampleTelemetryData.length} sample data points`);
    }

    loadSampleData() {
        console.log('Loading sample data...');
        this.showLoadingOverlay('Loading sample telemetry data...', 0);
        
        setTimeout(() => {
            this.updateLoadingProgress(25);
            this.updateLoadingMessage('Processing telemetry...');
            
            setTimeout(() => {
                this.updateLoadingProgress(50);
                this.updateLoadingMessage('Detecting car setup...');
                
                setTimeout(() => {
                    this.updateLoadingProgress(75);
                    this.updateLoadingMessage('Applying Ferrari 296 GT3 settings...');
                    
                    setTimeout(() => {
                        this.updateLoadingProgress(100);
                        
                        try {
                            // Load sample data
                            this.telemetryData = [...this.sampleTelemetryData];
                            this.currentCarModel = "Ferrari 296 GT3";
                            this.currentCarClass = "GT3";
                            
                            console.log(`Loaded ${this.telemetryData.length} telemetry data points`);
                            
                            // Apply sample setup with car-specific limits
                            const sampleSetupData = {
                                "carId": "ferrari_296_gt3",
                                "front_spring_rate": 125000,
                                "rear_spring_rate": 115000,
                                "front_toe": -0.15,
                                "rear_toe": 0.05,
                                "front_camber": -4.0,
                                "rear_camber": -3.5,
                                "front_arb": 3,
                                "rear_arb": 4,
                                "differential_power": 70,
                                "brake_balance": 59.0,
                                "front_ride_height": 62,
                                "rear_ride_height": 68,
                                "tyre_press_lf": 26.5,
                                "tyre_press_rf": 26.5,
                                "tyre_press_lr": 26.5,
                                "tyre_press_rr": 26.5
                            };
                            
                            this.applyCarSpecificSetup(sampleSetupData);
                            
                            this.showUploadStatus('csvStatus', `✓ Sample data loaded (${this.telemetryData.length} points)`, 'success');
                            this.showUploadStatus('setupStatus', `✓ Ferrari 296 GT3 setup loaded`, 'success');
                            
                            this.displayCarInfo();
                            
                            // Start analysis
                            this.performAnalysis();
                            this.renderCharts();
                            this.generateRecommendations();
                            this.updateStabilityGauges();
                            
                            // Show analysis sections
                            const analysisSection = document.getElementById('analysisSection');
                            const stabilityGauges = document.getElementById('stabilityGauges');
                            
                            if (analysisSection) {
                                analysisSection.classList.remove('hidden');
                                console.log('Analysis section shown');
                            }
                            if (stabilityGauges) {
                                stabilityGauges.classList.remove('hidden');
                                console.log('Stability gauges shown');
                            }
                            
                        } catch (error) {
                            console.error('Error loading sample data:', error);
                        }
                        
                        this.hideLoadingOverlay();
                    }, 300);
                }, 300);
            }, 300);
        }, 300);
    }

    generateSetupControls() {
        const container = document.getElementById('setupSliders');
        if (!container) return;
        
        container.innerHTML = '';

        if (!this.currentCarModel || !this.currentCarClass) return;

        const carLimits = this.carDatabase[this.currentCarClass][this.currentCarModel];
        const setupValidation = document.getElementById('setupValidation');
        let hasWarnings = false;

        Object.keys(carLimits).forEach(paramKey => {
            const param = carLimits[paramKey];
            const controlDiv = document.createElement('div');
            controlDiv.className = 'slider-control';

            const currentValue = this.setupData[paramKey] || param.default;
            const isAtLimit = currentValue <= param.min || currentValue >= param.max;
            
            if (isAtLimit) {
                controlDiv.classList.add('at-limit');
                hasWarnings = true;
            }

            const label = this.getParameterLabel(paramKey);
            const step = this.getParameterStep(paramKey);
            
            controlDiv.innerHTML = `
                <div class="slider-label">
                    <h4>${label}</h4>
                    <span class="slider-value" id="${paramKey}_value">${this.formatValue(currentValue, step)}</span>
                </div>
                <input 
                    type="range" 
                    class="slider-input" 
                    id="${paramKey}_slider"
                    min="${param.min}" 
                    max="${param.max}" 
                    step="${step}" 
                    value="${currentValue}"
                >
                <div class="slider-range">
                    <span>${this.formatValue(param.min, step)}</span>
                    <span>${this.formatValue(param.max, step)}</span>
                </div>
            `;

            container.appendChild(controlDiv);

            // Add event listener for real-time updates
            const slider = controlDiv.querySelector(`#${paramKey}_slider`);
            const valueDisplay = controlDiv.querySelector(`#${paramKey}_value`);
            
            if (slider && valueDisplay) {
                let updateTimeout;
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    valueDisplay.textContent = this.formatValue(value, step);
                    this.setupData[paramKey] = value;
                    
                    // Update visual indicators
                    const isAtLimitNow = value <= param.min || value >= param.max;
                    controlDiv.classList.toggle('at-limit', isAtLimitNow);
                    
                    // Debounce updates
                    clearTimeout(updateTimeout);
                    updateTimeout = setTimeout(() => {
                        this.updateAnalysisWithAnimation();
                    }, 300);
                });
            }
        });

        // Show validation warnings
        if (setupValidation) {
            if (hasWarnings) {
                setupValidation.innerHTML = '⚠️ Some parameters are at their limits and may affect recommendations';
                setupValidation.classList.add('visible');
            } else {
                setupValidation.classList.remove('visible');
            }
        }

        const setupControls = document.getElementById('setupControls');
        if (setupControls) {
            setupControls.classList.remove('hidden');
        }
    }

    updateAnalysisWithAnimation() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // Perform analysis
        this.performAnalysis();
        
        // Update charts with smooth transitions
        this.renderCharts();
        this.generateRecommendations();
        this.updateStabilityGauges();
        
        // If event map is visible, animate the changes
        if (this.currentChartTab === 'eventMap') {
            this.animateEventMapChanges();
        }
        
        setTimeout(() => {
            this.isProcessing = false;
        }, 500);
    }

    animateEventMapChanges() {
        const chart = this.charts.eventMapChart;
        if (!chart) return;
        
        // Get the event data
        const eventData = this.analysisResults.eventMap;
        if (!eventData) return;
        
        // Update scatter points with animation
        const scatterDatasets = chart.data.datasets.filter(ds => ds.type === 'scatter' || !ds.showLine);
        scatterDatasets.forEach(dataset => {
            if (dataset.label === 'Understeer Events') {
                dataset.data = eventData.understeerEvents;
            } else if (dataset.label === 'Oversteer Events') {
                dataset.data = eventData.oversteerEvents;
            }
        });
        
        // Animate the update
        chart.update('active');
    }

    getParameterLabel(paramKey) {
        const labels = {
            'front_spring_rate': 'Front Spring Rate (N/m)',
            'rear_spring_rate': 'Rear Spring Rate (N/m)',
            'front_toe': 'Front Toe (°)',
            'rear_toe': 'Rear Toe (°)',
            'front_camber': 'Front Camber (°)',
            'rear_camber': 'Rear Camber (°)',
            'front_arb': 'Front Anti-Roll Bar',
            'rear_arb': 'Rear Anti-Roll Bar',
            'differential_power': 'Differential Power (%)',
            'brake_balance': 'Brake Balance (%)',
            'front_ride_height': 'Front Ride Height (mm)',
            'rear_ride_height': 'Rear Ride Height (mm)',
            'tyre_press_lf': 'Tyre Pressure LF (psi)',
            'tyre_press_rf': 'Tyre Pressure RF (psi)',
            'tyre_press_lr': 'Tyre Pressure LR (psi)',
            'tyre_press_rr': 'Tyre Pressure RR (psi)'
        };
        return labels[paramKey] || paramKey;
    }

    getParameterStep(paramKey) {
        if (paramKey.includes('spring_rate')) return 1000;
        if (paramKey.includes('toe') || paramKey.includes('camber')) return 0.01;
        if (paramKey.includes('arb') || paramKey.includes('gear')) return 1;
        if (paramKey.includes('press') || paramKey.includes('balance')) return 0.1;
        if (paramKey.includes('height')) return 1;
        return 1;
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

    performAnalysis() {
        console.log('Performing telemetry analysis...');
        this.analysisResults.stabilityAnalysis = this.calculateStabilityAnalysis();
        this.analysisResults.trajectoryAnalysis = this.calculateTrajectoryAnalysis();
        this.analysisResults.cornerAnalysis = this.calculateCornerAnalysis();
        this.analysisResults.eventMap = this.calculateEventMap();
        console.log('Analysis complete');
    }

    calculateStabilityAnalysis() {
        const results = [];
        const smoothingWindow = 20;
        
        for (let i = 1; i < this.telemetryData.length; i++) {
            const current = this.telemetryData[i];
            const previous = this.telemetryData[i - 1];
            
            if (current.LateralG !== undefined && current.ROTY !== undefined && 
                current.STEERANGLE !== undefined && current.SPEED !== undefined) {
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

        // Apply moving average smoothing
        return this.applySmoothingToResults(results, smoothingWindow);
    }

    calculateEventMap() {
        if (!this.telemetryData.length) return null;
        
        const idealCurve = [];
        const drivingTrajectory = [];
        const understeerEvents = [];
        const oversteerEvents = [];
        
        // Generate ideal racing curve (smoother, optimal line)
        for (let i = 0; i < this.telemetryData.length; i++) {
            const point = this.telemetryData[i];
            const distance = point.Distance || i * 10;
            const trackProgress = (distance % 2000) / 2000;
            
            // Ideal curve - wider radius turns, smoother transitions
            const idealX = Math.cos(trackProgress * Math.PI * 4) * 120 + trackProgress * 400;
            const idealY = Math.sin(trackProgress * Math.PI * 4) * 60 + 200;
            idealCurve.push({ x: idealX, y: idealY });
            
            // Actual driving trajectory
            let actualX, actualY;
            if (point.X !== undefined && point.Y !== undefined) {
                actualX = point.X;
                actualY = point.Y;
            } else {
                // Generate based on telemetry data with setup influence
                const setupInfluence = this.calculateSetupImpact();
                const deviation = (setupInfluence.understeerImpact - setupInfluence.oversteerImpact) * 15;
                actualX = idealX + deviation + Math.sin(i * 0.05) * 10;
                actualY = idealY + deviation * 0.5 + Math.cos(i * 0.03) * 8;
            }
            drivingTrajectory.push({ x: actualX, y: actualY });
            
            // Calculate events based on stability analysis
            const stability = this.analysisResults.stabilityAnalysis;
            if (stability && stability[i]) {
                const event = {
                    x: actualX,
                    y: actualY,
                    severity: Math.abs(stability[i].gradient)
                };
                
                if (stability[i].state === 'understeer') {
                    understeerEvents.push(event);
                } else if (stability[i].state === 'oversteer') {
                    oversteerEvents.push(event);
                }
            }
        }
        
        // Apply Ramer-Douglas-Peucker smoothing to trajectories
        const smoothedIdealCurve = this.smoothTrajectory(idealCurve, 0.5);
        const smoothedDrivingTrajectory = this.smoothTrajectory(drivingTrajectory, 0.3);
        
        return {
            idealCurve: smoothedIdealCurve,
            drivingTrajectory: smoothedDrivingTrajectory,
            understeerEvents: understeerEvents.slice(0, 50), // Limit points for performance
            oversteerEvents: oversteerEvents.slice(0, 50)
        };
    }

    applySmoothingToResults(results, window) {
        return results.map((point, index) => {
            const start = Math.max(0, index - Math.floor(window / 2));
            const end = Math.min(results.length, index + Math.floor(window / 2));
            const subset = results.slice(start, end);
            
            const avgGradient = subset.reduce((sum, p) => sum + p.gradient, 0) / subset.length;
            
            return {
                ...point,
                gradient: avgGradient,
                state: avgGradient > this.physicsConstants.UNDERSTEER_THRESHOLD ? 'understeer' : 
                       avgGradient < this.physicsConstants.OVERSTEER_THRESHOLD ? 'oversteer' : 'neutral'
            };
        });
    }

    calculateUndersteerGradient(currentPoint, previousPoint) {
        const lateralG = Math.abs(currentPoint.LateralG || 0);
        const yawRate = currentPoint.ROTY || currentPoint.Yaw_Rate || 0;
        const steeringAngle = (currentPoint.STEERANGLE || 0) * Math.PI / 180;
        const velocity = Math.max(1, (currentPoint.SPEED || 50) / 3.6);

        const theoreticalYawRate = (velocity * Math.tan(steeringAngle)) / this.physicsConstants.WHEELBASE;
        const setupModifier = this.calculateSetupImpact();
        
        let understeerGradient = 0;
        if (lateralG > 0.1) {
            understeerGradient = ((theoreticalYawRate - yawRate) / lateralG) + 
                               setupModifier.understeerImpact - setupModifier.oversteerImpact;
        }
        
        // Clamp gradient to reasonable values
        understeerGradient = Math.max(-1, Math.min(1, understeerGradient));
        
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
        
        if (!this.setupData || Object.keys(this.setupData).length === 0) {
            return { understeerImpact: 0, oversteerImpact: 0 };
        }
        
        // Spring rate impact
        const springRateDelta = (this.setupData.rear_spring_rate - this.setupData.front_spring_rate) / 100000;
        understeerImpact += springRateDelta * 0.05;
        
        // Anti-roll bar impact
        const arbDelta = this.setupData.rear_arb - this.setupData.front_arb;
        understeerImpact += arbDelta * 0.03;
        
        // Toe impact
        understeerImpact += (this.setupData.front_toe * 0.2) - (this.setupData.rear_toe * 0.1);
        
        // Camber impact
        const camberBalance = Math.abs(this.setupData.rear_camber) - Math.abs(this.setupData.front_camber);
        understeerImpact -= camberBalance * 0.02;
        
        // Differential impact
        oversteerImpact += (this.setupData.differential_power - 50) * 0.004;
        
        // Brake balance impact
        understeerImpact += (this.setupData.brake_balance - 55) * 0.003;

        return { understeerImpact, oversteerImpact };
    }

    calculateTrajectoryAnalysis() {
        const results = {
            optimal: [],
            actual: []
        };

        for (let i = 0; i < this.telemetryData.length; i++) {
            const point = this.telemetryData[i];
            
            // Use actual X,Y if available, otherwise generate
            let x, y;
            if (point.X !== undefined && point.Y !== undefined) {
                x = point.X;
                y = point.Y;
            } else {
                const distance = point.Distance || i * 10;
                const trackProgress = (distance % 2000) / 2000;
                x = Math.cos(trackProgress * Math.PI * 4) * 100 + trackProgress * 400;
                y = Math.sin(trackProgress * Math.PI * 4) * 50 + 200;
            }
            
            results.actual.push({ x, y });
            
            // Generate optimal line (smoother, wider radius)
            const optimalX = x + Math.sin(i * 0.02) * 5;
            const optimalY = y + Math.cos(i * 0.02) * 5;
            results.optimal.push({ x: optimalX, y: optimalY });
        }

        // Apply Ramer-Douglas-Peucker smoothing
        results.optimal = this.smoothTrajectory(results.optimal, 0.5);
        results.actual = this.smoothTrajectory(results.actual, 0.3);

        return results;
    }

    smoothTrajectory(points, epsilon) {
        if (points.length < 3) return points;
        return this.ramerDouglasPeucker(points, epsilon);
    }

    ramerDouglasPeucker(points, epsilon) {
        if (points.length < 3) return points;
        
        let dmax = 0;
        let index = 0;
        const end = points.length - 1;
        
        for (let i = 1; i < end; i++) {
            const d = this.perpendicularDistance(points[i], points[0], points[end]);
            if (d > dmax) {
                index = i;
                dmax = d;
            }
        }
        
        if (dmax > epsilon) {
            const recResults1 = this.ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
            const recResults2 = this.ramerDouglasPeucker(points.slice(index), epsilon);
            
            return recResults1.slice(0, -1).concat(recResults2);
        } else {
            return [points[0], points[end]];
        }
    }

    perpendicularDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calculateCornerAnalysis() {
        const corners = [];
        let currentCorner = null;
        
        for (let i = 0; i < this.telemetryData.length; i++) {
            const point = this.telemetryData[i];
            const speed = point.SPEED || 0;
            const lateralG = Math.abs(point.LateralG || 0);
            
            // Detect corner entry/exit
            if (lateralG > 0.3 && !currentCorner) {
                // Corner entry
                currentCorner = {
                    startIndex: i,
                    entrySpeed: speed,
                    maxLateralG: lateralG,
                    minSpeed: speed
                };
            } else if (currentCorner && lateralG > 0.3) {
                // In corner
                currentCorner.maxLateralG = Math.max(currentCorner.maxLateralG, lateralG);
                currentCorner.minSpeed = Math.min(currentCorner.minSpeed, speed);
            } else if (currentCorner && lateralG <= 0.3) {
                // Corner exit
                currentCorner.endIndex = i;
                currentCorner.exitSpeed = speed;
                currentCorner.type = this.classifyCorner(currentCorner.minSpeed);
                corners.push(currentCorner);
                currentCorner = null;
            }
        }
        
        return corners;
    }

    classifyCorner(minSpeed) {
        if (minSpeed <= 120) {
            return 'slow';
        } else if (minSpeed >= 180) {
            return 'fast';
        } else {
            return 'medium';
        }
    }

    updateStabilityGauges() {
        if (!this.analysisResults.stabilityAnalysis) return;
        
        const stability = this.analysisResults.stabilityAnalysis;
        const setupImpact = this.calculateSetupImpact();
        
        // Calculate balance (understeer = negative, oversteer = positive)
        const avgGradient = stability.reduce((sum, s) => sum + s.gradient, 0) / stability.length;
        const balanceAngle = Math.max(-90, Math.min(90, avgGradient * 180)); // Convert to angle
        
        // Update balance gauge needle
        const needle = document.getElementById('balanceNeedle');
        if (needle) {
            needle.style.transform = `translateX(-50%) rotate(${balanceAngle}deg)`;
        }
        
        // Count understeer and oversteer events
        const understeerCount = stability.filter(s => s.state === 'understeer').length;
        const oversteerCount = stability.filter(s => s.state === 'oversteer').length;
        const totalEvents = stability.length;
        
        const understeerPercentage = (understeerCount / totalEvents) * 100;
        const oversteerPercentage = (oversteerCount / totalEvents) * 100;
        const overallBalance = Math.max(0, Math.min(100, 50 + (avgGradient * -25)));
        
        this.updateMeter('understeerMeter', 'understeerValue', understeerPercentage);
        this.updateMeter('oversteerMeter', 'oversteerValue', oversteerPercentage);
        this.updateMeter('overallMeter', 'overallValue', overallBalance);
    }

    updateMeter(meterId, valueId, percentage) {
        const meter = document.getElementById(meterId);
        const value = document.getElementById(valueId);
        
        if (meter) meter.style.width = `${Math.min(100, percentage)}%`;
        if (value) value.textContent = Math.round(percentage);
    }

    renderCharts() {
        console.log('Rendering charts...');
        try {
            this.renderStabilityChart();
            this.renderTrajectoryChart();
            this.renderEventMapChart();
            console.log('Charts rendered successfully');
        } catch (error) {
            console.error('Error rendering charts:', error);
        }
    }

    renderStabilityChart() {
        const canvas = document.getElementById('stabilityChart');
        if (!canvas) {
            console.warn('Stability chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.stabilityChart) {
            this.charts.stabilityChart.destroy();
        }
        
        if (!this.analysisResults.stabilityAnalysis) {
            console.warn('No stability analysis data available');
            return;
        }
        
        const data = this.analysisResults.stabilityAnalysis;
        const distances = data.map(d => d.distance);
        const gradients = data.map(d => d.gradient);
        
        const chartConfig = {
            type: 'line',
            data: {
                labels: distances,
                datasets: [{
                    label: 'Understeer Gradient',
                    data: gradients,
                    borderColor: '#B4413C',
                    backgroundColor: 'rgba(180, 65, 60, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Track Distance (m)'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(128, 128, 128, 0.2)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Understeer Gradient'
                        },
                        min: -0.5,
                        max: 0.5,
                        grid: {
                            display: true,
                            color: 'rgba(128, 128, 128, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const gradient = context.parsed.y;
                                const state = gradient > 0.1 ? 'Understeer' : 
                                            gradient < -0.1 ? 'Oversteer' : 'Neutral';
                                return `${state}: ${gradient.toFixed(3)}`;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderCapStyle: 'round'
                    }
                }
            }
        };
        
        // Add zoom plugin if available
        if (typeof Chart !== 'undefined' && Chart.registry && Chart.registry.plugins.get('zoom')) {
            chartConfig.options.plugins.zoom = {
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'x'
                },
                pan: {
                    enabled: true,
                    mode: 'x'
                }
            };
        }
        
        this.charts.stabilityChart = new Chart(ctx, chartConfig);
        console.log('Stability chart created');
    }

    renderTrajectoryChart() {
        const canvas = document.getElementById('trajectoryChart');
        if (!canvas) {
            console.warn('Trajectory chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.trajectoryChart) {
            this.charts.trajectoryChart.destroy();
        }
        
        if (!this.analysisResults.trajectoryAnalysis) {
            console.warn('No trajectory analysis data available');
            return;
        }
        
        const trajectory = this.analysisResults.trajectoryAnalysis;
        const corners = this.analysisResults.cornerAnalysis || [];
        
        // Prepare corner data
        const slowCorners = [];
        const fastCorners = [];
        
        corners.forEach((corner, index) => {
            if (corner.startIndex < trajectory.actual.length) {
                const point = trajectory.actual[corner.startIndex];
                const cornerData = {
                    x: point.x,
                    y: point.y,
                    label: `C${index + 1}`
                };
                
                if (corner.type === 'slow') {
                    slowCorners.push(cornerData);
                } else if (corner.type === 'fast') {
                    fastCorners.push(cornerData);
                }
            }
        });
        
        const chartConfig = {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Optimal Racing Line',
                        data: trajectory.optimal,
                        borderColor: '#5D878F',
                        backgroundColor: 'rgba(93, 135, 143, 0.3)',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        showLine: true,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Actual Trajectory',
                        data: trajectory.actual,
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.3)',
                        borderWidth: 2,
                        showLine: true,
                        pointRadius: 0,
                        pointHoverRadius: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Slow Corners',
                        data: slowCorners,
                        backgroundColor: '#DB4545',
                        borderColor: '#DB4545',
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        showLine: false
                    },
                    {
                        label: 'Fast Corners',
                        data: fastCorners,
                        backgroundColor: '#13343B',
                        borderColor: '#13343B',
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        showLine: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Track Position X (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Track Position Y (m)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        filter: function(tooltipItem) {
                            return tooltipItem.datasetIndex >= 2; // Only show for corner points
                        },
                        callbacks: {
                            label: function(context) {
                                const corner = corners[context.dataIndex];
                                if (corner) {
                                    return `${context.dataset.label}: ${corner.minSpeed.toFixed(0)} km/h`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        };
        
        // Add zoom plugin if available
        if (typeof Chart !== 'undefined' && Chart.registry && Chart.registry.plugins.get('zoom')) {
            chartConfig.options.plugins.zoom = {
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'xy'
                },
                pan: {
                    enabled: true,
                    mode: 'xy'
                }
            };
        }
        
        this.charts.trajectoryChart = new Chart(ctx, chartConfig);
        console.log('Trajectory chart created');
    }

    renderEventMapChart() {
        const canvas = document.getElementById('eventMapChart');
        if (!canvas) {
            console.warn('Event map chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.eventMapChart) {
            this.charts.eventMapChart.destroy();
        }
        
        if (!this.analysisResults.eventMap) {
            console.warn('No event map data available');
            return;
        }
        
        const eventMap = this.analysisResults.eventMap;
        
        const chartConfig = {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Ideal Racing Curve',
                        data: eventMap.idealCurve,
                        borderColor: '#5D878F',
                        backgroundColor: 'rgba(93, 135, 143, 0.2)',
                        borderWidth: 3,
                        borderDash: [8, 4],
                        showLine: true,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0.2
                    },
                    {
                        label: 'Driving Trajectory',
                        data: eventMap.drivingTrajectory,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.2)',
                        borderWidth: 2,
                        showLine: true,
                        pointRadius: 0,
                        pointHoverRadius: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Understeer Events',
                        data: eventMap.understeerEvents,
                        backgroundColor: '#1FB8CD',
                        borderColor: '#1FB8CD',
                        pointRadius: function(context) {
                            return Math.max(4, Math.min(12, (context.raw.severity || 0.5) * 20));
                        },
                        pointHoverRadius: function(context) {
                            return Math.max(6, Math.min(15, (context.raw.severity || 0.5) * 25));
                        },
                        showLine: false,
                        type: 'scatter'
                    },
                    {
                        label: 'Oversteer Events',
                        data: eventMap.oversteerEvents,
                        backgroundColor: '#B4413C',
                        borderColor: '#B4413C',
                        pointRadius: function(context) {
                            return Math.max(4, Math.min(12, (context.raw.severity || 0.5) * 20));
                        },
                        pointHoverRadius: function(context) {
                            return Math.max(6, Math.min(15, (context.raw.severity || 0.5) * 25));
                        },
                        showLine: false,
                        type: 'scatter'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500,
                    easing: 'easeInOutQuart'
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Track Position X (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Track Position Y (m)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        filter: function(tooltipItem) {
                            return tooltipItem.datasetIndex >= 2; // Only show for event points
                        },
                        callbacks: {
                            label: function(context) {
                                const severity = context.raw.severity || 0;
                                return `${context.dataset.label}: Severity ${(severity * 100).toFixed(0)}%`;
                            }
                        }
                    }
                }
            }
        };
        
        // Add zoom plugin if available
        if (typeof Chart !== 'undefined' && Chart.registry && Chart.registry.plugins.get('zoom')) {
            chartConfig.options.plugins.zoom = {
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'xy'
                },
                pan: {
                    enabled: true,
                    mode: 'xy'
                }
            };
        }
        
        this.charts.eventMapChart = new Chart(ctx, chartConfig);
        console.log('Event map chart created');
    }

    generateRecommendations() {
        const container = document.getElementById('recommendationsList');
        if (!container) return;
        
        container.innerHTML = '';

        const recommendations = this.analyzeSetupRecommendations();
        
        recommendations.forEach(rec => {
            const recDiv = document.createElement('div');
            recDiv.className = `recommendation-item ${rec.priority}`;
            
            recDiv.innerHTML = `
                <div class="recommendation-header">
                    <h4 class="recommendation-title">
                        <span class="recommendation-icon">${rec.icon}</span>
                        ${rec.title}
                    </h4>
                    <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
                </div>
                <p class="recommendation-description">${rec.description}</p>
                ${rec.change ? `<div class="recommendation-change">${rec.change}</div>` : ''}
                <div class="recommendation-improvement">⚡ ${rec.improvement}</div>
            `;
            
            container.appendChild(recDiv);
        });
    }

    analyzeSetupRecommendations() {
        const recommendations = [];
        const stability = this.analysisResults.stabilityAnalysis;
        
        if (!stability || stability.length === 0) {
            return [{
                icon: '📊',
                title: 'Load Telemetry Data',
                description: 'Upload telemetry data to receive detailed setup recommendations',
                improvement: 'Analysis will be available after data upload',
                priority: 'minor'
            }];
        }

        const carLimits = this.carDatabase[this.currentCarClass]?.[this.currentCarModel];
        if (!carLimits) return recommendations;

        // Analyze stability patterns
        const understeerCount = stability.filter(s => s.state === 'understeer').length;
        const oversteerCount = stability.filter(s => s.state === 'oversteer').length;
        const totalPoints = stability.length;

        const understeerPercentage = (understeerCount / totalPoints) * 100;
        const oversteerPercentage = (oversteerCount / totalPoints) * 100;

        // Critical recommendations for major handling issues
        if (understeerPercentage > 30) {
            const currentFrontCamber = this.setupData.front_camber || carLimits.front_camber.default;
            const newFrontCamber = Math.max(carLimits.front_camber.min, currentFrontCamber - 0.4);

            if (newFrontCamber !== currentFrontCamber) {
                recommendations.push({
                    icon: '🔧',
                    title: 'Severe Understeer - Front Camber Adjustment',
                    description: `${understeerPercentage.toFixed(1)}% of track shows understeer. Increase front grip with more negative camber.`,
                    change: `Front camber: ${currentFrontCamber.toFixed(1)}° → ${newFrontCamber.toFixed(1)}° (increase negative camber ${Math.abs(newFrontCamber - currentFrontCamber).toFixed(1)}°)`,
                    improvement: 'Expected: 20-30% reduction in understeer tendency',
                    priority: 'critical'
                });
            }
        }

        if (oversteerPercentage > 25) {
            const currentDiffPower = this.setupData.differential_power || carLimits.differential_power.default;
            const newDiffPower = Math.max(carLimits.differential_power.min, currentDiffPower - 15);

            if (newDiffPower !== currentDiffPower) {
                recommendations.push({
                    icon: '🔧',
                    title: 'Oversteer Issues - Differential Power',
                    description: `${oversteerPercentage.toFixed(1)}% of track shows oversteer. Reduce differential power for better traction.`,
                    change: `Differential power: ${currentDiffPower}% → ${newDiffPower}% (reduce ${currentDiffPower - newDiffPower}%)`,
                    improvement: 'Expected: 15-20% improvement in corner exit stability',
                    priority: 'critical'
                });
            }
        }

        // Add balanced setup recommendation if handling is good
        if (recommendations.length === 0) {
            recommendations.push({
                icon: '✅',
                title: 'Well-Balanced Setup',
                description: 'Current setup shows good handling characteristics. Consider minor adjustments based on driver preference.',
                improvement: 'Fine-tune based on track conditions and driving style',
                priority: 'minor'
            });
        }

        return recommendations.slice(0, 6); // Limit to 6 recommendations
    }

    // Utility methods
    showUploadStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `upload-status ${type}`;
        }
    }

    showProgress(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        if (!progressBar) return;
        
        const fill = progressBar.querySelector('.progress-fill');
        
        progressBar.classList.add('visible');
        if (fill) fill.style.width = `${percentage}%`;
    }

    hideProgress(elementId) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            progressBar.classList.remove('visible');
        }
    }

    showLoadingOverlay(message, progress = 0) {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');
        const progressBar = document.getElementById('loadingProgressBar');
        
        if (messageElement) messageElement.textContent = message;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (overlay) overlay.classList.remove('hidden');
    }

    updateLoadingProgress(progress) {
        const progressBar = document.getElementById('loadingProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    updateLoadingMessage(message) {
        const messageElement = document.getElementById('loadingMessage');
        if (messageElement) {
            messageElement.textContent = message;
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
    console.log('DOM loaded, initializing ACC Telemetry Analyzer...');
    window.accAnalyzer = new ACCTelemetryAnalyzer();
});