import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        visionThreshold: 85,
        vibrationLimit: 2.5,
        temperatureLimit: 80,
        notifications: true,
        autoStop: false
    });

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">System Settings</h2>
                <p className="text-gray-400">Configure detection thresholds and system behavior</p>
            </div>

            <div className="grid gap-6">
                {/* Vision Settings */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">
                        Computer Vision
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-gray-300">Confidence Threshold</label>
                                <span className="text-blue-400 font-mono">{settings.visionThreshold}%</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="99"
                                value={settings.visionThreshold}
                                onChange={(e) => handleChange('visionThreshold', e.target.value)}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Minimum confidence score required to flag a defect
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sensor Settings */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-purple-400 border-b border-gray-700 pb-2">
                        Sensor Thresholds
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-300 mb-2">Vibration Limit (g)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={settings.vibrationLimit}
                                onChange={(e) => handleChange('vibrationLimit', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Temperature Limit (°C)</label>
                            <input
                                type="number"
                                value={settings.temperatureLimit}
                                onChange={(e) => handleChange('temperatureLimit', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* System Actions */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-green-400 border-b border-gray-700 pb-2">
                        System Behavior
                    </h3>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <span className="text-gray-300">Enable Email Notifications</span>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.notifications ? 'bg-green-500' : 'bg-gray-600'}`}
                                onClick={() => handleChange('notifications', !settings.notifications)}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <span className="text-gray-300">Auto-Stop Conveyor on Critical Defect</span>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoStop ? 'bg-green-500' : 'bg-gray-600'}`}
                                onClick={() => handleChange('autoStop', !settings.autoStop)}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${settings.autoStop ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Reset Defaults
                </button>
                <button
                    onClick={() => {
                        // Here we would also save other settings...
                        alert("Settings Saved!");
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default Settings;
