import { WellnessSignal, SignalScore, calculateSignalScore } from './scoring-rubric';

export interface BurnoutForecast {
  userId: string;
  timestamp: Date;
  overallScore: number; // -100 to 100 scale
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number; // 0-1 scale
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  recommendations: string[];
  nextCheckIn: Date;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  signals: SignalScore[];
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
  // Time window for analysis (in days)
  analysisWindow: number;
  
  // Minimum signals required for reliable forecast
  minSignalsRequired: number;
  
  // Confidence thresholds
  confidenceThresholds: {
    low: number;
    moderate: number;
    high: number;
  };
  
  // Risk level thresholds
  riskThresholds: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  
  // Trend analysis settings
  trendAnalysis: {
    windowDays: number;
    minDataPoints: number;
  };
}

// Default configuration
export const DEFAULT_FORECAST_CONFIG: ForecastConfig = {
  analysisWindow: 14, // 2 weeks
  minSignalsRequired: 5,
  confidenceThresholds: {
    low: 0.3,
    moderate: 0.6,
    high: 0.8
  },
  riskThresholds: {
    low: 30,
    moderate: 10,
    high: -10,
    critical: -30
  },
  trendAnalysis: {
    windowDays: 7,
    minDataPoints: 3
  }
};

export class BurnoutForecastEngine {
  private config: ForecastConfig;
  
  constructor(config: Partial<ForecastConfig> = {}) {
    this.config = { ...DEFAULT_FORECAST_CONFIG, ...config };
  }
  
  /**
   * Main function to compute burnout forecast
   */
  async computeForecast(
    userId: string,
    signals: WellnessSignal[],
    config?: Partial<ForecastConfig>
  ): Promise<BurnoutForecast> {
    const startTime = Date.now();
    const finalConfig = { ...this.config, ...config };
    
    // Filter signals within analysis window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - finalConfig.analysisWindow);
    
    const relevantSignals = signals.filter(
      signal => signal.timestamp >= cutoffDate
    );
    
    // Check if we have enough data
    if (relevantSignals.length < finalConfig.minSignalsRequired) {
      return this.generateInsufficientDataForecast(userId, relevantSignals, startTime);
    }
    
    // Calculate scores for all signals
    const signalScores = relevantSignals.map(calculateSignalScore);
    
    // Compute weighted overall score
    const overallScore = this.computeOverallScore(signalScores);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore, finalConfig);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(signalScores, finalConfig);
    
    // Analyze trends
    const trend = this.analyzeTrend(signalScores, finalConfig);
    
    // Generate factors and recommendations
    const factors = this.identifyFactors(signalScores);
    const recommendations = this.generateRecommendations(riskLevel, factors, overallScore);
    
    // Calculate next check-in time
    const nextCheckIn = this.calculateNextCheckIn(riskLevel, overallScore);
    
    return {
      userId,
      timestamp: new Date(),
      overallScore,
      riskLevel,
      confidence,
      factors,
      recommendations,
      nextCheckIn,
      trend,
      signals: signalScores,
      metadata: {
        signalCount: relevantSignals.length,
        timeRange: {
          start: cutoffDate,
          end: new Date()
        },
        processingTime: Date.now() - startTime
      }
    };
  }
  
  private computeOverallScore(signalScores: SignalScore[]): number {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const signalScore of signalScores) {
      weightedSum += signalScore.score * signalScore.weight;
      totalWeight += signalScore.weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  private determineRiskLevel(score: number, config: ForecastConfig): BurnoutForecast['riskLevel'] {
    if (score >= config.riskThresholds.low) return 'low';
    if (score >= config.riskThresholds.moderate) return 'moderate';
    if (score >= config.riskThresholds.high) return 'high';
    return 'critical';
  }
  
  private calculateConfidence(signalScores: SignalScore[], config: ForecastConfig): number {
    // Base confidence on signal count and consistency
    const signalCount = signalScores.length;
    const baseConfidence = Math.min(signalCount / 10, 1); // Max confidence at 10+ signals (more lenient)
    
    // Adjust for signal consistency
    const scores = signalScores.map(s => s.score);
    const variance = this.calculateVariance(scores);
    const consistencyFactor = Math.max(0.3, 1 - variance / 200); // More lenient variance tolerance
    
    // Adjust for signal recency (more lenient)
    const recentSignals = signalScores.filter(
      s => s.signal.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );
    const recencyFactor = Math.min(recentSignals.length / 3, 1); // More lenient recency
    
    return Math.min(baseConfidence * consistencyFactor * recencyFactor, 1);
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private analyzeTrend(signalScores: SignalScore[], config: ForecastConfig): BurnoutForecast['trend'] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.trendAnalysis.windowDays);
    
    const recentScores = signalScores
      .filter(s => s.signal.timestamp >= cutoffDate)
      .map(s => s.score);
    
    if (recentScores.length < config.trendAnalysis.minDataPoints) {
      return 'stable';
    }
    
    // Calculate trend using linear regression
    const trend = this.calculateLinearTrend(recentScores);
    
    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    if (trend < -15) return 'critical';
    return 'stable';
  }
  
  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
  
  private identifyFactors(signalScores: SignalScore[]): BurnoutForecast['factors'] {
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      neutral: [] as string[]
    };
    
    // Group signals by type and analyze patterns
    const signalTypes = signalScores.reduce((acc, signalScore) => {
      const type = signalScore.signal.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(signalScore);
      return acc;
    }, {} as Record<string, SignalScore[]>);
    
    // Analyze each signal type
    for (const [type, scores] of Object.entries(signalTypes)) {
      const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      
      if (avgScore > 20) {
        factors.positive.push(`${type} patterns are healthy`);
      } else if (avgScore < -20) {
        factors.negative.push(`${type} patterns indicate stress`);
      } else {
        factors.neutral.push(`${type} patterns are mixed`);
      }
    }
    
    // Add specific insights based on signal metadata
    this.addSpecificInsights(signalScores, factors);
    
    return factors;
  }
  
  private addSpecificInsights(signalScores: SignalScore[], factors: BurnoutForecast['factors']) {
    // Check for specific patterns
    const checkIns = signalScores.filter(s => s.signal.type === 'check-in');
    const tasks = signalScores.filter(s => s.signal.type === 'task');
    const calendarEvents = signalScores.filter(s => s.signal.type === 'calendar-event');
    
    // Check-in insights
    if (checkIns.length > 0) {
      const recentCheckIns = checkIns.filter(
        s => s.signal.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (recentCheckIns.length === 0) {
        factors.negative.push('No recent wellness check-ins');
      } else {
        const avgCheckInScore = recentCheckIns.reduce((sum, s) => sum + s.score, 0) / recentCheckIns.length;
        if (avgCheckInScore < -10) {
          factors.negative.push('Recent check-ins show declining wellness');
        }
      }
    }
    
    // Task insights
    if (tasks.length > 0) {
      const lowCompletionTasks = tasks.filter(s => 
        s.signal.metadata?.completionRate === '0-19%' || 
        s.signal.metadata?.completionRate === '20-39%'
      );
      
      if (lowCompletionTasks.length > tasks.length * 0.5) {
        factors.negative.push('Task completion rates are declining');
      }
    }
    
    // Calendar insights
    if (calendarEvents.length > 0) {
      const highStressMeetings = calendarEvents.filter(s => 
        s.signal.metadata?.meetingFrequency === '9+' ||
        s.signal.metadata?.meetingDuration === 'very-long'
      );
      
      if (highStressMeetings.length > 0) {
        factors.negative.push('High meeting load detected');
      }
    }
  }
  
  private generateRecommendations(
    riskLevel: BurnoutForecast['riskLevel'],
    factors: BurnoutForecast['factors'],
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Base recommendations by risk level
    switch (riskLevel) {
      case 'low':
        recommendations.push('Continue current wellness practices');
        recommendations.push('Schedule regular check-ins to maintain awareness');
        break;
      case 'moderate':
        recommendations.push('Consider taking short breaks throughout the day');
        recommendations.push('Review your workload and prioritize tasks');
        break;
      case 'high':
        recommendations.push('Take a day off or reduce workload if possible');
        recommendations.push('Practice stress-reduction techniques');
        recommendations.push('Consider talking to a supervisor about workload');
        break;
      case 'critical':
        recommendations.push('Immediate action needed - consider taking time off');
        recommendations.push('Seek professional support if needed');
        recommendations.push('Reduce work commitments temporarily');
        break;
    }
    
    // Specific recommendations based on factors
    if (factors.negative.includes('No recent wellness check-ins')) {
      recommendations.push('Complete a wellness check-in today');
    }
    
    if (factors.negative.includes('Task completion rates are declining')) {
      recommendations.push('Break down complex tasks into smaller steps');
      recommendations.push('Set realistic daily goals');
    }
    
    if (factors.negative.includes('High meeting load detected')) {
      recommendations.push('Consider declining non-essential meetings');
      recommendations.push('Block focus time in your calendar');
    }
    
    return recommendations;
  }
  
  private calculateNextCheckIn(riskLevel: BurnoutForecast['riskLevel'], overallScore: number): Date {
    const now = new Date();
    
    switch (riskLevel) {
      case 'low':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      case 'moderate':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      case 'high':
        return new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours
      case 'critical':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
    }
  }
  
  private generateInsufficientDataForecast(
    userId: string,
    signals: WellnessSignal[],
    startTime: number
  ): BurnoutForecast {
    return {
      userId,
      timestamp: new Date(),
      overallScore: 0,
      riskLevel: 'low',
      confidence: 0.1,
      factors: {
        positive: [],
        negative: ['Insufficient data for reliable forecast'],
        neutral: []
      },
      recommendations: [
        'Complete more wellness check-ins',
        'Connect your calendar and task apps',
        'Use the app regularly for better insights'
      ],
      nextCheckIn: new Date(Date.now() + 24 * 60 * 60 * 1000),
      trend: 'stable',
      signals: signals.map(calculateSignalScore),
      metadata: {
        signalCount: signals.length,
        timeRange: {
          start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        processingTime: Date.now() - startTime
      }
    };
  }
} 