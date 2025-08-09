"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.saveUserProfile = exports.getUserSignals = exports.saveSignals = exports.getForecastHistory = exports.getLatestForecast = exports.generateForecast = void 0;
const functions = __importStar(require("firebase-functions"));
const forecast_engine_1 = require("../ml/heuristics/forecast-engine");
const forecast_service_1 = require("../firestore/forecast-service");
// Cloud Function (Gen 1) to generate burnout forecast
exports.generateForecast = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 60 })
    .https.onCall(async (data, context) => {
    try {
        const { userId, signals, config } = data || {};
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
// Cloud Function (Gen 1) to get latest forecast
exports.getLatestForecast = functions
    .region('us-central1')
    .runWith({ memory: '128MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    try {
        const { userId } = data || {};
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
// Cloud Function (Gen 1) to get forecast history
exports.getForecastHistory = functions
    .region('us-central1')
    .runWith({ memory: '128MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    try {
        const { userId, limit = 10 } = data || {};
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
// Cloud Function (Gen 1) to save wellness signals
exports.saveSignals = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 60 })
    .https.onCall(async (data, context) => {
    try {
        const { userId, signals, source = 'manual' } = data || {};
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
// Cloud Function (Gen 1) to get user signals
exports.getUserSignals = functions
    .region('us-central1')
    .runWith({ memory: '128MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    try {
        const { userId, startDate, endDate } = data || {};
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
// Cloud Function (Gen 1) to save user profile
exports.saveUserProfile = functions
    .region('us-central1')
    .runWith({ memory: '128MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    try {
        const { userId, email, profile, preferences } = data || {};
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
// Cloud Function (Gen 1) to get user profile
exports.getUserProfile = functions
    .region('us-central1')
    .runWith({ memory: '128MB', timeoutSeconds: 30 })
    .https.onCall(async (data, context) => {
    try {
        const { userId } = data || {};
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