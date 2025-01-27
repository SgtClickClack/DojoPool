import alertSystem from './alertSystem.js';

class TrendAnalysis {
    constructor() {
        this.trends = {
            loadTime: {
                data: [],
                maxSamples: 1000,
                baseline: null,
                anomalies: []
            },
            bandwidth: {
                data: [],
                maxSamples: 1000,
                baseline: null,
                anomalies: []
            },
            memory: {
                data: [],
                maxSamples: 1000,
                baseline: null,
                anomalies: []
            }
        };
        this.analysisInterval = 60000; // 1 minute
        this.init();
    }

    init() {
        this.bindEvents();
        this.startAnalysis();
    }

    bindEvents() {
        window.addEventListener('metricsUpdate', (event) => {
            const { type, data } = event.detail;
            this.addDataPoint(type, data);
        });
    }

    addDataPoint(type, data) {
        if (!this.trends[type]) return;

        const timestamp = Date.now();
        let value;

        switch (type) {
            case 'loadTime':
                value = data.duration;
                break;
            case 'bandwidth':
                value = data.current;
                break;
            case 'memory':
                value = (data.usage / data.limit) * 100; // percentage
                break;
            default:
                return;
        }

        this.trends[type].data.push({ timestamp, value });

        // Trim old data
        if (this.trends[type].data.length > this.trends[type].maxSamples) {
            this.trends[type].data.shift();
        }

        // Update baseline if needed
        if (!this.trends[type].baseline || this.shouldUpdateBaseline(type)) {
            this.updateBaseline(type);
        }
    }

    startAnalysis() {
        setInterval(() => {
            Object.keys(this.trends).forEach(type => {
                this.analyzeMetric(type);
            });
        }, this.analysisInterval);
    }

    analyzeMetric(type) {
        const trend = this.trends[type];
        if (trend.data.length < 10) return; // Need minimum samples

        const recentData = this.getRecentData(type, 5 * 60 * 1000); // Last 5 minutes
        const analysis = {
            mean: this.calculateMean(recentData),
            stdDev: this.calculateStdDev(recentData),
            trend: this.calculateTrendDirection(recentData),
            anomalies: this.detectAnomalies(type, recentData)
        };

        this.updateAnomalies(type, analysis.anomalies);
        this.notifySignificantChanges(type, analysis);

        window.dispatchEvent(new CustomEvent('trendUpdate', {
            detail: {
                type,
                analysis: {
                    ...analysis,
                    baseline: trend.baseline,
                    timeRange: {
                        start: recentData[0]?.timestamp,
                        end: recentData[recentData.length - 1]?.timestamp
                    }
                }
            }
        }));
    }

    getRecentData(type, timeRange) {
        const now = Date.now();
        return this.trends[type].data.filter(point =>
            now - point.timestamp <= timeRange
        );
    }

    calculateMean(data) {
        if (!data.length) return 0;
        return data.reduce((sum, point) => sum + point.value, 0) / data.length;
    }

    calculateStdDev(data) {
        if (data.length < 2) return 0;
        const mean = this.calculateMean(data);
        const variance = data.reduce((sum, point) =>
            sum + Math.pow(point.value - mean, 2), 0) / (data.length - 1);
        return Math.sqrt(variance);
    }

    calculateTrendDirection(data) {
        if (data.length < 2) return 'stable';

        const values = data.map(point => point.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstMean = this.calculateMean(firstHalf.map(v => ({ value: v })));
        const secondMean = this.calculateMean(secondHalf.map(v => ({ value: v })));

        const changePct = ((secondMean - firstMean) / firstMean) * 100;

        if (Math.abs(changePct) < 5) return 'stable';
        return changePct > 0 ? 'increasing' : 'decreasing';
    }

    detectAnomalies(type, data) {
        const trend = this.trends[type];
        if (!trend.baseline) return [];

        const mean = trend.baseline.mean;
        const stdDev = trend.baseline.stdDev;
        const threshold = 2; // Number of standard deviations

        return data.filter(point =>
            Math.abs(point.value - mean) > threshold * stdDev
        );
    }

    shouldUpdateBaseline(type) {
        const lastUpdate = this.trends[type].baseline?.timestamp || 0;
        return Date.now() - lastUpdate > 24 * 60 * 60 * 1000; // 24 hours
    }

    updateBaseline(type) {
        const data = this.trends[type].data;
        if (data.length < 100) return; // Need sufficient data

        this.trends[type].baseline = {
            mean: this.calculateMean(data),
            stdDev: this.calculateStdDev(data),
            timestamp: Date.now()
        };
    }

    updateAnomalies(type, newAnomalies) {
        this.trends[type].anomalies = newAnomalies;
    }

    notifySignificantChanges(type, analysis) {
        const trend = this.trends[type];
        const baseline = trend.baseline;
        if (!baseline) return;

        // Check for significant deviations
        if (Math.abs(analysis.mean - baseline.mean) > 2 * baseline.stdDev) {
            const direction = analysis.mean > baseline.mean ? 'increase' : 'decrease';
            const changePct = Math.abs((analysis.mean - baseline.mean) / baseline.mean * 100);

            alertSystem.addAlert({
                severity: 'warning',
                category: 'Trend Analysis',
                message: `Significant ${direction} in ${type}: ${changePct.toFixed(1)}% change from baseline`
            });
        }

        // Check for concerning trends
        if (analysis.trend === 'increasing' && this.isMetricBad(type, 'increase')) {
            alertSystem.addAlert({
                severity: 'warning',
                category: 'Trend Analysis',
                message: `${type} showing consistent upward trend over last 5 minutes`
            });
        }
    }

    isMetricBad(type, direction) {
        // Define which direction is concerning for each metric
        switch (type) {
            case 'loadTime':
                return direction === 'increase';
            case 'bandwidth':
                return direction === 'decrease';
            case 'memory':
                return direction === 'increase';
            default:
                return false;
        }
    }

    getTrendData(type, timeRange = 3600000) { // Default 1 hour
        return {
            data: this.getRecentData(type, timeRange),
            baseline: this.trends[type].baseline,
            anomalies: this.trends[type].anomalies
        };
    }

    getAnomalyCount(type) {
        return this.trends[type].anomalies.length;
    }

    getMetricHealth(type) {
        const trend = this.trends[type];
        if (!trend.baseline || trend.data.length < 10) return 'unknown';

        const recentData = this.getRecentData(type, 300000); // Last 5 minutes
        const mean = this.calculateMean(recentData);
        const baseline = trend.baseline.mean;
        const stdDev = trend.baseline.stdDev;

        if (Math.abs(mean - baseline) <= stdDev) return 'good';
        if (Math.abs(mean - baseline) <= 2 * stdDev) return 'warning';
        return 'critical';
    }
}

// Initialize and export instance
const trendAnalysis = new TrendAnalysis();
export default trendAnalysis; 