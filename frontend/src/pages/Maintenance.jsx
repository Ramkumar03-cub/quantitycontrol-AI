import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, Clock, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Maintenance = () => {
    const [healthData, setHealthData] = useState(null);
    const [sensorHistory, setSensorHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current health
                const healthRes = await fetch('http://localhost:8000/ai/health');
                const health = await healthRes.json();
                setHealthData(health);

                // Fetch history for charts (reuse history endpoint for now)
                const historyRes = await fetch('http://localhost:8000/history');
                const history = await historyRes.json();

                // Process history for charts (last 50 points)
                const processedHistory = history.slice(0, 50).reverse().map(item => ({
                    time: new Date(item.timestamp * 1000).toLocaleTimeString(),
                    vibration: item.sensor_data?.vibration || 0,
                    temperature: item.sensor_data?.temperature || 0,
                    pressure: item.sensor_data?.pressure || 0
                }));
                setSensorHistory(processedHistory);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load maintenance data", err);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
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
                        <Activity className="w-5 h-5 text-blue-400" /> Vibration Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tick={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                                />
                                <ReferenceLine y={0.5} stroke="red" strokeDasharray="3 3" label="Limit" />
                                <Line type="monotone" dataKey="vibration" stroke="#3B82F6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Thermometer className="w-5 h-5 text-red-400" /> Temperature Trend
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tick={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#fff' }}
                                />
                                <ReferenceLine y={80} stroke="red" strokeDasharray="3 3" label="Limit" />
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
