import React, { useEffect, useRef, useState } from 'react';
import { aiService } from '../services/aiService';

const VideoFeed = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [status, setStatus] = useState('Connecting...');
    const [detections, setDetections] = useState([]);
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'heatmap'
    // Heatmap grid: 20x20
    const [heatmapData, setHeatmapData] = useState(Array(20).fill().map(() => Array(20).fill(0)));
    const wsRef = useRef(null);

    // Subscribe to AI Service
    useEffect(() => {
        const unsubscribe = aiService.subscribe((inferenceResult) => {
            const newDetections = inferenceResult.defects;
            setDetections(newDetections);

            // Update Heatmap if we have detections
            if (newDetections.length > 0) {
                setHeatmapData(prev => {
                    const newData = prev.map(row => [...row]);
                    newDetections.forEach(d => {
                        const gridX = Math.floor((d.box.x + d.box.w / 2) * 20);
                        const gridY = Math.floor((d.box.y + d.box.h / 2) * 20);
                        if (gridX >= 0 && gridX < 20 && gridY >= 0 && gridY < 20) {
                            newData[gridY][gridX] += 1;
                        }
                    });
                    return newData;
                });
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket('ws://localhost:8000/ws/video');
            wsRef.current = ws;
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                setStatus('Connected');
            };

            ws.onmessage = (event) => {
                const blob = new Blob([event.data], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                setImageSrc(prev => {
                    if (prev) URL.revokeObjectURL(prev); // Clean up old URL
                    return url;
                });
            };

            ws.onclose = () => {
                setStatus('Disconnected. Reconnecting...');
                setTimeout(connect, 2000);
            };

            ws.onerror = (err) => {
                console.error("Video WS Error:", err);
                ws.close();
            };
        };

        connect();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return { border: 'border-red-500', bg: 'bg-red-500/20', text: 'bg-red-500' };
            case 'warning': return { border: 'border-yellow-500', bg: 'bg-yellow-500/20', text: 'bg-yellow-500' };
            case 'pass': return { border: 'border-green-500', bg: 'bg-green-500/20', text: 'bg-green-500' };
            default: return { border: 'border-blue-500', bg: 'bg-blue-500/20', text: 'bg-blue-500' };
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <div className="flex justify-between w-full mb-4 items-center">
                <h3 className="text-xl font-bold text-red-400">Live Inspection Feed</h3>
                <div className="flex items-center gap-4">
                    <div className="bg-gray-700/50 p-1 rounded-lg flex text-xs font-bold">
                        <button
                            onClick={() => setViewMode('live')}
                            className={`px-3 py-1 rounded transition-colors ${viewMode === 'live' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Live View
                        </button>
                        <button
                            onClick={() => setViewMode('heatmap')}
                            className={`px-3 py-1 rounded transition-colors ${viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Defect Heatmap
                        </button>
                    </div>

                    {viewMode === 'live' && (
                        <div className="flex gap-2 text-xs">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Critical</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Review</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Pass</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative w-full aspect-video bg-black rounded overflow-hidden flex items-center justify-center border-2 border-gray-700">
                {imageSrc ? (
                    <img src={imageSrc} alt="Live Feed" className="w-full h-full object-contain" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 animate-pulse">
                        <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        <span>{status}</span>
                    </div>
                )}

                {/* Heatmap Layer */}
                {viewMode === 'heatmap' && (
                    <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] opacity-70 pointer-events-none">
                        {heatmapData.map((row, y) =>
                            row.map((count, x) => {
                                if (count === 0) return <div key={`${x}-${y}`} />;
                                const intensity = Math.min(count / 10, 1); // Cap at 10 detections
                                return (
                                    <div
                                        key={`${x}-${y}`}
                                        className="transition-all duration-500"
                                        style={{
                                            backgroundColor: `rgba(255, ${255 * (1 - intensity)}, 0, ${intensity * 0.6})`,
                                            boxShadow: `0 0 10px rgba(255, 0, 0, ${intensity})`
                                        }}
                                    />
                                );
                            })
                        )}
                        <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-xs border border-red-500 font-mono tracking-wider animate-pulse">
                            SIMULATED DATA
                        </div>
                    </div>
                )}

                {/* AI Overlay Layer (Only in Live Mode) */}
                {viewMode === 'live' && detections.map((d) => {
                    const colors = getSeverityColor(d.severity);
                    return (
                        <div
                            key={d.id}
                            className={`absolute border-2 ${colors.border} ${colors.bg} transition-all duration-300 ease-in-out`}
                            style={{
                                left: `${d.box.x * 100}%`,
                                top: `${d.box.y * 100}%`,
                                width: `${d.box.w * 100}%`,
                                height: `${d.box.h * 100}%`,
                                pointerEvents: 'none' // Let clicks pass through
                            }}
                        >
                            <div className={`absolute -top-7 left-0 px-2 py-1 text-xs font-bold text-white rounded shadow-sm ${colors.text} whitespace-nowrap`}>
                                {d.label} • {(d.confidence * 100).toFixed(0)}%
                            </div>
                        </div>
                    );
                })}

                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white backdrop-blur-sm border border-white/10">
                    {viewMode === 'live' ? `AI Vision Active • ${detections.length} Objects` : 'Heatmap Analysis Mode'}
                </div>
            </div>
        </div>
    );
};

export default VideoFeed;
