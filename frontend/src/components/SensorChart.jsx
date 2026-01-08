import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SensorChart = ({ data }) => {
    // We keep a history of the last 50 data points
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (data) {
            setHistory(prev => {
                const newHistory = [...prev, { ...data, time: new Date(data.timestamp * 1000).toLocaleTimeString() }];
                if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
                return newHistory;
            });
        }
    }, [data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-blue-400">Temperature (°C)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="time" stroke="#888" tick={false} />
                            <YAxis domain={[0, 150]} stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Line type="monotone" dataKey="temperature" stroke="#3b82f6" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-2xl font-mono">{data?.temperature?.toFixed(1) || '--'} °C</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-green-400">Pressure (PSI)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="time" stroke="#888" tick={false} />
                            <YAxis domain={[0, 200]} stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Line type="monotone" dataKey="pressure" stroke="#22c55e" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-2xl font-mono">{data?.pressure?.toFixed(1) || '--'} PSI</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold mb-2 text-purple-400">Vibration (mm/s)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="time" stroke="#888" tick={false} />
                            <YAxis domain={[0, 10]} stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Line type="monotone" dataKey="vibration" stroke="#a855f7" dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-2xl font-mono">{data?.vibration?.toFixed(3) || '--'} mm/s</div>
            </div>
        </div>
    );
};

export default SensorChart;
