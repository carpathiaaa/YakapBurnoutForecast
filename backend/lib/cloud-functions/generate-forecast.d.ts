export declare const generateForecast: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    forecast: {
        timestamp: string;
        nextCheckIn: string;
        metadata: {
            timeRange: {
                start: string;
                end: string;
            };
            signalCount: number;
            processingTime: number;
        };
        userId: string;
        overallScore: number;
        riskLevel: "low" | "moderate" | "high" | "critical";
        confidence: number;
        factors: {
            positive: string[];
            negative: string[];
            neutral: string[];
        };
        recommendations: string[];
        trend: "improving" | "stable" | "declining" | "critical";
        signals: import("../ml/heuristics/scoring-rubric").SignalScore[];
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    forecast?: undefined;
}>>;
export declare const getLatestForecast: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    forecast: null;
    error?: undefined;
} | {
    success: boolean;
    forecast: {
        timestamp: string;
        nextCheckIn: string;
        metadata: {
            timeRange: {
                start: string;
                end: string;
            };
            signalCount: number;
            processingTime: number;
        };
        userId: string;
        overallScore: number;
        riskLevel: "low" | "moderate" | "high" | "critical";
        confidence: number;
        factors: {
            positive: string[];
            negative: string[];
            neutral: string[];
        };
        recommendations: string[];
        trend: "improving" | "stable" | "declining" | "critical";
        signals: import("../ml/heuristics/scoring-rubric").SignalScore[];
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    forecast?: undefined;
}>>;
export declare const getForecastHistory: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    forecasts: {
        timestamp: string;
        nextCheckIn: string;
        metadata: {
            timeRange: {
                start: string;
                end: string;
            };
            signalCount: number;
            processingTime: number;
        };
        userId: string;
        overallScore: number;
        riskLevel: "low" | "moderate" | "high" | "critical";
        confidence: number;
        factors: {
            positive: string[];
            negative: string[];
            neutral: string[];
        };
        recommendations: string[];
        trend: "improving" | "stable" | "declining" | "critical";
        signals: import("../ml/heuristics/scoring-rubric").SignalScore[];
    }[];
    error?: undefined;
} | {
    success: boolean;
    error: string;
    forecasts?: undefined;
}>>;
export declare const saveSignals: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    message?: undefined;
}>>;
export declare const getUserSignals: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    signals: {
        timestamp: string;
        type: "check-in" | "task" | "calendar-event" | "sleep" | "activity";
        value: number;
        metadata?: Record<string, any>;
    }[];
    error?: undefined;
} | {
    success: boolean;
    error: string;
    signals?: undefined;
}>>;
export declare const saveUserProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    message?: undefined;
}>>;
export declare const getUserProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    user: {
        createdAt: string;
        lastActive: string;
        userId: string;
        email: string;
        preferences: {
            checkInReminders: boolean;
            forecastNotifications: boolean;
            dataSharing: boolean;
        };
        profile: {
            workArrangement?: "Onsite" | "Hybrid" | "Remote";
            focusHours?: {
                start: string;
                end: string;
            };
            stressSignals?: string[];
            recoveryStrategies?: string[];
        };
        version: string;
    } | null;
    error?: undefined;
} | {
    success: boolean;
    error: string;
    user?: undefined;
}>>;
//# sourceMappingURL=generate-forecast.d.ts.map