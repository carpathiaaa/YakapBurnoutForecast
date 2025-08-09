"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastService = exports.COLLECTIONS = void 0;
const firebase_admin_1 = require("../firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
// Firestore collection names
exports.COLLECTIONS = {
    FORECASTS: 'burnout_forecasts',
    SIGNALS: 'wellness_signals',
    USERS: 'users',
    CONFIG: 'forecast_config'
};
class ForecastService {
    constructor() {
        this.currentVersion = '1.0.0';
    }
    /**
     * Save a burnout forecast to Firestore
     */
    async saveForecast(forecast) {
        try {
            const firestoreForecast = {
                userId: forecast.userId,
                timestamp: firestore_1.Timestamp.fromDate(forecast.timestamp),
                overallScore: forecast.overallScore,
                riskLevel: forecast.riskLevel,
                confidence: forecast.confidence,
                factors: forecast.factors,
                recommendations: forecast.recommendations,
                nextCheckIn: firestore_1.Timestamp.fromDate(forecast.nextCheckIn),
                trend: forecast.trend,
                signalCount: forecast.metadata.signalCount,
                timeRange: {
                    start: firestore_1.Timestamp.fromDate(forecast.metadata.timeRange.start),
                    end: firestore_1.Timestamp.fromDate(forecast.metadata.timeRange.end)
                },
                processingTime: forecast.metadata.processingTime,
                emotionalWeather: forecast.emotionalWeather,
                primaryFactor: forecast.primaryFactor,
                version: this.currentVersion
            };
            const docRef = firebase_admin_1.db.collection(exports.COLLECTIONS.FORECASTS).doc(`${forecast.userId}_${forecast.timestamp.getTime()}`);
            await docRef.set(firestoreForecast);
            console.log(`✅ Forecast saved for user ${forecast.userId}`);
        }
        catch (error) {
            console.error('❌ Error saving forecast:', error);
            throw new Error(`Failed to save forecast: ${error}`);
        }
    }
    /**
     * Save wellness signals to Firestore
     */
    async saveSignals(signals, userId, source) {
        try {
            const batch = firebase_admin_1.db.batch();
            signals.forEach((signal, index) => {
                const firestoreSignal = {
                    userId,
                    type: signal.type,
                    timestamp: firestore_1.Timestamp.fromDate(signal.timestamp),
                    value: signal.value,
                    metadata: signal.metadata,
                    source,
                    version: this.currentVersion
                };
                const docRef = firebase_admin_1.db.collection(exports.COLLECTIONS.SIGNALS).doc(`${userId}_${signal.timestamp.getTime()}_${index}`);
                batch.set(docRef, firestoreSignal);
            });
            await batch.commit();
            console.log(`✅ Saved ${signals.length} signals for user ${userId}`);
        }
        catch (error) {
            console.error('❌ Error saving signals:', error);
            throw new Error(`Failed to save signals: ${error}`);
        }
    }
    /**
     * Get the latest forecast for a user
     */
    async getLatestForecast(userId) {
        try {
            const querySnapshot = await firebase_admin_1.db
                .collection(exports.COLLECTIONS.FORECASTS)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();
            if (querySnapshot.empty) {
                return null;
            }
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return this.convertFirestoreForecast(data);
        }
        catch (error) {
            console.error('❌ Error getting latest forecast:', error);
            throw new Error(`Failed to get latest forecast: ${error}`);
        }
    }
    /**
     * Get forecast history for a user
     */
    async getForecastHistory(userId, limitCount = 10) {
        try {
            const querySnapshot = await firebase_admin_1.db
                .collection(exports.COLLECTIONS.FORECASTS)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limitCount)
                .get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertFirestoreForecast(data);
            });
        }
        catch (error) {
            console.error('❌ Error getting forecast history:', error);
            throw new Error(`Failed to get forecast history: ${error}`);
        }
    }
    /**
     * Get signals for a user within a date range
     */
    async getSignals(userId, startDate, endDate) {
        try {
            const querySnapshot = await firebase_admin_1.db
                .collection(exports.COLLECTIONS.SIGNALS)
                .where('userId', '==', userId)
                .where('timestamp', '>=', firestore_1.Timestamp.fromDate(startDate))
                .where('timestamp', '<=', firestore_1.Timestamp.fromDate(endDate))
                .orderBy('timestamp', 'desc')
                .get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertFirestoreSignal(data);
            });
        }
        catch (error) {
            console.error('❌ Error getting signals:', error);
            throw new Error(`Failed to get signals: ${error}`);
        }
    }
    /**
     * Get all signals for a user
     */
    async getAllSignals(userId) {
        try {
            const querySnapshot = await firebase_admin_1.db
                .collection(exports.COLLECTIONS.SIGNALS)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return this.convertFirestoreSignal(data);
            });
        }
        catch (error) {
            console.error('❌ Error getting all signals:', error);
            throw new Error(`Failed to get all signals: ${error}`);
        }
    }
    /**
     * Save user profile to Firestore
     */
    async saveUser(userData) {
        try {
            if (!userData.userId) {
                throw new Error('userId is required');
            }
            const userRef = firebase_admin_1.db.collection(exports.COLLECTIONS.USERS).doc(userData.userId);
            await userRef.set({
                ...userData,
                version: this.currentVersion
            }, { merge: true });
            console.log(`✅ User profile saved for ${userData.userId}`);
        }
        catch (error) {
            console.error('❌ Error saving user profile:', error);
            throw new Error(`Failed to save user profile: ${error}`);
        }
    }
    /**
     * Get user profile from Firestore
     */
    async getUser(userId) {
        try {
            const userRef = firebase_admin_1.db.collection(exports.COLLECTIONS.USERS).doc(userId);
            const doc = await userRef.get();
            if (!doc.exists) {
                return null;
            }
            return doc.data();
        }
        catch (error) {
            console.error('❌ Error getting user profile:', error);
            throw new Error(`Failed to get user profile: ${error}`);
        }
    }
    /**
     * Clean up old forecasts for a user
     */
    async cleanupOldForecasts(userId, daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const querySnapshot = await firebase_admin_1.db
                .collection(exports.COLLECTIONS.FORECASTS)
                .where('userId', '==', userId)
                .where('timestamp', '<', firestore_1.Timestamp.fromDate(cutoffDate))
                .get();
            const batch = firebase_admin_1.db.batch();
            querySnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`✅ Cleaned up ${querySnapshot.docs.length} old forecasts for user ${userId}`);
        }
        catch (error) {
            console.error('❌ Error cleaning up old forecasts:', error);
            throw new Error(`Failed to clean up old forecasts: ${error}`);
        }
    }
    /**
     * Convert Firestore forecast data to BurnoutForecast
     */
    convertFirestoreForecast(data) {
        return {
            userId: data.userId,
            timestamp: data.timestamp.toDate(),
            overallScore: data.overallScore,
            riskLevel: data.riskLevel,
            confidence: data.confidence,
            factors: data.factors,
            recommendations: data.recommendations,
            nextCheckIn: data.nextCheckIn.toDate(),
            trend: data.trend,
            signals: [], // We don't store signals in the forecast document
            emotionalWeather: data.emotionalWeather,
            primaryFactor: data.primaryFactor,
            metadata: {
                signalCount: data.signalCount,
                timeRange: {
                    start: data.timeRange.start.toDate(),
                    end: data.timeRange.end.toDate()
                },
                processingTime: data.processingTime
            }
        };
    }
    /**
     * Convert Firestore signal data to WellnessSignal
     */
    convertFirestoreSignal(data) {
        return {
            type: data.type,
            timestamp: data.timestamp.toDate(),
            value: data.value,
            metadata: data.metadata
        };
    }
}
exports.ForecastService = ForecastService;
//# sourceMappingURL=forecast-service.js.map