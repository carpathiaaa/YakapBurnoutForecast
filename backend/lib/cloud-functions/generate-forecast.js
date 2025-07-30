"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.saveUserProfile = exports.getUserSignals = exports.saveSignals = exports.getForecastHistory = exports.getLatestForecast = exports.generateForecast = void 0;
const https_1 = require("firebase-functions/v2/https");
const forecast_engine_1 = require("../ml/heuristics/forecast-engine");
const forecast_service_1 = require("../firestore/forecast-service");
// Cloud Function to generate burnout forecast
exports.generateForecast = (0, https_1.onCall)({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId, signals, config } = request.data;
        // Validate input
        if (!userId) {
            throw new Error('userId is required');
        }
        if (!signals || !Array.isArray(signals)) {
            throw new Error('signals array is required');
        }
        // Initialize services
        const forecastEngine = new forecast_engine_1.BurnoutForecastEngine(config);
        const forecastService = new forecast_service_1.ForecastService();
        // Convert signals to proper format
        const wellnessSignals = signals.map((signal) => ({
            type: signal.type,
            timestamp: new Date(signal.timestamp),
            value: signal.value,
            metadata: signal.metadata
        }));
        // Generate forecast
        const forecast = await forecastEngine.computeForecast(userId, wellnessSignals, config);
        // Save forecast to Firestore
        await forecastService.saveForecast(forecast);
        // Save signals to Firestore (if they're new)
        if (signals.length > 0) {
            await forecastService.saveSignals(wellnessSignals, userId, 'manual');
        }
        return {
            success: true,
            forecast: {
                ...forecast,
                timestamp: forecast.timestamp.toISOString(),
                nextCheckIn: forecast.nextCheckIn.toISOString(),
                metadata: {
                    ...forecast.metadata,
                    timeRange: {
                        start: forecast.metadata.timeRange.start.toISOString(),
                        end: forecast.metadata.timeRange.end.toISOString()
                    }
                }
            }
        };
    }
    catch (error) {
        console.error('❌ Error generating forecast:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
// Cloud Function to get latest forecast
exports.getLatestForecast = (0, https_1.onCall)({
    memory: '128MiB',
    timeoutSeconds: 30,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId } = request.data;
        if (!userId) {
            throw new Error('userId is required');
        }
        const forecastService = new forecast_service_1.ForecastService();
        const forecast = await forecastService.getLatestForecast(userId);
        if (!forecast) {
            return {
                success: true,
                forecast: null
            };
        }
        return {
            success: true,
            forecast: {
                ...forecast,
                timestamp: forecast.timestamp.toISOString(),
                nextCheckIn: forecast.nextCheckIn.toISOString(),
                metadata: {
                    ...forecast.metadata,
                    timeRange: {
                        start: forecast.metadata.timeRange.start.toISOString(),
                        end: forecast.metadata.timeRange.end.toISOString()
                    }
                }
            }
        };
    }
    catch (error) {
        console.error('❌ Error getting latest forecast:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
// Cloud Function to get forecast history
exports.getForecastHistory = (0, https_1.onCall)({
    memory: '128MiB',
    timeoutSeconds: 30,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId, limit = 10 } = request.data;
        if (!userId) {
            throw new Error('userId is required');
        }
        const forecastService = new forecast_service_1.ForecastService();
        const forecasts = await forecastService.getForecastHistory(userId, limit);
        return {
            success: true,
            forecasts: forecasts.map(forecast => ({
                ...forecast,
                timestamp: forecast.timestamp.toISOString(),
                nextCheckIn: forecast.nextCheckIn.toISOString(),
                metadata: {
                    ...forecast.metadata,
                    timeRange: {
                        start: forecast.metadata.timeRange.start.toISOString(),
                        end: forecast.metadata.timeRange.end.toISOString()
                    }
                }
            }))
        };
    }
    catch (error) {
        console.error('❌ Error getting forecast history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
// Cloud Function to save wellness signals
exports.saveSignals = (0, https_1.onCall)({
    memory: '256MiB',
    timeoutSeconds: 60,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId, signals, source = 'manual' } = request.data;
        if (!userId) {
            throw new Error('userId is required');
        }
        if (!signals || !Array.isArray(signals)) {
            throw new Error('signals array is required');
        }
        const forecastService = new forecast_service_1.ForecastService();
        // Convert signals to proper format
        const wellnessSignals = signals.map((signal) => ({
            type: signal.type,
            timestamp: new Date(signal.timestamp),
            value: signal.value,
            metadata: signal.metadata
        }));
        // Save signals
        await forecastService.saveSignals(wellnessSignals, userId, source);
        return {
            success: true,
            message: `Saved ${signals.length} signals for user ${userId}`
        };
    }
    catch (error) {
        console.error('❌ Error saving signals:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
// Cloud Function to get user signals
exports.getUserSignals = (0, https_1.onCall)({
    memory: '128MiB',
    timeoutSeconds: 30,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId, startDate, endDate } = request.data;
        if (!userId) {
            throw new Error('userId is required');
        }
        const forecastService = new forecast_service_1.ForecastService();
        let signals;
        if (startDate && endDate) {
            signals = await forecastService.getSignals(userId, new Date(startDate), new Date(endDate));
        }
        else {
            signals = await forecastService.getAllSignals(userId);
        }
        return {
            success: true,
            signals: signals.map(signal => ({
                ...signal,
                timestamp: signal.timestamp.toISOString()
            }))
        };
    }
    catch (error) {
        console.error('❌ Error getting user signals:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
// Cloud Function to save user profile
exports.saveUserProfile = (0, https_1.onCall)({
    memory: '128MiB',
    timeoutSeconds: 30,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId, email, profile, preferences } = request.data;
        if (!userId || !email) {
            throw new Error('userId and email are required');
        }
        const forecastService = new forecast_service_1.ForecastService();
        await forecastService.saveUser({
            userId,
            email,
            profile,
            preferences
        });
        return {
            success: true,
            message: `User profile saved for ${userId}`
        };
    }
    catch (error) {
        console.error('❌ Error saving user profile:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
// Cloud Function to get user profile
exports.getUserProfile = (0, https_1.onCall)({
    memory: '128MiB',
    timeoutSeconds: 30,
    region: 'us-central1'
}, async (request) => {
    try {
        const { userId } = request.data;
        if (!userId) {
            throw new Error('userId is required');
        }
        const forecastService = new forecast_service_1.ForecastService();
        const user = await forecastService.getUser(userId);
        return {
            success: true,
            user: user ? {
                ...user,
                createdAt: user.createdAt.toDate().toISOString(),
                lastActive: user.lastActive.toDate().toISOString()
            } : null
        };
    }
    catch (error) {
        console.error('❌ Error getting user profile:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
});
//# sourceMappingURL=generate-forecast.js.map