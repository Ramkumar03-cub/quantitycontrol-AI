import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Download, Search, ChevronLeft, ChevronRight, X, Eye, CheckCircle, XCircle, Activity, FileText } from 'lucide-react';

const History = () => {
    const [historyData, setHistoryData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetch('http://localhost:8000/history')
            .then(res => res.json())
            .then(data => setHistoryData(data))
            .catch(err => console.error("Failed to load history", err));
    }, []);

    const handleExport = () => {
        window.open('http://localhost:8000/history/export', '_blank');
    };

    const handleDownloadReport = () => {
        window.open('http://localhost:8000/reports/generate', '_blank');
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        return historyData.filter(item => {
            const matchesSearch =
                (item.id?.toString().includes(searchTerm)) ||
                (item.final_decision_reason?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.status?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [historyData, searchTerm, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Inspection History</h2>
                    <p className="text-gray-400">View and analyze past inspection records</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search ID, Reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none w-full md:w-64"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                    </select>

                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        PDF Report
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">ID</th>
                                <th className="px-6 py-4 font-medium">Time</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Reason</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No records found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr key={item.id || item.timestamp} className="hover:bg-gray-700/30 transition-colors text-gray-300">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-500">#{item.id}</td>
                                        <td className="px-6 py-4">
                                            {new Date(item.timestamp * 1000).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'FAIL'
                                                ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                                                : 'bg-green-900/30 text-green-400 border border-green-500/30'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.final_decision_reason || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="p-2 hover:bg-gray-700 rounded-full text-blue-400 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                Inspection Details <span className="text-gray-500 text-base font-normal">#{selectedItem.id}</span>
                            </h3>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Header */}
                            <div className={`p-4 rounded-lg border flex items-center gap-4 ${selectedItem.status === 'PASS'
                                ? 'bg-green-900/20 border-green-500/30'
                                : 'bg-red-900/20 border-red-500/30'
                                }`}>
                                <div className={`p-3 rounded-full ${selectedItem.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {selectedItem.status === 'PASS' ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 uppercase font-bold">Inspection Result</p>
                                    <p className={`text-2xl font-bold ${selectedItem.status === 'PASS' ? 'text-green-400' : 'text-red-400'
                                        }`}>{selectedItem.status}</p>
                                    <p className="text-gray-300 mt-1">{selectedItem.final_decision_reason}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Sensor Data */}
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Sensor Readings
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        {Object.entries(selectedItem.sensor_data || {}).map(([key, value]) => (
                                            <div key={key} className="flex justify-between border-b border-gray-800 pb-1 last:border-0">
                                                <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                                                <span className="text-white font-mono">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Vision Data */}
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> Vision Analysis
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        {selectedItem.vision_defects && selectedItem.vision_defects.length > 0 ? (
                                            selectedItem.vision_defects.map((defect, idx) => (
                                                <div key={idx} className="bg-red-900/20 p-2 rounded border border-red-900/30">
                                                    <div className="flex justify-between text-red-300 font-medium">
                                                        <span>{defect.label}</span>
                                                        <span>{(defect.confidence * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">No visual defects detected.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Raw Data Dump (Collapsible or just printed) */}
                            <div>
                                <h4 className="text-gray-500 text-xs uppercase font-bold mb-2">Raw Data</h4>
                                <pre className="bg-black/50 p-4 rounded-lg text-xs text-gray-400 font-mono overflow-x-auto">
                                    {JSON.stringify(selectedItem, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
