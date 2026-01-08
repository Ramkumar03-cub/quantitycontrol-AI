import React, { useEffect, useRef, useState } from 'react';

const VideoFeed = () => {
    const [imageSrc, setImageSrc] = useState(null);
    const [status, setStatus] = useState('Connecting...');
    const wsRef = useRef(null);

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

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 w-full text-left text-red-400">Live Inspection Feed</h3>
            <div className="relative w-full aspect-video bg-black rounded overflow-hidden flex items-center justify-center border-2 border-gray-700">
                {imageSrc ? (
                    <img src={imageSrc} alt="Live Feed" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-gray-500 animate-pulse">{status}</div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                    {status}
                </div>
            </div>
        </div>
    );
};

export default VideoFeed;
