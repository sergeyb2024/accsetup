// ACC Setup Optimizer - JavaScript Application
class ACCSetupOptimizer {
    constructor() {
        this.carData = {
            gt3: [
                {"id": "audi_r8_evo_ii", "name": "Audi R8 LMS Evo II GT3", "weight_dist": 0.45, "aero_efficiency": 0.85},
                {"id": "bmw_m6_gt3", "name": "BMW M6 GT3", "weight_dist": 0.47, "aero_efficiency": 0.82},
                {"id": "ferrari_488_gt3_evo", "name": "Ferrari 488 GT3 Evo 2020", "weight_dist": 0.42, "aero_efficiency": 0.88},
                {"id": "lamborghini_huracan_gt3_evo", "name": "Lamborghini Huracán GT3 Evo", "weight_dist": 0.43, "aero_efficiency": 0.86},
                {"id": "mclaren_720s_gt3", "name": "McLaren 720S GT3", "weight_dist": 0.44, "aero_efficiency": 0.87},
                {"id": "mercedes_amg_gt3_2020", "name": "Mercedes-AMG GT3 2020", "weight_dist": 0.46, "aero_efficiency": 0.84},
                {"id": "porsche_991ii_gt3_r", "name": "Porsche 991.2 GT3 R", "weight_dist": 0.38, "aero_efficiency": 0.83},
                {"id": "aston_martin_v8_vantage", "name": "Aston Martin V8 Vantage GT3", "weight_dist": 0.48, "aero_efficiency": 0.81},
                {"id": "honda_nsx_gt3_evo", "name": "Honda NSX GT3 Evo", "weight_dist": 0.41, "aero_efficiency": 0.85},
                {"id": "lexus_rc_f_gt3", "name": "Lexus RC F GT3", "weight_dist": 0.49, "aero_efficiency": 0.80},
                {"id": "nissan_gtr_gt3_2018", "name": "Nissan GT-R GT3 2018", "weight_dist": 0.52, "aero_efficiency": 0.79}
            ],
            gt4: [
                {"id": "alpine_a110_gt4", "name": "Alpine A110 GT4", "weight_dist": 0.44, "aero_efficiency": 0.75},
                {"id": "aston_martin_vantage_gt4", "name": "Aston Martin Vantage GT4", "weight_dist": 0.47, "aero_efficiency": 0.73},
                {"id": "audi_r8_gt4", "name": "Audi R8 LMS GT4", "weight_dist": 0.45, "aero_efficiency": 0.74},
                {"id": "bmw_m4_gt4", "name": "BMW M4 GT4", "weight_dist": 0.48, "aero_efficiency": 0.72},
                {"id": "chevrolet_camaro_gt4", "name": "Chevrolet Camaro GT4.R", "weight_dist": 0.51, "aero_efficiency": 0.71},
                {"id": "ginetta_g55_gt4", "name": "Ginetta G55 GT4", "weight_dist": 0.46, "aero_efficiency": 0.70},
                {"id": "ktm_xbow_gt4", "name": "KTM X-Bow GT4", "weight_dist": 0.43, "aero_efficiency": 0.76},
                {"id": "maserati_mc_gt4", "name": "Maserati MC GT4", "weight_dist": 0.49, "aero_efficiency": 0.69},
                {"id": "mclaren_570s_gt4", "name": "McLaren 570S GT4", "weight_dist": 0.44, "aero_efficiency": 0.73},
                {"id": "mercedes_amg_gt4", "name": "Mercedes-AMG GT4", "weight_dist": 0.47, "aero_efficiency": 0.72},
                {"id": "porsche_718_cayman_gt4", "name": "Porsche 718 Cayman GT4 CS MR", "weight_dist": 0.45, "aero_efficiency": 0.74}
            ]
        };

        this.setupParameters = {
            tire_pressure: { min: 20, max: 35, default: 26.5, step: 0.1 },
            front_camber: { min: -4.0, max: -1.0, default: -2.8, step: 0.1 },
            rear_camber: { min: -3.5, max: -1.0, default: -2.5, step: 0.1 },
            front_toe: { min: -0.5, max: 0.5, default: 0.0, step: 0.01 },
            rear_toe: { min: -0.3, max: 0.8, default: 0.1, step: 0.01 },
            caster: { min: 10, max: 16, default: 13, step: 0.1 },
            front_splitter: { min: 0, max: 15, default: 5, step: 1 },
            rear_wing: { min: 0, max: 15, default: 8, step: 1 },
            brake_ducts: { min: 0, max: 6, default: 3, step: 1 },
            front_wheel_rate: { min: 80000, max: 200000, default: 130000, step: 1000 },
            rear_wheel_rate: { min: 80000, max: 200000, default: 120000, step: 1000 },
            front_ride_height: { min: 50, max: 120, default: 65, step: 1 },
            rear_ride_height: { min: 50, max: 120, default: 70, step: 1 },
            front_arb: { min: 0, max: 40, default: 15, step: 1 },
            rear_arb: { min: 0, max: 40, default: 12, step: 1 },
            traction_control: { min: 0, max: 11, default: 3, step: 1 },
            abs: { min: 0, max: 11, default: 3, step: 1 },
            brake_balance: { min: 45, max: 65, default: 55, step: 0.1 },
            diff_preload: { min: 20, max: 300, default: 80, step: 5 },
            diff_coast: { min: 0, max: 80, default: 15, step: 1 },
            diff_accel: { min: 0, max: 100, default: 35, step: 1 }
        };

        this.currentSetup = {};
        this.selectedCar = null;
        this.stabilityChart = null;
        this.trackData = [
            {"distance": 0, "speed": 60, "lateral_g": 0.2, "sector": "straight"},
            {"distance": 200, "speed": 80, "lateral_g": 0.1, "sector": "straight"},
            {"distance": 400, "speed": 120, "lateral_g": 0.0, "sector": "straight"},
            {"distance": 600, "speed": 100, "lateral_g": 0.8, "sector": "corner"},
            {"distance": 700, "speed": 85, "lateral_g": 1.2, "sector": "corner"},
            {"distance": 800, "speed": 95, "lateral_g": 0.9, "sector": "corner"},
            {"distance": 1000, "speed": 110, "lateral_g": 0.3, "sector": "straight"},
            {"distance": 1200, "speed": 130, "lateral_g": 0.0, "sector": "straight"},
            {"distance": 1400, "speed": 90, "lateral_g": 1.1, "sector": "corner"},
            {"distance": 1500, "speed": 75, "lateral_g": 1.4, "sector": "corner"},
            {"distance": 1600, "speed": 80, "lateral_g": 1.0, "sector": "corner"},
            {"distance": 1800, "speed": 120, "lateral_g": 0.2, "sector": "straight"}
        ];

        // Initialize default setup values
        Object.keys(this.setupParameters).forEach(param => {
            this.currentSetup[param] = this.setupParameters[param].default;
        });

        this.init();
    }

    init() {
        this.populateCarSelect();
        this.initializeChart();
        this.setupEventListeners();
        this.updateAnalysis();
    }

    populateCarSelect() {
        const select = document.getElementById('car-select');
        select.innerHTML = '<option value="">Choose a car...</option>';
        
        // Add GT3 cars
        const gt3Group = document.createElement('optgroup');
        gt3Group.label = 'GT3 Cars';
        this.carData.gt3.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = car.name;
            option.dataset.category = 'gt3';
            gt3Group.appendChild(option);
        });
        select.appendChild(gt3Group);

        // Add GT4 cars
        const gt4Group = document.createElement('optgroup');
        gt4Group.label = 'GT4 Cars';
        this.carData.gt4.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            option.textContent = car.name;
            option.dataset.category = 'gt4';
            gt4Group.appendChild(option);
        });
        select.appendChild(gt4Group);
    }

    setupEventListeners() {
        // Car selection
        const carSelect = document.getElementById('car-select');
        if (carSelect) {
            carSelect.addEventListener('change', (e) => {
                this.selectCar(e.target.value);
            });
        }

        // Setup parameter controls
        Object.keys(this.setupParameters).forEach(param => {
            const slider = document.getElementById(param);
            if (slider) {
                const numberInput = slider.parentElement.querySelector('.number-input');
                
                // Sync slider and number input
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (numberInput) {
                        numberInput.value = value;
                    }
                    this.updateParameter(param, value);
                });

                if (numberInput) {
                    numberInput.addEventListener('input', (e) => {
                        const value = parseFloat(e.target.value);
                        slider.value = value;
                        this.updateParameter(param, value);
                    });
                }
            }
        });

        // Control buttons
        const resetBtn = document.getElementById('reset-setup');
        const optimizeBtn = document.getElementById('optimize-setup');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSetup();
            });
        }

        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                this.autoOptimize();
            });
        }
    }

    selectCar(carId) {
        if (!carId) {
            this.selectedCar = null;
            document.getElementById('weight-dist').textContent = '-';
            document.getElementById('aero-eff').textContent = '-';
            this.updateAnalysis();
            return;
        }

        // Find car in data
        let car = null;
        for (const category of Object.values(this.carData)) {
            car = category.find(c => c.id === carId);
            if (car) break;
        }

        if (car) {
            this.selectedCar = car;
            document.getElementById('weight-dist').textContent = `${(car.weight_dist * 100).toFixed(1)}% Front`;
            document.getElementById('aero-eff').textContent = `${(car.aero_efficiency * 100).toFixed(0)}%`;
            this.updateAnalysis();
            
            // Update the select element to maintain the selection
            const select = document.getElementById('car-select');
            select.value = carId;
        }
    }

    updateParameter(param, value) {
        this.currentSetup[param] = value;
        
        // Visual feedback for changed parameters
        const paramElement = document.getElementById(param);
        if (paramElement) {
            const control = paramElement.closest('.parameter-control');
            if (control) {
                control.classList.add('changed');
            }
        }
        
        // Update analysis in real-time
        this.updateAnalysis();
    }

    calculateStabilityIndex() {
        if (!this.selectedCar) return 0;

        const car = this.selectedCar;
        let stabilityIndex = 0;

        // Aerodynamic balance factor (-50 to +50)
        const aeroBalance = (this.currentSetup.rear_wing - this.currentSetup.front_splitter) * 3;
        stabilityIndex += aeroBalance * car.aero_efficiency;

        // Suspension stiffness balance (-30 to +30)
        const suspensionBalance = (this.currentSetup.rear_wheel_rate - this.currentSetup.front_wheel_rate) / 2000;
        stabilityIndex += suspensionBalance;

        // Weight distribution influence (-20 to +20)
        const weightFactor = (car.weight_dist - 0.5) * 40;
        stabilityIndex += weightFactor;

        // Anti-roll bar balance (-15 to +15)
        const arbBalance = (this.currentSetup.rear_arb - this.currentSetup.front_arb) * 1.5;
        stabilityIndex += arbBalance;

        // Ride height influence (-10 to +10)
        const rideHeightBalance = (this.currentSetup.rear_ride_height - this.currentSetup.front_ride_height) * 0.5;
        stabilityIndex += rideHeightBalance;

        // Camber influence (-10 to +10)
        const camberBalance = (Math.abs(this.currentSetup.rear_camber) - Math.abs(this.currentSetup.front_camber)) * 5;
        stabilityIndex += camberBalance;

        // Toe influence (-10 to +10)
        const toeBalance = (this.currentSetup.rear_toe - this.currentSetup.front_toe) * 20;
        stabilityIndex += toeBalance;

        // Brake balance influence (-5 to +5)
        const brakeBalance = (this.currentSetup.brake_balance - 55) * 0.2;
        stabilityIndex += brakeBalance;

        // Electronic aids influence (-5 to +5)
        const electronicsInfluence = (this.currentSetup.traction_control - 6) * 0.5;
        stabilityIndex -= electronicsInfluence; // TC reduces oversteer

        // Clamp to -100 to +100 range
        return Math.max(-100, Math.min(100, stabilityIndex));
    }

    generateStabilityData() {
        const baseStability = this.calculateStabilityIndex();
        
        return this.trackData.map(point => {
            let stability = baseStability;
            
            // Modify stability based on track conditions
            if (point.sector === 'corner') {
                // Corners amplify stability characteristics
                stability *= (1 + point.lateral_g * 0.3);
                
                // High-speed corners are more sensitive to aerodynamics
                if (point.speed > 100) {
                    const aeroInfluence = (this.currentSetup.rear_wing - this.currentSetup.front_splitter) * 2;
                    stability += aeroInfluence * (this.selectedCar ? this.selectedCar.aero_efficiency : 0.8);
                }
            }
            
            // Clamp values
            stability = Math.max(-100, Math.min(100, stability));
            
            return {
                x: point.distance,
                y: stability,
                speed: point.speed,
                sector: point.sector,
                lateralG: point.lateral_g
            };
        });
    }

    getStabilityColor(stability) {
        if (stability < -20) return '#FF5459'; // Red (Oversteer)
        if (stability > 20) return '#3B82F6';  // Blue (Understeer)
        return '#F59E0B'; // Yellow (Neutral)
    }

    getStabilityDescription(stability) {
        if (stability < -50) return 'Severe Oversteer';
        if (stability < -20) return 'Oversteer';
        if (stability < -5) return 'Slight Oversteer';
        if (stability <= 5) return 'Neutral';
        if (stability <= 20) return 'Slight Understeer';
        if (stability <= 50) return 'Understeer';
        return 'Severe Understeer';
    }

    generateRecommendations(stabilityIndex) {
        const recommendations = [];
        
        if (!this.selectedCar) {
            return ['Select a car to begin analysis'];
        }

        if (Math.abs(stabilityIndex) < 10) {
            recommendations.push('Setup is well balanced');
            recommendations.push('Fine-tune for track-specific conditions');
        } else if (stabilityIndex < -20) {
            recommendations.push('Reduce oversteer tendency:');
            recommendations.push('Increase rear wing angle');
            recommendations.push('Soften rear suspension');
            recommendations.push('Increase rear anti-roll bar stiffness');
            recommendations.push('Move brake balance forward');
        } else if (stabilityIndex > 20) {
            recommendations.push('Reduce understeer tendency:');
            recommendations.push('Increase front splitter');
            recommendations.push('Soften front suspension');
            recommendations.push('Increase front anti-roll bar stiffness');
            recommendations.push('Move brake balance rearward');
        } else if (stabilityIndex < 0) {
            recommendations.push('Mild oversteer - minor adjustments:');
            recommendations.push('Slight increase in rear wing');
            recommendations.push('Reduce rear tire pressure slightly');
        } else {
            recommendations.push('Mild understeer - minor adjustments:');
            recommendations.push('Slight increase in front splitter');
            recommendations.push('Reduce front tire pressure slightly');
        }

        return recommendations;
    }

    updateAnalysis() {
        const stabilityIndex = this.calculateStabilityIndex();
        const stabilityData = this.generateStabilityData();
        const recommendations = this.generateRecommendations(stabilityIndex);

        // Update stability gauge
        const gaugeValue = document.getElementById('stability-index');
        const gaugeDescription = document.getElementById('stability-description');
        
        if (gaugeValue) {
            gaugeValue.textContent = stabilityIndex.toFixed(0);
            gaugeValue.className = 'gauge-value';
            
            if (stabilityIndex < -20) {
                gaugeValue.classList.add('oversteer');
            } else if (stabilityIndex > 20) {
                gaugeValue.classList.add('understeer');
            } else {
                gaugeValue.classList.add('neutral');
            }
        }
        
        if (gaugeDescription) {
            gaugeDescription.textContent = this.getStabilityDescription(stabilityIndex);
            gaugeDescription.className = 'gauge-description';
            
            if (stabilityIndex < -20) {
                gaugeDescription.classList.add('oversteer');
            } else if (stabilityIndex > 20) {
                gaugeDescription.classList.add('understeer');
            } else {
                gaugeDescription.classList.add('neutral');
            }
        }

        // Update recommendations
        const recommendationsList = document.getElementById('recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = '';
            recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.textContent = rec;
                recommendationsList.appendChild(li);
            });
        }

        // Update chart
        this.updateChart(stabilityData);
    }

    initializeChart() {
        const ctx = document.getElementById('stability-chart');
        if (!ctx) return;
        
        this.stabilityChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Stability Index',
                    data: [],
                    borderColor: '#32B8CD',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: [],
                    pointBorderColor: [],
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                return `Distance: ${point.parsed.x}m`;
                            },
                            label: (context) => {
                                const data = context.raw;
                                const stability = data.y.toFixed(0);
                                const description = this.getStabilityDescription(data.y);
                                return [
                                    `Stability: ${stability}`,
                                    `Status: ${description}`,
                                    `Speed: ${data.speed} km/h`,
                                    `Lateral G: ${data.lateralG.toFixed(1)}g`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Track Distance (m)',
                            color: '#626C7C'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#626C7C'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Stability Index',
                            color: '#626C7C'
                        },
                        min: -100,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#626C7C',
                            callback: function(value) {
                                if (value === -100) return 'Oversteer';
                                if (value === 0) return 'Neutral';
                                if (value === 100) return 'Understeer';
                                return value;
                            }
                        }
                    }
                }
            }
        });

        // Initial chart update with default data
        this.updateChart(this.generateStabilityData());
    }

    updateChart(stabilityData) {
        if (!this.stabilityChart) return;

        const pointColors = stabilityData.map(point => this.getStabilityColor(point.y));
        
        this.stabilityChart.data.datasets[0].data = stabilityData;
        this.stabilityChart.data.datasets[0].pointBackgroundColor = pointColors;
        this.stabilityChart.data.datasets[0].pointBorderColor = pointColors;
        
        this.stabilityChart.update();
    }

    resetSetup() {
        // Reset setup values
        Object.keys(this.setupParameters).forEach(param => {
            this.currentSetup[param] = this.setupParameters[param].default;
        });
        
        // Reset all controls
        Object.keys(this.setupParameters).forEach(param => {
            const slider = document.getElementById(param);
            if (slider) {
                const numberInput = slider.parentElement.querySelector('.number-input');
                
                slider.value = this.setupParameters[param].default;
                if (numberInput) {
                    numberInput.value = this.setupParameters[param].default;
                }
                
                // Remove changed styling
                const control = slider.closest('.parameter-control');
                if (control) {
                    control.classList.remove('changed');
                }
            }
        });

        this.updateAnalysis();
    }

    autoOptimize() {
        if (!this.selectedCar) return;

        // Simple optimization algorithm targeting neutral stability
        const targetStability = 0;
        let currentStability = this.calculateStabilityIndex();

        // Make small adjustments to key parameters
        if (Math.abs(currentStability) > 10) {
            if (currentStability < -10) { // Reduce oversteer
                this.currentSetup.rear_wing = Math.min(15, this.currentSetup.rear_wing + 2);
                this.currentSetup.front_splitter = Math.max(0, this.currentSetup.front_splitter - 1);
                this.currentSetup.brake_balance = Math.max(45, this.currentSetup.brake_balance - 1);
            } else if (currentStability > 10) { // Reduce understeer
                this.currentSetup.front_splitter = Math.min(15, this.currentSetup.front_splitter + 2);
                this.currentSetup.rear_wing = Math.max(0, this.currentSetup.rear_wing - 1);
                this.currentSetup.brake_balance = Math.min(65, this.currentSetup.brake_balance + 1);
            }
        }

        // Update UI controls
        Object.keys(this.currentSetup).forEach(param => {
            const slider = document.getElementById(param);
            if (slider) {
                const numberInput = slider.parentElement.querySelector('.number-input');
                
                slider.value = this.currentSetup[param];
                if (numberInput) {
                    numberInput.value = this.currentSetup[param];
                }
            }
        });

        this.updateAnalysis();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ACCSetupOptimizer();
});