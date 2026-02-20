import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Generate realistic simulated data
    // Source: Simulated internally for demo purposes
    useEffect(() => {
        const generateMockAnalytics = () => {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weeklyTrend = days.map(day => {
                // Generate inspections between 1200 and 2000 per day
                const total = Math.floor(1200 + Math.random() * 800);

                // Simulate a realistic low failure rate between 2% and 6%
                const failRate = 0.02 + Math.random() * 0.04;

                const fail = Math.floor(total * failRate);
                const pass = total - fail;
                return { date: day, pass, fail, total };
            });

            // Aggregate totals from weekly trend
            const totalInspections = weeklyTrend.reduce((acc, curr) => acc + curr.total, 0);
            const totalFailures = weeklyTrend.reduce((acc, curr) => acc + curr.fail, 0);

            // Calculate pass rate dynamically
            const passRate = ((1 - (totalFailures / totalInspections)) * 100).toFixed(1);

            // Distribute failures by defect type logic (Simulated Proportions)
            const remaining = totalFailures;
            const scratch = Math.floor(remaining * 0.35);
            const dent = Math.floor(remaining * 0.25);
            const crack = Math.floor(remaining * 0.20);
            const misalignment = Math.floor(remaining * 0.10);
            const stain = remaining - (scratch + dent + crack + misalignment); // Remaining ~10%

            const distribution = [
                { name: 'Scratch', value: scratch },
                { name: 'Dent', value: dent },
                { name: 'Crack', value: crack },
                { name: 'Misalignment', value: misalignment },
                { name: 'Surface Stain', value: stain }
            ].filter(d => d.value > 0);

            // Root Cause Simulation
            const allCauses = [
                { id: 1, cause: 'High Vibration (Machine A)', impact: Math.floor(35 + Math.random() * 10), desc: 'Excessive vibration > 5mm/s detected during night shift operation.' },
                { id: 2, cause: 'Temperature Spike', impact: Math.floor(15 + Math.random() * 10), desc: 'Cooling system efficiency dropped below 80% between 2 AM - 4 AM.' },
                { id: 3, cause: 'Operator Fatigue', impact: Math.floor(10 + Math.random() * 8), desc: 'Increased error rate observed in manual handling post-break.' },
                { id: 4, cause: 'Raw Material Var.', impact: Math.floor(8 + Math.random() * 5), desc: 'Inconsistent tensile strength detected in Batch #402.' },
                { id: 5, cause: 'Sensor Drift', impact: Math.floor(5 + Math.random() * 3), desc: 'Proximity sensor readings showing gradual deviation.' }
            ];

            // Randomly pick top 3 based on random impact sort for demo variety
            const topCauses = allCauses.sort((a, b) => b.impact - a.impact).slice(0, 3);

            // Operational Metrics Simulation (Shift/Machine/Operator)
            const shiftData = [
                { name: 'Morning', defects: Math.floor(totalFailures * 0.25), total: Math.floor(totalInspections * 0.35) },
                { name: 'Evening', defects: Math.floor(totalFailures * 0.30), total: Math.floor(totalInspections * 0.35) },
                { name: 'Night', defects: Math.floor(totalFailures * 0.45), total: Math.floor(totalInspections * 0.30) }
            ].map(s => ({ ...s, rate: ((s.defects / s.total) * 100).toFixed(1) }));

            const machineData = [
                { name: 'Line A', defects: Math.floor(totalFailures * 0.20), total: Math.floor(totalInspections * 0.33) },
                { name: 'Line B', defects: Math.floor(totalFailures * 0.55), total: Math.floor(totalInspections * 0.33) }, // High defect rate
                { name: 'Line C', defects: Math.floor(totalFailures * 0.25), total: Math.floor(totalInspections * 0.34) }
            ].map(m => ({ ...m, rate: ((m.defects / m.total) * 100).toFixed(1) }));

            const operatorData = [
                { id: 'OP-101', name: 'John D.', defects: 12, risk: 'Low' },
                { id: 'OP-104', name: 'Sarah M.', defects: 45, risk: 'High' }, // High risk
                { id: 'OP-112', name: 'Mike R.', defects: 18, risk: 'Medium' },
                { id: 'OP-089', name: 'Emma W.', defects: 8, risk: 'Low' },
                { id: 'OP-202', name: 'David L.', defects: 32, risk: 'Medium' }
            ].sort((a, b) => b.defects - a.defects);

            return {
                kpi: {
                    total_inspections: totalInspections.toLocaleString(),
                    pass_rate: passRate,
                    fail_count: totalFailures.toLocaleString()
                },
                weekly_trend: weeklyTrend,
                defect_distribution: distribution,
                root_causes: topCauses,
                operational: { shift: shiftData, machine: machineData, operator: operatorData }
            };
        };

        // Simulate network delay for loading state
        const timer = setTimeout(() => {
            const mockData = generateMockAnalytics();
            setData(mockData);
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    if (loading) return <div className="text-white p-8 animate-pulse">Analyzing manufacturing data...</div>;
    if (!data) return <div className="text-white p-8">Failed to load data</div>;

    const COLORS = ['#0891b2', '#2563eb', '#7c3aed', '#db2777', '#dc2626'];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
                <p className="text-gray-400">Insights and trends from manufacturing data</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-blue-500/50 transition-colors">
                    <div className="p-4 bg-blue-900/30 rounded-full text-blue-400">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Total Inspections</p>
                        <p className="text-3xl font-bold text-white">{data.kpi.total_inspections}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-green-500/50 transition-colors">
                    <div className="p-4 bg-green-900/30 rounded-full text-green-400">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Pass Rate</p>
                        <p className="text-3xl font-bold text-white">{data.kpi.pass_rate}%</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-red-500/50 transition-colors">
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="date" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
                                />
                                <Legend />
                                <Bar dataKey="pass" name="Passed" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="fail" name="Failed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Defect Distribution Chart */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" /> Defect Distribution
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center relative">
                        {data.defect_distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.defect_distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80} // Increased for donut look
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.defect_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        payload={
                                            data.defect_distribution.map((item, index) => ({
                                                id: item.name,
                                                type: "square",
                                                value: `${item.name} (${((item.value / data.kpi.fail_count.replace(/,/g, '')) * 100).toFixed(0)}%)`,
                                                color: COLORS[index % COLORS.length]
                                            }))
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-500">No defect data available</div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-32">
                            <span className="text-3xl font-bold text-white">{data.kpi.fail_count}</span>
                            <span className="text-xs text-gray-500 uppercase">Defects</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Insights Section (New) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Shift Performance */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Defect Rate by Shift</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operational.shift} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9CA3AF" unit="%" />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={60} />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="rate" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {data.operational.shift.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.rate > 5 ? '#EF4444' : '#3B82F6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Machine Performance */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Defect Rate by Line</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.operational.machine}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#fff" />
                                <YAxis stroke="#9CA3AF" unit="%" />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="rate" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                    {data.operational.machine.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.rate > 4 ? '#EF4444' : '#10B981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Operator Risk Analysis */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">Operator Risk Analysis</h3>
                    <div className="space-y-3">
                        {data.operational.operator.map((op) => (
                            <div key={op.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${op.risk === 'High' ? 'bg-red-500' : op.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{op.name}</div>
                                        <div className="text-xs text-gray-500">{op.id}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-white">{op.defects} Defects</div>
                                    <div className={`text-xs font-bold ${op.risk === 'High' ? 'text-red-400' : op.risk === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {op.risk} Risk
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Root Cause Analysis Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" /> Top Root Causes (AI Analysis)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.root_causes.map((rc, idx) => (
                        <div key={rc.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-900 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-mono border border-gray-600">
                                        #{idx + 1}
                                    </span>
                                    {rc.cause}
                                </span>
                                <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded border border-red-900/50">
                                    {rc.impact}% Impact
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {rc.desc}
                            </p>
                            <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-600 to-red-600 rounded-full"
                                    style={{ width: `${rc.impact}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
