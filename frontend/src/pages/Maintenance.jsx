import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, Clock, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Maintenance = () => {
    const [healthData, setHealthData] = useState(null);
    const [sensorHistory, setSensorHistory] = useState([]);
    const [loading, setLoading] = useState(true);

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
        if (latest.vibration > 4.5 || latest.temperature > 75) {
            healthScore -= 40;
            status = 'Critical';
            recommendation = 'Immediate maintenance required. Bearing degradation likely.';
        } else if (latest.vibration > 3.5 || latest.temperature > 65) {
            healthScore -= 20;
            status = 'Warning';
            recommendation = 'Schedule inspection. Vibration levels trending upwards.';
        }

        setHealthData({
            health_score: healthScore,
            status: status,
            predicted_failure_hours: Math.floor(24 + Math.random() * 48), // Mock prediction
            maintenance_required: status !== 'Healthy'
        });

        setLoading(false);

    }, []);

    if (loading) return <div className="p-8 text-white">Loading AI Models...</div>;

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Predictive Maintenance</h2>
                <p className="text-gray-400">AI-driven health monitoring and failure prediction</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative overflow-hidden">
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
                </div>

                {/* Prediction */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Failure Prediction</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-gray-400 text-sm">Estimated Time to Failure</p>
                            <p className="text-3xl font-bold text-white">
                                {healthData?.predicted_failure_hours} <span className="text-lg font-normal text-gray-500">hours</span>
                            </p>
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
                    <p className="text-gray-300 leading-relaxed">
                        {healthData?.maintenance_required ? (
                            "Immediate maintenance required. Vibration levels indicate potential bearing failure. Schedule downtime within 24 hours."
                        ) : (
                            "System operating within normal parameters. No immediate maintenance actions required. Next scheduled check in 48 hours."
                        )}
                    </p>
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
        </div>
    );
};

export default Maintenance;
