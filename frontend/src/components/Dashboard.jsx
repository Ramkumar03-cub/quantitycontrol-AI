import React, { useEffect, useState, useRef } from 'react';
import SensorChart from './SensorChart';
import VideoFeed from './VideoFeed';
import AIAnalysisModal from './AIAnalysisModal';
import { AlertTriangle, CheckCircle, Activity, ThumbsUp, ThumbsDown, XCircle, Brain, Zap, ChevronDown } from 'lucide-react';
import { aiService } from '../services/aiService';

const Dashboard = () => {
    const [inspectionResult, setInspectionResult] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Manual Inspection State
    const [inspectionMode, setInspectionMode] = useState('live'); // 'live' or 'upload'
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Model Selection State
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState('Generic');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const wsRef = useRef(null);

    // AI Service - Vision Alerts
    useEffect(() => {
        const unsubscribe = aiService.subscribe((inferenceResult) => {
            const newAlerts = inferenceResult.defects.map(defect => ({
                id: defect.id,
                type: defect.label,
                label: defect.label,
                severity: defect.severity,
                confidence: defect.confidence,
                timestamp: inferenceResult.timestamp / 1000,
                source: 'Vision AI',
                suggestedAction: defect.severity === 'critical' ? 'Stop Line & Inspect' : 'Review Manually',
                details: `Automated detection of ${defect.label.toLowerCase()} with high confidence. Immediate attention suggested based on severity level.`,
                box: defect.box
            }));

            if (newAlerts.length > 0) {
                setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let ws = null;
        let reconnectTimeout = null;
        let isMounted = true;

        // Fetch available profiles
        fetch('http://localhost:8000/dataset/profiles')
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    setProfiles(data.profiles);
                    // Optionally fetch current active profile if API supported it
                }
            })
            .catch(err => console.error("Failed to load profiles", err));

        const connect = () => {
            if (!isMounted) return;

            ws = new WebSocket('ws://localhost:8000/ws/sensors');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("Connected to sensor stream");
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const data = JSON.parse(event.data);
                    setInspectionResult(data);

                    // Process sensor anomalies if any (from backend)
                    if (data.sensor_anomalies) {
                        const sensorAlerts = data.sensor_anomalies.map(a => ({
                            ...a,
                            source: 'Sensor',
                            timestamp: data.timestamp,
                            id: Date.now() + Math.random()
                        }));
                        setAlerts(prev => [...sensorAlerts, ...prev].slice(0, 50));
                    }

                } catch (e) {
                    console.error("Error parsing sensor data", e);
                }
            };

            ws.onclose = () => {
                console.log("Sensor stream disconnected, reconnecting...");
                if (isMounted) {
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };

            ws.onerror = (err) => {
                console.error("WebSocket error:", err);
                ws.close();
            };
        };

        connect();

        // Poll for System Health
        const healthInterval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:8000/ai/health');
                if (res.ok) {
                    const data = await res.json();
                    setSystemHealth(data);
                }
            } catch (e) {
                console.error("Failed to fetch health", e);
            }
        }, 5000);

        return () => {
            isMounted = false;
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            clearInterval(healthInterval);
        };
    }, []);

    const handleProfileChange = async (profile) => {
        setActiveProfile(profile);
        setIsProfileMenuOpen(false);
        try {
            await fetch('http://localhost:8000/dataset/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_name: profile })
            });
            // Show a temporary toast or notification here if needed
            console.log(`Switched to model: ${profile}`);
        } catch (e) {
            console.error("Failed to load dataset", e);
        }
    };

    const handleFeedback = async (alertId, isCorrect) => {
        console.log(`Feedback for ${alertId}: ${isCorrect ? 'Correct' : 'False Positive'}`);
        try {
            await fetch('http://localhost:8000/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, isCorrect, timestamp: Date.now() })
            });
        } catch (e) {
            console.error("Failed to send feedback", e);
        }
    };

    const handleAnalyze = async (alert) => {
        setSelectedAlert(alert);
        // Simulate analysis result for the demo if backend call fails or just use valid mock
        const mockAnalysis = {
            confidence: alert.confidence,
            root_cause: `Likely caused by ${alert.type.includes('Temp') ? 'thermal stress' : 'mechanical vibration'} during the casting process.`,
            recommendation: alert.suggestedAction || "Inspect line 3 immediately."
        };

        try {
            // Try real backend
            const res = await fetch('http://localhost:8000/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defect_type: alert.type || alert.label,
                    sensor_data: inspectionResult?.sensor_data || {}
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAnalysisResult(data);
            } else {
                setAnalysisResult(mockAnalysis);
            }
        } catch (e) {
            console.error("Failed to analyze, utilizing mock", e);
            setAnalysisResult(mockAnalysis);
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/inspect/image', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setUploadedImage(data.image);
            setUploadResult(data);

            // Add to alerts if defects found
            if (data.detections && data.detections.length > 0) {
                const newAlerts = data.detections.map(d => ({
                    ...d,
                    source: 'Manual Upload',
                    timestamp: Date.now() / 1000,
                    id: Date.now() + Math.random(),
                    suggestedAction: 'Review Uploaded Item',
                    severity: 'warning', // Default for upload
                    details: 'Defect detected in manually uploaded image.'
                }));
                setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
            }
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const getAlertStyles = (severity) => {
        const base = "p-4 border rounded-lg shadow-sm transition-all hover:bg-opacity-20 animate-in slide-in-from-right";
        switch (severity?.toLowerCase()) {
            case 'critical':
                return {
                    wrapper: `${base} bg-red-900/10 border-red-500/50 hover:bg-red-900/20`,
                    icon: "text-red-500",
                    title: "text-red-400",
                    badge: "bg-red-500/20 text-red-300 border-red-500/30"
                };
            case 'warning':
                return {
                    wrapper: `${base} bg-yellow-900/10 border-yellow-500/50 hover:bg-yellow-900/20`,
                    icon: "text-yellow-500",
                    title: "text-yellow-400",
                    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                };
            case 'info':
            default:
                return {
                    wrapper: `${base} bg-blue-900/10 border-blue-500/50 hover:bg-blue-900/20`,
                    icon: "text-blue-400",
                    title: "text-blue-300",
                    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30"
                };
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        QC AI Monitor
                    </h1>
                    <p className="text-gray-400">Real-time Manufacturing Quality Control</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Inspection Mode Toggle */}
                    <div className="bg-gray-800 p-1 rounded-lg flex border border-gray-700">
                        <button
                            onClick={() => setInspectionMode('live')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${inspectionMode === 'live'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Live Feed
                        </button>
                        <button
                            onClick={() => setInspectionMode('upload')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${inspectionMode === 'upload'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Upload Image
                        </button>
                    </div>
                    {/* Model Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-white min-w-[160px] justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-blue-400" />
                                <span className="font-medium">{activeProfile}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-gray-700 text-xs text-gray-500 font-medium uppercase">
                                    Select Active Model
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {profiles.map(profile => (
                                        <button
                                            key={profile}
                                            onClick={() => handleProfileChange(profile)}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${activeProfile === profile ? 'text-blue-400 bg-blue-900/10' : 'text-gray-300'
                                                }`}
                                        >
                                            {profile}
                                            {activeProfile === profile && <CheckCircle className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* System Health Widget */}
                    {systemHealth && (
                        <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 ${systemHealth.status === 'Healthy' ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'
                            }`}>
                            <div className="text-right">
                                <div className={`text-xs uppercase font-bold ${systemHealth.status === 'Healthy' ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                    System Health
                                </div>
                                <div className="text-lg font-mono text-white">
                                    {systemHealth.health_score}%
                                </div>
                            </div>
                            <Activity className={`w-8 h-8 ${systemHealth.status === 'Healthy' ? 'text-green-500' : 'text-yellow-500'
                                }`} />
                        </div>
                    )}

                    {inspectionResult && (
                        <div className={`px-6 py-2 rounded-full font-bold text-xl flex items-center gap-2 ${inspectionResult.status === 'PASS'
                            ? 'bg-green-900/30 text-green-400 border border-green-500/50'
                            : 'bg-red-900/30 text-red-500 border border-red-500/50 animate-pulse'
                            }`}>
                            {inspectionResult.status === 'PASS' ? <CheckCircle /> : <XCircle />}
                            {inspectionResult.status}
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {inspectionMode === 'live' ? (
                        <>
                            <VideoFeed />
                            <SensorChart data={inspectionResult?.sensor_data} />
                        </>
                    ) : (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 min-h-[500px] flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-4">Manual Image Inspection</h3>

                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl bg-gray-900/50 relative overflow-hidden group">
                                {uploadedImage ? (
                                    <img src={uploadedImage} alt="Analyzed" className="max-h-[400px] object-contain" />
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Brain className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <p className="text-gray-400 mb-2">Upload an image to inspect</p>
                                        <p className="text-xs text-gray-600">Supports JPG, PNG</p>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {uploadResult && (
                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                        <p className="text-gray-500 text-xs uppercase">Detections</p>
                                        <p className="text-2xl font-bold text-white">{uploadResult.count}</p>
                                    </div>
                                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 col-span-2">
                                        <p className="text-gray-500 text-xs uppercase mb-2">Result Details</p>
                                        <div className="flex flex-wrap gap-2">
                                            {uploadResult.detections.length === 0 ? (
                                                <span className="text-green-400 text-sm flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> No Defects Found
                                                </span>
                                            ) : (
                                                uploadResult.detections.map((d, i) => (
                                                    <span key={i} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-sm border border-red-900/50">
                                                        {d.type} ({(d.confidence * 100).toFixed(0)}%)
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-[calc(100vh-200px)] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4 text-yellow-400 sticky top-0 bg-gray-800 pb-2 border-b border-gray-700 z-10">
                        Live Alerts
                    </h3>
                    <div className="space-y-4">
                        {alerts.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">No defects detected</div>
                        ) : (
                            alerts.map((alert) => {
                                const styles = getAlertStyles(alert.severity);
                                return (
                                    <div key={alert.id} className={styles.wrapper}>
                                        <div className="flex items-start gap-3 mb-2">
                                            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${styles.icon}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`font-bold text-lg ${styles.title}`}>
                                                        {alert.type || alert.label}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded border ${styles.badge} uppercase font-bold`}>
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 flex gap-3">
                                                    <span>Conf: <span className="text-white font-mono">{(alert.confidence * 100).toFixed(0)}%</span></span>
                                                    <span>{new Date(alert.timestamp * 1000).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Suggested Action */}
                                        <div className="bg-gray-900/50 p-2 rounded mb-3 border border-gray-700/50">
                                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Suggested Action</div>
                                            <div className="text-sm text-gray-200">{alert.suggestedAction || "Review Manually"}</div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAnalyze(alert)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors shadow-lg shadow-purple-900/20"
                                            >
                                                <Brain className="w-3 h-3" /> Detailed Analysis
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(alert.id, true)}
                                                className="px-3 py-2 text-xs bg-gray-700 hover:bg-green-900/40 text-gray-300 hover:text-green-400 rounded transition-colors border border-gray-600 hover:border-green-500/50"
                                                title="Mark as Correct"
                                            >
                                                <ThumbsUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleFeedback(alert.id, false)}
                                                className="px-3 py-2 text-xs bg-gray-700 hover:bg-red-900/40 text-gray-300 hover:text-red-400 rounded transition-colors border border-gray-600 hover:border-red-500/50"
                                                title="Mark as False Positive"
                                            >
                                                <ThumbsDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <AIAnalysisModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                analysis={analysisResult}
                defectType={selectedAlert?.type || selectedAlert?.label}
                details={selectedAlert?.details}
            />
        </div>
    );
};

export default Dashboard;
