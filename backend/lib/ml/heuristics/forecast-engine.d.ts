import { WellnessSignal, SignalScore } from './scoring-rubric';
import { GeneratedRecommendation } from '../nlp/recommendation-generator';
export interface BurnoutForecast {
    userId: string;
    timestamp: Date;
    overallScore: number;
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    confidence: number;
    factors: {
        positive: string[];
        negative: string[];
        neutral: string[];
    };
    recommendations: GeneratedRecommendation[];
    nextCheckIn: Date;
    trend: 'improving' | 'stable' | 'declining' | 'critical';
    signals: SignalScore[];
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
    metadata: {
        signalCount: number;
        timeRange: {
            start: Date;
            end: Date;
        };
        processingTime: number;
    };
}
export interface ForecastConfig {
    analysisWindow: number;
    minSignalsRequired: number;
    confidenceThresholds: {
        low: number;
        moderate: number;
        high: number;
    };
    riskThresholds: {
        low: number;
        moderate: number;
        high: number;
        critical: number;
    };
    trendAnalysis: {
        windowDays: number;
        minDataPoints: number;
    };
}
export declare const DEFAULT_FORECAST_CONFIG: ForecastConfig;
export declare class BurnoutForecastEngine {
    private config;
    constructor(config?: Partial<ForecastConfig>);
    /**
     * Main function to compute burnout forecast
     */
    computeForecast(userId: string, signals: WellnessSignal[], config?: Partial<ForecastConfig>): Promise<BurnoutForecast>;
    private computeOverallScore;
    private determineRiskLevel;
    private calculateConfidence;
    private calculateVariance;
    private analyzeTrend;
    private calculateLinearTrend;
    private identifyFactors;
    private addSpecificInsights;
    private generateRecommendations;
    private calculateNextCheckIn;
    private generateInsufficientDataForecast;
    /**
     * Generate weather-like emotional state label
     */
    private generateEmotionalWeather;
    /**
     * Identify the primary factor contributing to burnout
     */
    private identifyPrimaryFactor;
    /**
     * Generate specific insights for the primary factor
     */
    private generateFactorInsights;
    private analyzeCheckInFactor;
    private analyzeTaskFactor;
    private analyzeCalendarFactor;
    private analyzeSleepFactor;
    private analyzeActivityFactor;
}
//# sourceMappingURL=forecast-engine.d.ts.map