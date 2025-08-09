import { Timestamp } from 'firebase-admin/firestore';
import { BurnoutForecast } from '../ml/heuristics/forecast-engine';
import { GeneratedRecommendation } from '../ml/nlp/recommendation-generator';
import { WellnessSignal } from '../ml/heuristics/scoring-rubric';
export declare const COLLECTIONS: {
    readonly FORECASTS: "burnout_forecasts";
    readonly SIGNALS: "wellness_signals";
    readonly USERS: "users";
    readonly CONFIG: "forecast_config";
};
export interface FirestoreForecast {
    userId: string;
    timestamp: Timestamp;
    overallScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    confidence: number;
    factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
    };
    recommendations: GeneratedRecommendation[];
    nextCheckIn: Timestamp;
    trend: 'improving' | 'stable' | 'declining' | 'critical';
    signalCount: number;
    timeRange: {
        start: Timestamp;
        end: Timestamp;
    };
    processingTime: number;
    emotionalWeather: {
        label: string;
        description: string;
        intensity: 'calm' | 'mild' | 'moderate' | 'stormy' | 'critical';
        icon: string;
    };
    primaryFactor: {
        category: string;
        impact: number;
        description: string;
        specificRecommendation: string;
    };
    version: string;
}
export interface FirestoreSignal {
    userId: string;
    type: 'check-in' | 'task' | 'calendar-event' | 'sleep' | 'activity';
    timestamp: Timestamp;
    value: number;
    metadata?: Record<string, any>;
    source: string;
    version: string;
}
export interface FirestoreUser {
    userId: string;
    email: string;
    createdAt: Timestamp;
    lastActive: Timestamp;
    preferences: {
        checkInReminders: boolean;
        forecastNotifications: boolean;
        dataSharing: boolean;
    };
    profile: {
        workArrangement?: 'Onsite' | 'Hybrid' | 'Remote';
        focusHours?: {
            start: string;
            end: string;
        };
        stressSignals?: string[];
        recoveryStrategies?: string[];
    };
    version: string;
}
export declare class ForecastService {
    private readonly currentVersion;
    /**
     * Save a burnout forecast to Firestore
     */
    saveForecast(forecast: BurnoutForecast): Promise<void>;
    /**
     * Save wellness signals to Firestore
     */
    saveSignals(signals: WellnessSignal[], userId: string, source: string): Promise<void>;
    /**
     * Get the latest forecast for a user
     */
    getLatestForecast(userId: string): Promise<BurnoutForecast | null>;
    /**
     * Get forecast history for a user
     */
    getForecastHistory(userId: string, limitCount?: number): Promise<BurnoutForecast[]>;
    /**
     * Get signals for a user within a date range
     */
    getSignals(userId: string, startDate: Date, endDate: Date): Promise<WellnessSignal[]>;
    /**
     * Get all signals for a user
     */
    getAllSignals(userId: string): Promise<WellnessSignal[]>;
    /**
     * Save user profile to Firestore
     */
    saveUser(userData: Partial<FirestoreUser>): Promise<void>;
    /**
     * Get user profile from Firestore
     */
    getUser(userId: string): Promise<FirestoreUser | null>;
    /**
     * Clean up old forecasts for a user
     */
    cleanupOldForecasts(userId: string, daysToKeep?: number): Promise<void>;
    /**
     * Convert Firestore forecast data to BurnoutForecast
     */
    private convertFirestoreForecast;
    /**
     * Convert Firestore signal data to WellnessSignal
     */
    private convertFirestoreSignal;
}
//# sourceMappingURL=forecast-service.d.ts.map