/**
 * Analytics Service
 * 
 * Handles data aggregation and simulation for the Analytics Dashboard.
 * Designed to separate data logic from visualization components.
 * 
 * Future Integration:
 * - Replace mock generation with API calls to backend aggregation endpoints.
 * - Use WebSocket for real-time updates if needed for "Live Operational Metrics".
 */

class AnalyticsService {
    constructor() {
        this.baseUrl = 'http://localhost:8000/api/v1/analytics'; // Placeholder for real backend
    }

    /**
     * Fetches unified analytics data.
     * Currently returns a simulated promise.
     * 
     * @returns {Promise<AnalyticsData>}
     */
    async fetchAnalyticsData() {
        // In production, this would be: await fetch(this.baseUrl).then(res => res.json());
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this._generateMockData());
            }, 800); // Simulate network latency
        });
    }

    /**
     * Generates realistic mock data for demonstration.
     * @private
     */
    _generateMockData() {
        // 1. Weekly Trends Logic
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyTrend = days.map(day => {
            const total = Math.floor(1200 + Math.random() * 800);
            const failRate = 0.02 + Math.random() * 0.04; // 2-6% failure rate
            const fail = Math.floor(total * failRate);
            const pass = total - fail;
            return { date: day, pass, fail, total };
        });

        // 2. Aggregations
        const totalInspections = weeklyTrend.reduce((acc, curr) => acc + curr.total, 0);
        const totalFailures = weeklyTrend.reduce((acc, curr) => acc + curr.fail, 0);
        const passRate = ((1 - (totalFailures / totalInspections)) * 100).toFixed(1);

        // 3. Defect Distribution
        const remaining = totalFailures;
        const scratch = Math.floor(remaining * 0.35);
        const dent = Math.floor(remaining * 0.25);
        const crack = Math.floor(remaining * 0.20);
        const misalignment = Math.floor(remaining * 0.10);
        const stain = remaining - (scratch + dent + crack + misalignment);

        const distribution = [
            { name: 'Scratch', value: scratch },
            { name: 'Dent', value: dent },
            { name: 'Crack', value: crack },
            { name: 'Misalignment', value: misalignment },
            { name: 'Surface Stain', value: stain }
        ].filter(d => d.value > 0);

        // 4. Root Cause Analysis (AI Simulation)
        const allCauses = [
            { id: 1, cause: 'High Vibration (Machine A)', impact: Math.floor(35 + Math.random() * 10), desc: 'Excessive vibration > 5mm/s detected during night shift operation.' },
            { id: 2, cause: 'Temperature Spike', impact: Math.floor(15 + Math.random() * 10), desc: 'Cooling system efficiency dropped below 80% between 2 AM - 4 AM.' },
            { id: 3, cause: 'Operator Fatigue', impact: Math.floor(10 + Math.random() * 8), desc: 'Increased error rate observed in manual handling post-break.' },
            { id: 4, cause: 'Raw Material Var.', impact: Math.floor(8 + Math.random() * 5), desc: 'Inconsistent tensile strength detected in Batch #402.' },
            { id: 5, cause: 'Sensor Drift', impact: Math.floor(5 + Math.random() * 3), desc: 'Proximity sensor readings showing gradual deviation.' }
        ];
        const topCauses = allCauses.sort((a, b) => b.impact - a.impact).slice(0, 3);

        // 5. Operational Metrics (Shift/Machine/Operator)
        const shiftData = [
            { name: 'Morning', defects: Math.floor(totalFailures * 0.25), total: Math.floor(totalInspections * 0.35) },
            { name: 'Evening', defects: Math.floor(totalFailures * 0.30), total: Math.floor(totalInspections * 0.35) },
            { name: 'Night', defects: Math.floor(totalFailures * 0.45), total: Math.floor(totalInspections * 0.30) }
        ].map(s => ({ ...s, rate: ((s.defects / s.total) * 100).toFixed(1) }));

        const machineData = [
            { name: 'Line A', defects: Math.floor(totalFailures * 0.20), total: Math.floor(totalInspections * 0.33) },
            { name: 'Line B', defects: Math.floor(totalFailures * 0.55), total: Math.floor(totalInspections * 0.33) }, // Simulated bad machine
            { name: 'Line C', defects: Math.floor(totalFailures * 0.25), total: Math.floor(totalInspections * 0.34) }
        ].map(m => ({ ...m, rate: ((m.defects / m.total) * 100).toFixed(1) }));

        const operatorData = [
            { id: 'OP-101', name: 'John D.', defects: 12, risk: 'Low' },
            { id: 'OP-104', name: 'Sarah M.', defects: 45, risk: 'High' },
            { id: 'OP-112', name: 'Mike R.', defects: 18, risk: 'Medium' },
            { id: 'OP-089', name: 'Emma W.', defects: 8, risk: 'Low' },
            { id: 'OP-202', name: 'David L.', defects: 32, risk: 'Medium' }
        ].sort((a, b) => b.defects - a.defects);

        // 6. Sensor Correlation (Time-series)
        const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);
        const tempCorrelation = hours.map(h => {
            const isSpike = Math.random() > 0.7;
            const temp = isSpike ? Math.floor(65 + Math.random() * 20) : Math.floor(40 + Math.random() * 15);
            const defects = isSpike ? Math.floor(5 + Math.random() * 5) : Math.floor(Math.random() * 2);
            return { time: h, value: temp, defects };
        });

        const vibCorrelation = hours.map(h => {
            const isSpike = Math.random() > 0.7;
            const vib = isSpike ? (4.5 + Math.random() * 2.5).toFixed(1) : (1.0 + Math.random() * 1.5).toFixed(1);
            const defects = isSpike ? Math.floor(4 + Math.random() * 6) : Math.floor(Math.random() * 2);
            return { time: h, value: vib, defects };
        });

        // Unified Schema Return
        return {
            kpi: {
                total_inspections: totalInspections.toLocaleString(),
                pass_rate: passRate,
                fail_count: totalFailures.toLocaleString()
            },
            weekly_trend: weeklyTrend,
            defect_distribution: distribution,
            root_causes: topCauses,
            operational: { shift: shiftData, machine: machineData, operator: operatorData },
            sensor_correlation: { temperature: tempCorrelation, vibration: vibCorrelation }
        };
    }
}

export const analyticsService = new AnalyticsService();
