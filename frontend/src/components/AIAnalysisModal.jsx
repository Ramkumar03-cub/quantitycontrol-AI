import React from 'react';
import { X, Brain, Lightbulb, Activity } from 'lucide-react';

const AIAnalysisModal = ({ isOpen, onClose, analysis, defectType }) => {
    if (!isOpen || !analysis) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-500/30">
                            <Brain className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">AI Root Cause Analysis</h3>
                            <p className="text-sm text-gray-400">Analyzing: {defectType}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Confidence Score */}
                    <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <span className="text-gray-300 font-medium">Analysis Confidence</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    style={{ width: `${analysis.confidence * 100}%` }}
                                />
                            </div>
                            <span className="text-purple-400 font-bold">{(analysis.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    {/* Root Cause */}
                    <div className="space-y-2">
                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Root Cause
                        </h4>
                        <p className="text-gray-200 bg-red-900/10 border border-red-900/30 p-4 rounded-lg">
                            {analysis.root_cause}
                        </p>
                    </div>

                    {/* Recommendation */}
                    <div className="space-y-2">
                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Recommendation
                        </h4>
                        <p className="text-gray-200 bg-green-900/10 border border-green-900/30 p-4 rounded-lg">
                            {analysis.recommendation}
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 bg-gray-900/30 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisModal;
