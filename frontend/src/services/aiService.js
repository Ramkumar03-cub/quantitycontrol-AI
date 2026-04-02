// AI Service for QC Dashboard
// Handles abstraction between mock data and real AI backend

/**
 * @typedef {Object} Defect
 * @property {string} id - Unique defect ID
 * @property {string} label - Class label (e.g., 'Crack')
 * @property {number} confidence - 0.0 to 1.0
 * @property {string} severity - 'critical' | 'warning' | 'pass'
 * @property {Object} box - {x, y, w, h} normalized 0-1
 */

/**
 * @typedef {Object} InferenceResult
 * @property {string} frameId - Unique ID for the frame
 * @property {number} timestamp - Unix timestamp
 * @property {Array<Defect>} defects - List of detected defects
 */

class AIService {
    constructor() {
        this.subscribers = [];
        this.isMockMode = true; // Set to false when ready for real backend
        this.mockInterval = null;
    }

    /**
     * Subscribe to AI inference updates
     * @param {function(InferenceResult): void} callback 
     * @returns {function(): void} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.push(callback);

        // Start mock generation if first subscriber and in mock mode
        if (this.subscribers.length === 1 && this.isMockMode) {
            this.startMockGenerator();
        }

        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
            if (this.subscribers.length === 0) {
                this.stopMockGenerator();
            }
        };
    }

    /**
     * Simulate AI inference with random data
     * @private
     */
    startMockGenerator() {
        console.log("Starting AI Mock Generator Service...");
        this.mockInterval = setInterval(() => {
            const result = this.generateMockInference();
            this.notifySubscribers(result);
        }, 3000); // 1 update every 3 seconds
    }

    stopMockGenerator() {
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = null;
            console.log("Stopped AI Mock Generator Service.");
        }
    }

    /**
     * Generate a single mock inference result
     * @returns {InferenceResult}
     */
    generateMockInference() {
        const defects = [];
        // Randomly decide if we have detections (30% chance of empty)
        if (Math.random() > 0.3) {
            const count = Math.floor(Math.random() * 3) + 1; // 1-3 detections

            for (let i = 0; i < count; i++) {
                const severity = Math.random() > 0.6 ? 'critical' : (Math.random() > 0.3 ? 'warning' : 'pass');
                const label = severity === 'critical' ? 'Bad Weld' : (severity === 'warning' ? 'Defect' : 'Good Weld');

                defects.push({
                    id: Date.now() + i,
                    label: label,
                    confidence: 0.75 + (Math.random() * 0.24), // 75-99%
                    severity: severity,
                    box: {
                        x: 0.1 + (Math.random() * 0.6),
                        y: 0.1 + (Math.random() * 0.6),
                        w: 0.1 + (Math.random() * 0.2),
                        h: 0.1 + (Math.random() * 0.2)
                    }
                });
            }
        }

        return {
            frameId: Date.now().toString(),
            timestamp: Date.now(),
            defects: defects
        };
    }

    notifySubscribers(data) {
        this.subscribers.forEach(cb => cb(data));
    }

    // TODO: Implement connectToRealBackend() for WebSocket/API integration
}

export const aiService = new AIService();
