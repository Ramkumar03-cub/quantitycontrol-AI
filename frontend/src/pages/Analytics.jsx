import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/analytics/stats')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load analytics", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-white p-8">Loading analytics...</div>;
    if (!data) return <div className="text-white p-8">Failed to load data</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
                <p className="text-gray-400">Insights and trends from manufacturing data</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
                    <div className="p-4 bg-blue-900/30 rounded-full text-blue-400">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Total Inspections</p>
                        <p className="text-3xl font-bold text-white">{data.kpi.total_inspections}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
                    <div className="p-4 bg-green-900/30 rounded-full text-green-400">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Pass Rate</p>
                        <p className="text-3xl font-bold text-white">{data.kpi.pass_rate}%</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
                    <div className="p-4 bg-red-900/30 rounded-full text-red-400">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Total Failures</p>
                        <p className="text-3xl font-bold text-white">{data.kpi.fail_count}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend Chart */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" /> Weekly Inspection Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weekly_trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="pass" name="Passed" stackId="a" fill="#10B981" />
                                <Bar dataKey="fail" name="Failed" stackId="a" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Defect Distribution Chart */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" /> Defect Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {data.defect_distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.defect_distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {data.defect_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-500">No defect data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
