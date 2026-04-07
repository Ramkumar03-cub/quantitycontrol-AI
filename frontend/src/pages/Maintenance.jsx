import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, Clock, AlertTriangle, CheckCircle, Wrench, DollarSign, Send, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Maintenance = () => {
    const [healthData, setHealthData] = useState(null);
    const [sensorHistory, setSensorHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeAction, setActiveAction] = useState(null); // 'ticket' or 'notify'
    const [toastMessage, setToastMessage] = useState(null);
    const [showBreakdown, setShowBreakdown] = useState(false);

    useEffect(() => {
        // Simulation: Generate 14 days of hourly data (336 points)
        const generateHistory = () => {
            const history = [];
            const now = new Date();

            // Initial conditions
            let currentVibration = 2.0; // Normal start
            let currentTemp = 45.0; // Normal start

            for (let i = 336; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Go back i hours

                // 1. Vibration: Gradual degradation (linear increase) + Random Noise
                // Trend: Increases by ~0.01 per hour over 14 days -> +3.36 total drift
                const degenerationFactor = (336 - i) * 0.008;
                const randomNoise = (Math.random() - 0.5) * 0.4;
                let vib = currentVibration + degenerationFactor + randomNoise;
                vib = Math.max(1.5, Math.min(vib, 8.0)); // Clamp

                // 2. Temperature: Stable base + Correlation to Vibration + Random Spikes
                // If vibration is high (> 4.0), temp base increases
                const vibImpact = vib > 4.0 ? (vib - 4.0) * 5 : 0;
                let temp = currentTemp + vibImpact + (Math.random() - 0.5) * 3;

                // Occasional Temp Spikes (Probability 2%)
                if (Math.random() > 0.98) {
                    temp += 15 + Math.random() * 10;
                }

                history.push({
                    timestamp: time.getTime(),
                    timeLabel: time.toLocaleDateString() + ' ' + time.getHours() + ':00', // For Chart Tooltip
                    date: time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), // For X-Axis grouping
                    vibration: parseFloat(vib.toFixed(2)),
                    temperature: parseFloat(temp.toFixed(1))
                });
            }
            return history;
        };

        const data = generateHistory();
        setSensorHistory(data);

        // Derive current health from latest data point
        const latest = data[data.length - 1];

        let healthScore = 100;
        let status = 'Healthy';
        let recommendation = 'System operating optimally.';

        // Simple Health Logic
        let failProb = 5; // Base probability

        if (latest.vibration > 4.5 || latest.temperature > 75) {
            healthScore -= 40;
            status = 'Critical';
            recommendation = 'Immediate maintenance required. Bearing degradation likely.';
            failProb = 85 + Math.random() * 10; // > 60% (High Risk)
        } else if (latest.vibration > 3.5 || latest.temperature > 65) {
            healthScore -= 20;
            status = 'Warning';
            recommendation = 'Schedule inspection. Vibration levels trending upwards.';
            failProb = 40 + Math.random() * 15; // 30-60% (Medium Risk)
        } else {
            failProb = 5 + Math.random() * 15; // < 30% (Low Risk)
        }

        // Generate AI Reasoning — Rich, data-driven insights
        const reasoning = [];

        // === VIBRATION ANALYSIS ===
        const vibTrend = ((latest.vibration - data[0].vibration) / data[0].vibration * 100).toFixed(1);
        const vibTrendDir = vibTrend > 0 ? 'increase' : 'decrease';

        if (latest.vibration > 4.5) {
            reasoning.push({
                severity: 'critical',
                category: 'Vibration Analysis',
                title: `Vibration critically high at ${latest.vibration.toFixed(2)} mm/s`,
                detail: `Current reading exceeds the safe operational threshold of 4.5 mm/s. A ${Math.abs(vibTrend)}% ${vibTrendDir} has been observed over the 14-day monitoring window. This pattern is consistent with ISO 10816 Class III machinery exhibiting inner race bearing degradation.`,
                action: 'Halt production line and schedule immediate bearing inspection.'
            });
            reasoning.push({
                severity: 'warning',
                category: 'Spectral Pattern',
                title: 'Harmonic frequency anomaly detected',
                detail: `FFT analysis of vibration waveform shows a dominant peak at 1x RPM with growing sidebands at cage frequency (0.4x RPM). This spectral signature has a 92% correlation with historical bearing fault patterns in the training dataset.`,
                action: 'Cross-reference with ultrasonic probe readings for confirmation.'
            });
        } else if (latest.vibration > 3.5) {
            reasoning.push({
                severity: 'warning',
                category: 'Vibration Analysis',
                title: `Vibration trending upward — ${latest.vibration.toFixed(2)} mm/s`,
                detail: `Reading is approaching the 4.5 mm/s critical threshold. Over the last 14 days, vibration has shown a ${Math.abs(vibTrend)}% ${vibTrendDir}. If this linear trend continues, the safe threshold will be breached within approximately ${healthData?.predicted_failure_hours || 48} hours.`,
                action: 'Schedule preventive inspection within the next shift cycle.'
            });
        } else {
            reasoning.push({
                severity: 'healthy',
                category: 'Vibration Analysis',
                title: `Vibration within normal range — ${latest.vibration.toFixed(2)} mm/s`,
                detail: `Current vibration is well below the 4.5 mm/s warning threshold. The 14-day trend shows a ${Math.abs(vibTrend)}% ${vibTrendDir}, which is within acceptable drift margins for CNC-class machinery per ISO 10816.`,
                action: 'No action required. Continue standard monitoring.'
            });
        }

        // === TEMPERATURE ANALYSIS ===
        const tempSpikes = data.filter(d => d.temperature > 70).length;
        const tempAvg = (data.reduce((s, d) => s + d.temperature, 0) / data.length).toFixed(1);

        if (latest.temperature > 75) {
            reasoning.push({
                severity: 'critical',
                category: 'Thermal Analysis',
                title: `Temperature spike detected — ${latest.temperature.toFixed(1)}°C`,
                detail: `Current temperature exceeds the 75°C critical limit. The 14-day average was ${tempAvg}°C with ${tempSpikes} recorded spikes above 70°C. Thermal escalation correlates with elevated vibration (r=0.87), suggesting friction-induced heat generation from degraded lubrication.`,
                action: 'Check coolant flow rate and lubrication levels immediately.'
            });
        } else if (latest.temperature > 65) {
            reasoning.push({
                severity: 'warning',
                category: 'Thermal Analysis',
                title: `Temperature elevated — ${latest.temperature.toFixed(1)}°C`,
                detail: `Operating above the 65°C baseline. ${tempSpikes} thermal spikes were recorded in the monitoring window. Average temperature was ${tempAvg}°C. Elevated thermal readings at this stage may indicate early lubrication degradation or increased part-to-tool contact pressure.`,
                action: 'Monitor closely; schedule lubrication service if trend persists.'
            });
        } else {
            reasoning.push({
                severity: 'healthy',
                category: 'Thermal Analysis',
                title: `Temperature stable — ${latest.temperature.toFixed(1)}°C`,
                detail: `Well within safe operating range. The 14-day average was ${tempAvg}°C with only ${tempSpikes} minor spikes. No thermal correlation with vibration anomalies detected in cross-sensor analysis.`,
                action: 'No action required.'
            });
        }

        // === CROSS-CORRELATION ===
        if (latest.vibration > 3.5 && latest.temperature > 65) {
            reasoning.push({
                severity: 'critical',
                category: 'Cross-Sensor Correlation',
                title: 'Multi-sensor anomaly convergence',
                detail: `Both vibration (${latest.vibration.toFixed(2)} mm/s) and temperature (${latest.temperature.toFixed(1)}°C) are simultaneously exceeding warning thresholds. Cross-correlation coefficient is 0.87, which is above the 0.7 alarm trigger. Historical analysis shows that dual-threshold violations preceded 78% of unplanned failures in similar equipment profiles.`,
                action: 'Treat as high-priority. Dual sensor convergence demands immediate physical inspection.'
            });
        }

        // === HISTORICAL PATTERN ===
        reasoning.push({
            severity: status === 'Healthy' ? 'healthy' : 'info',
            category: 'Historical Pattern Matching',
            title: status === 'Healthy' ? 'No known failure patterns matched' : 'Partial pattern match found',
            detail: status === 'Healthy'
                ? `The AI model compared the current 14-day sensor trajectory against 1,247 historical failure signatures. No match exceeded the 60% similarity threshold (highest match: 23% — "spindle motor phase imbalance").`
                : `Current sensor trajectory shows a ${(55 + Math.random() * 30).toFixed(0)}% similarity to failure pattern #F-0847 ("progressive bearing cage wear"), documented across 12 machines in the fleet database. This pattern typically precedes failure by 24-72 hours.`,
            action: status === 'Healthy' ? 'Continue routine monitoring.' : 'Initiate pre-failure maintenance protocol.'
        });

        // Generate Maintenance Impact
        const plannedDowntime = 4; // hours
        const plannedCost = 1500; // $
        const unplannedDowntime = Math.floor(18 + Math.random() * 24); // 18-42 hours
        const hourlyDowntimeCost = 5000;
        const unplannedRepairCost = 12000;
        const unplannedTotalCost = (unplannedDowntime * hourlyDowntimeCost) + unplannedRepairCost;
        const savings = unplannedTotalCost - plannedCost;

        const impact = {
            planned_downtime: plannedDowntime,
            planned_cost: plannedCost,
            unexpected_downtime: unplannedDowntime,
            unexpected_cost: unplannedTotalCost,
            savings: savings
        };

        // Calculate Breakdown Factors
        const vibHealth = Math.max(0, Math.min(100, 100 - ((latest.vibration - 2.0) / 2.5) * 100));
        const tempHealth = Math.max(0, Math.min(100, 100 - ((latest.temperature - 45) / 30) * 100));
        const usageHealth = 60 + Math.random() * 30; // Random intense usage (60-90)
        const historyHealth = status === 'Healthy' ? 95 : 75 + Math.random() * 10;

        const breakdown = {
            vibration: Math.round(vibHealth),
            temperature: Math.round(tempHealth),
            usage: Math.round(usageHealth),
            history: Math.round(historyHealth)
        };

        setHealthData({
            health_score: healthScore,
            status: status,
            predicted_failure_hours: Math.floor(24 + Math.random() * 48), // Mock prediction
            failure_probability: Math.round(failProb),
            maintenance_required: status !== 'Healthy',
            ai_reasoning: reasoning,
            impact: impact,
            breakdown: breakdown
        });

        setLoading(false);

    }, []);

    if (loading) return <div className="p-8 text-white">Loading AI Models...</div>;

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const handleActionSubmit = (e) => {
        e.preventDefault();
        // Simulate API call to CMMS or Notification service
        setTimeout(() => {
            setToastMessage(`Success: ${activeAction === 'ticket' ? 'Maintenance Ticket Created' : 'Engineer Notified'}`);
            setActiveAction(null);
            setTimeout(() => setToastMessage(null), 3000);
        }, 800);
    };

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in z-50">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">{toastMessage}</span>
                </div>
            )}

            <div>
                <h2 className="text-3xl font-bold gradient-text">AI Predictive</h2>
                <p className="text-gray-400">AI-driven health monitoring and failure prediction</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-24 h-24 text-blue-500" />
                    </div>
                    <h3 className="text-gray-400 font-medium mb-2">System Health Score</h3>
                    <div className="flex items-end gap-2">
                        <span className={`text-5xl font-bold ${getHealthColor(healthData?.health_score)}`}>
                            {healthData?.health_score}%
                        </span>
                        <span className="text-gray-500 mb-1">/ 100</span>
                    </div>
                    <div className="mt-4 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${healthData?.health_score >= 80 ? 'bg-green-500' :
                                healthData?.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${healthData?.health_score}%` }}
                        />
                    </div>

                    {/* Expandable Breakdown */}
                    <div className="mt-auto pt-4 relative z-10">
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors outline-none"
                        >
                            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {showBreakdown ? "Hide Health Breakdown" : "View Health Breakdown"}
                        </button>

                        {showBreakdown && healthData?.breakdown && (
                            <div className="mt-4 space-y-3 border-t border-gray-700 pt-3 animate-fade-in text-sm">
                                <div>
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>Vibration Health</span>
                                        <span className={`font-semibold ${getHealthColor(healthData.breakdown.vibration)}`}>{healthData.breakdown.vibration}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${healthData.breakdown.vibration >= 80 ? 'bg-green-500' : healthData.breakdown.vibration >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${healthData.breakdown.vibration}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>Temperature Stability</span>
                                        <span className={`font-semibold ${getHealthColor(healthData.breakdown.temperature)}`}>{healthData.breakdown.temperature}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${healthData.breakdown.temperature >= 80 ? 'bg-green-500' : healthData.breakdown.temperature >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${healthData.breakdown.temperature}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>Usage Intensity</span>
                                        <span className={`font-semibold ${getHealthColor(healthData.breakdown.usage)}`}>{healthData.breakdown.usage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${healthData.breakdown.usage >= 80 ? 'bg-green-500' : healthData.breakdown.usage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${healthData.breakdown.usage}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-gray-400 mb-1">
                                        <span>Historical Reliability</span>
                                        <span className={`font-semibold ${getHealthColor(healthData.breakdown.history)}`}>{healthData.breakdown.history}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${healthData.breakdown.history >= 80 ? 'bg-green-500' : healthData.breakdown.history >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${healthData.breakdown.history}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prediction */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Failure Prediction</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">Estimated Time to Failure</p>
                                <p className="text-3xl font-bold text-white">
                                    {healthData?.predicted_failure_hours} <span className="text-lg font-normal text-gray-500">hours</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Failure Probability</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-bold ${healthData?.failure_probability >= 60 ? 'text-red-400' :
                                        healthData?.failure_probability >= 30 ? 'text-yellow-400' :
                                            'text-green-400'
                                        }`}>
                                        {healthData?.failure_probability}%
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                        ({healthData?.failure_probability >= 60 ? 'High Risk' : healthData?.failure_probability >= 30 ? 'Medium Risk' : 'Low Risk'})
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">AI-estimated risk</p>
                            </div>
                        </div>
                        <div className={`p-3 rounded-lg border ${healthData?.status === 'Healthy' ? 'bg-green-900/20 border-green-500/30 text-green-400' :
                            healthData?.status === 'Warning' ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' :
                                'bg-red-900/20 border-red-500/30 text-red-400'
                            }`}>
                            <div className="flex items-center gap-2 font-medium">
                                {healthData?.status === 'Healthy' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                Status: {healthData?.status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Wrench className="w-6 h-6 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">AI Recommendation</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-6">
                        {healthData?.maintenance_required ? (
                            "Immediate maintenance required. Vibration levels indicate potential bearing failure. Schedule downtime within 24 hours."
                        ) : (
                            "System operating within normal parameters. No immediate maintenance actions required. Next scheduled check in 48 hours."
                        )}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-auto">
                        <button
                            onClick={() => setActiveAction('ticket')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FileText className="w-4 h-4" /> Create Ticket
                        </button>
                        <button
                            onClick={() => setActiveAction('notify')}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Notify Engineer
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Reasoning Section */}
            <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" /> AI Reasoning Engine
                    <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-800 px-3 py-1 rounded-full">Multi-sensor deep analysis</span>
                </h3>
                <div className="space-y-4">
                    {healthData?.ai_reasoning?.map((point, idx) => {
                        const severityStyles = {
                            critical: { border: 'border-red-500/30', bg: 'bg-red-500/5', badge: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
                            warning: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500' },
                            healthy: { border: 'border-green-500/30', bg: 'bg-green-500/5', badge: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-500' },
                            info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-500' }
                        };
                        const s = severityStyles[point.severity] || severityStyles.info;
                        return (
                            <div key={idx} className={`${s.bg} border ${s.border} rounded-xl p-4 transition-all hover:border-opacity-60`}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0 mt-0.5`} />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{point.category}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase ${s.badge}`}>{point.severity}</span>
                                </div>
                                <h4 className="text-white font-semibold text-sm mb-1.5">{point.title}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed mb-3">{point.detail}</p>
                                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                                    <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="text-xs text-blue-300 font-medium">{point.action}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Maintenance Impact Estimate */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" /> Business Impact Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Planned Maintenance */}
                    <div className="bg-gray-900/50 p-5 rounded-lg border border-green-500/30">
                        <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> If Maintained Now (Planned)
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                <span className="text-gray-400 text-sm">Estimated Downtime</span>
                                <span className="text-white font-bold">{healthData?.impact?.planned_downtime} hours</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Estimated Repair Cost</span>
                                <span className="text-white font-bold">${healthData?.impact?.planned_cost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Unexpected Failure */}
                    <div className="bg-gray-900/50 p-5 rounded-lg border border-red-500/30">
                        <h4 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> If Run to Failure (Unexpected)
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                                <span className="text-gray-400 text-sm">Estimated Downtime</span>
                                <span className="text-white font-bold">{healthData?.impact?.unexpected_downtime} hours</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Estimated Total Cost</span>
                                <span className="text-white font-bold">${healthData?.impact?.unexpected_cost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Savings Banner */}
                <div className="mt-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <span className="text-blue-300 font-medium block">Estimated Cost Savings</span>
                        <span className="text-xs text-blue-400/70">By acting proactively to avoid unexpected failure</span>
                    </div>
                    <span className="text-3xl font-bold text-blue-400 drop-shadow-md">
                        ${healthData?.impact?.savings.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Vibration Trend (14 Days)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="timestamp"
                                    type="number"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickCount={7}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 10]} />
                                <Tooltip
                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                                />
                                <ReferenceLine y={4.5} stroke="red" strokeDasharray="3 3" label="Critical Limit" />
                                <Line type="monotone" dataKey="vibration" stroke="#3B82F6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-red-400" /> Temperature Trend (14 Days)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="timestamp"
                                    type="number"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickCount={7}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                                <Tooltip
                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                                />
                                <ReferenceLine y={75} stroke="red" strokeDasharray="3 3" label="Critical Limit" />
                                <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {activeAction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {activeAction === 'ticket' ? <FileText className="w-5 h-5 text-blue-400" /> : <Send className="w-5 h-5 text-indigo-400" />}
                                {activeAction === 'ticket' ? 'Create Maintenance Ticket' : 'Notify Lead Engineer'}
                            </h3>
                            <button onClick={() => setActiveAction(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Target Machine ID</label>
                                <input type="text" readOnly value="CNC-Lathe-04" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none opacity-80 cursor-not-allowed" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Risk Level</label>
                                    <input type="text" readOnly value={healthData?.status} className={`w-full bg-gray-900 border rounded-lg px-3 py-2 font-medium focus:outline-none opacity-80 cursor-not-allowed ${healthData?.status === 'Critical' ? 'border-red-500/50 text-red-400' : 'border-yellow-500/50 text-yellow-400'}`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Est. Failure</label>
                                    <input type="text" readOnly value={`~${healthData?.predicted_failure_hours} hours`} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none opacity-80 cursor-not-allowed" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">AI Recommendation Log</label>
                                <textarea
                                    readOnly
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:outline-none min-h-[80px] text-sm opacity-80 cursor-not-allowed resize-none"
                                    value={healthData?.ai_reasoning.join('\n')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Additional Notes (Optional)</label>
                                <textarea
                                    placeholder="Add specific instructions or observations..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 min-h-[80px] text-sm resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setActiveAction(null)} className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors flex justify-center items-center gap-2 ${activeAction === 'ticket' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                    {activeAction === 'ticket' ? 'Submit Ticket' : 'Send Alert'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Maintenance;
