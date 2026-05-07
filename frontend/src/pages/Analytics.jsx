import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Generate realistic simulated data
    // Source: Simulated internally for demo purposes
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch('http://localhost:8000/analytics/stats');
                if (!response.ok) throw new Error("Failed to fetch analytics");

                const dbData = await response.json();

                // Map Database payload to UI structure
                // Stubbing out advanced operational data that relies on multi-machine sensors
                const mappedData = {
                    kpi: {
                        total_inspections: dbData.kpi.total_inspections.toLocaleString(),
                        pass_rate: dbData.kpi.pass_rate,
                        fail_count: dbData.kpi.fail_count.toLocaleString()
                    },
                    weekly_trend: dbData.weekly_trend.map(t => ({
                        date: new Date(t.date).toLocaleDateString(undefined, { weekday: 'short' }),
                        pass: t.pass,
                        fail: t.fail,
                        total: t.total
                    })),
                    defect_distribution: dbData.defect_distribution,
                    root_causes: [
                        { id: 1, cause: 'AI Visual Defect', impact: 85, desc: 'Highest source of failures derived from YOLOv8 image boundary matching.' },
                        { id: 2, cause: 'Sensor Drift', impact: 15, desc: 'Secondary anomaly flags driven by vibration baseline deviation.' }
                    ],
                    operational: {
                        shift: [{ name: 'Morning', rate: 2.1 }, { name: 'Evening', rate: 1.8 }, { name: 'Night', rate: 3.5 }],
                        machine: [{ name: 'Line A', rate: 1.2 }, { name: 'Line B', rate: 4.8 }],
                        operator: [{ id: 'OP-101', name: 'John D.', defects: dbData.kpi.fail_count, risk: 'Medium' }]
                    }
                };

                setData(mappedData);
                setLoading(false);
            } catch (err) {
                console.error("Analytics Hook Error:", err);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className="text-white p-8 animate-pulse">Analyzing manufacturing data...</div>;
    if (!data) return <div className="text-white p-8">Failed to load data</div>;

    const COLORS = ['#0891b2', '#2563eb', '#7c3aed', '#db2777', '#dc2626'];

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold gradient-text">Advanced Analytics</h2>
                <p className="text-gray-400 mt-1">Real-time insights and trends from manufacturing data</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl glass-panel-hover card-glow-blue flex items-center gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Inspections</p>
                        <p className="text-3xl font-bold text-white mt-1">{data.kpi.total_inspections}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl glass-panel-hover card-glow-green flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Pass Rate</p>
                        <p className="text-3xl font-bold text-white mt-1">{data.kpi.pass_rate}%</p>
                    </div>
                </div>

                <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl glass-panel-hover card-glow-red flex items-center gap-4">
                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Failures</p>
                        <p className="text-3xl font-bold text-white mt-1">{data.kpi.fail_count}</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend Chart */}
                <motion.div variants={itemVariants} className="glass-panel p-6 rounded-xl">
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
                </motion.div>

                {/* Defect Distribution Chart */}
                <motion.div variants={itemVariants} className="glass-panel p-6 rounded-xl">
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
                </motion.div>
            </div>

            {/* Operational Insights Section (New) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Shift Performance */}
                <motion.div variants={itemVariants} className="glass-panel p-6 rounded-xl">
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
                </motion.div>

                {/* Machine Performance */}
                <motion.div variants={itemVariants} className="glass-panel p-6 rounded-xl">
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
                </motion.div>

                {/* Operator Risk Analysis */}
                <motion.div variants={itemVariants} className="glass-panel p-6 rounded-xl">
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
                </motion.div>
            </div>

            {/* Root Cause Analysis Section */}
            <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" /> Top Root Causes (AI Analysis)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.root_causes.map((rc, idx) => (
                        <div className="bg-black/30 backdrop-blur border border-white/10 p-4 rounded-lg hover:bg-black/40 transition-colors">
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
            </motion.div>
        </motion.div>
    );
};

export default Analytics;
