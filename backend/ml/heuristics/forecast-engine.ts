import { WellnessSignal, SignalScore, calculateSignalScore } from './scoring-rubric';
import { RecommendationGenerator, GeneratedRecommendation } from '../nlp/recommendation-generator';

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
  // Updated recommendations structure
  recommendations: GeneratedRecommendation[];
  nextCheckIn: Date;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  signals: SignalScore[];
  // New weather-like emotional state
  emotionalWeather: {
    label: string;
    description: string;
    intensity: 'calm' | 'mild' | 'moderate' | 'stormy' | 'critical';
    icon: string;
  };
  // New factor-based insights
  primaryFactor: {
    category: string;
    impact: number; // -100 to 100
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
  // Optimized thresholds based on validation results
  riskThresholds: {
    low: 0,      // Was 30 - much more sensitive
    moderate: -15, // Was 10 - more sensitive
    high: -25,     // Was -10 - more sensitive
    critical: -45  // Was -30 - more sensitive
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
    const recommendations = await this.generateRecommendations(
      riskLevel,
      factors,
      overallScore,
      signalScores,
      this.generateEmotionalWeather(overallScore, trend),
      this.identifyPrimaryFactor(signalScores),
      trend
    );
    
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
      emotionalWeather: this.generateEmotionalWeather(overallScore, trend),
      primaryFactor: this.identifyPrimaryFactor(signalScores),
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
  
  private async generateRecommendations(
    riskLevel: BurnoutForecast['riskLevel'],
    factors: BurnoutForecast['factors'],
    overallScore: number,
    signalScores: SignalScore[],
    emotionalWeather: BurnoutForecast['emotionalWeather'],
    primaryFactor: BurnoutForecast['primaryFactor'],
    trend: BurnoutForecast['trend']
  ): Promise<GeneratedRecommendation[]> {
    const recommendationGenerator = new RecommendationGenerator();
    
    // Create context for NLP recommendation generation
    const context = {
      riskLevel,
      primaryFactor,
      emotionalWeather,
      factors,
      overallScore,
      trend,
      signalCount: signalScores.length
    };

    try {
      // Generate NLP-based recommendations
       return await recommendationGenerator.generateRecommendations(context);
    } catch (error) {
      console.error('NLP recommendation generation failed:', error);
      
      // Fallback to basic recommendations
      const fallbackRecommendations: GeneratedRecommendation[] = [];
      
      switch (riskLevel) {
        case 'low':
          fallbackRecommendations.push({
            text: 'Continue current wellness practices',
            category: 'long-term',
            priority: 'low',
            confidence: 0.9,
            reasoning: 'Low risk level indicates good current practices'
          });
          break;
        case 'moderate':
          fallbackRecommendations.push({
            text: 'Consider taking short breaks throughout the day',
            category: 'short-term',
            priority: 'medium',
            confidence: 0.8,
            reasoning: 'Moderate risk requires preventive measures'
          });
          break;
        case 'high':
          fallbackRecommendations.push({
            text: 'Take a day off or reduce workload if possible',
            category: 'immediate',
            priority: 'high',
            confidence: 0.9,
            reasoning: 'High risk requires immediate intervention'
          });
          break;
        case 'critical':
          fallbackRecommendations.push({
            text: 'Immediate action needed - consider taking time off',
            category: 'immediate',
            priority: 'high',
            confidence: 1.0,
            reasoning: 'Critical risk requires urgent intervention'
          });
          break;
      }

      return fallbackRecommendations;
    }
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
        {
          text: 'Complete more wellness check-ins',
          category: 'immediate',
          priority: 'medium',
          confidence: 0.8,
          reasoning: 'Insufficient data for personalized recommendations'
        },
        {
          text: 'Connect your calendar and task apps',
          category: 'short-term',
          priority: 'low',
          confidence: 0.7,
          reasoning: 'More data sources will improve forecast accuracy'
        },
        {
          text: 'Use the app regularly for better insights',
          category: 'long-term',
          priority: 'low',
          confidence: 0.6,
          reasoning: 'Regular usage provides better wellness tracking'
        }
      ],
      nextCheckIn: new Date(Date.now() + 24 * 60 * 60 * 1000),
      trend: 'stable',
      signals: signals.map(calculateSignalScore),
      emotionalWeather: this.generateEmotionalWeather(0, 'stable'),
      primaryFactor: {
        category: 'data-insufficiency',
        impact: 0,
        description: 'Insufficient data for factor analysis',
        specificRecommendation: 'Complete more wellness check-ins to get personalized insights'
      },
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

  /**
   * Generate weather-like emotional state label
   */
  private generateEmotionalWeather(score: number, trend: BurnoutForecast['trend']): BurnoutForecast['emotionalWeather'] {
    const weatherPatterns = {
      // Positive weather patterns
      'sunny': { label: 'Sunny with clear skies', intensity: 'calm' as const, icon: '☀️' },
      'partly-cloudy': { label: 'Partly cloudy with gentle breeze', intensity: 'mild' as const, icon: '⛅' },
      'cloudy': { label: 'Cloudy with scattered thoughts', intensity: 'moderate' as const, icon: '☁️' },
      'overcast': { label: 'Overcast with rising tension', intensity: 'stormy' as const, icon: '🌥️' },
      'stormy': { label: 'Stormy with emotional turbulence', intensity: 'stormy' as const, icon: '⛈️' },
      'critical': { label: 'Hurricane conditions - immediate shelter needed', intensity: 'critical' as const, icon: '🌀' }
    };

    // Determine base weather based on score
    let baseWeather: keyof typeof weatherPatterns;
    if (score >= 50) baseWeather = 'sunny';
    else if (score >= 20) baseWeather = 'partly-cloudy';
    else if (score >= -10) baseWeather = 'cloudy';
    else if (score >= -30) baseWeather = 'overcast';
    else if (score >= -50) baseWeather = 'stormy';
    else baseWeather = 'critical';

    // Adjust based on trend
    let description = weatherPatterns[baseWeather].label;
    if (trend === 'improving') {
      description += ' - clearing up';
    } else if (trend === 'declining') {
      description += ' - conditions worsening';
    } else if (trend === 'critical') {
      description = weatherPatterns['critical'].label;
    }

    return {
      label: weatherPatterns[baseWeather].label,
      description,
      intensity: weatherPatterns[baseWeather].intensity,
      icon: weatherPatterns[baseWeather].icon
    };
  }

  /**
   * Identify the primary factor contributing to burnout
   */
  private identifyPrimaryFactor(signalScores: SignalScore[]): BurnoutForecast['primaryFactor'] {
    // Group signals by type and calculate average impact
    const factorAnalysis = {
      'check-in': { totalImpact: 0, count: 0, avgScore: 0 },
      'task': { totalImpact: 0, count: 0, avgScore: 0 },
      'calendar-event': { totalImpact: 0, count: 0, avgScore: 0 },
      'sleep': { totalImpact: 0, count: 0, avgScore: 0 },
      'activity': { totalImpact: 0, count: 0, avgScore: 0 }
    };

    // Calculate impact for each signal type
    for (const signalScore of signalScores) {
      const type = signalScore.signal.type;
      factorAnalysis[type].totalImpact += signalScore.score * signalScore.weight;
      factorAnalysis[type].count += 1;
    }

    // Calculate average scores and find the most negative impact
    let primaryCategory = 'check-in';
    let maxNegativeImpact = 0;

    for (const [category, data] of Object.entries(factorAnalysis)) {
      if (data.count > 0) {
        data.avgScore = data.totalImpact / data.count;
        
        // Find the most negative impact (highest negative score)
        if (data.avgScore < maxNegativeImpact) {
          maxNegativeImpact = data.avgScore;
          primaryCategory = category;
        }
      }
    }

    // Generate specific insights and recommendations
    const factorInsights = this.generateFactorInsights(primaryCategory, maxNegativeImpact, signalScores);
    
    return {
      category: primaryCategory,
      impact: maxNegativeImpact,
      description: factorInsights.description,
      specificRecommendation: factorInsights.recommendation
    };
  }

  /**
   * Generate specific insights for the primary factor
   */
  private generateFactorInsights(category: string, impact: number, signalScores: SignalScore[]): { description: string; recommendation: string } {
    const categorySignals = signalScores.filter(s => s.signal.type === category);
    
    switch (category) {
      case 'check-in':
        return this.analyzeCheckInFactor(categorySignals, impact);
      case 'task':
        return this.analyzeTaskFactor(categorySignals, impact);
      case 'calendar-event':
        return this.analyzeCalendarFactor(categorySignals, impact);
      case 'sleep':
        return this.analyzeSleepFactor(categorySignals, impact);
      case 'activity':
        return this.analyzeActivityFactor(categorySignals, impact);
      default:
        return {
          description: 'Multiple factors contributing to stress',
          recommendation: 'Focus on the most impactful area first'
        };
    }
  }

  private analyzeCheckInFactor(signals: SignalScore[], impact: number): { description: string; recommendation: string } {
    const recentSignals = signals.filter(s => 
      s.signal.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentSignals.length === 0) {
      return {
        description: 'No recent wellness check-ins detected',
        recommendation: 'Complete a wellness check-in today to assess your current state'
      };
    }

    const avgScore = recentSignals.reduce((sum, s) => sum + s.score, 0) / recentSignals.length;
    
    if (avgScore < -20) {
      return {
        description: 'Recent check-ins show significant emotional distress',
        recommendation: 'Consider talking to a trusted friend or professional about your feelings'
      };
    } else if (avgScore < 0) {
      return {
        description: 'Check-ins indicate declining emotional wellness',
        recommendation: 'Practice daily stress-reduction techniques like deep breathing or meditation'
      };
    }

    return {
      description: 'Emotional patterns need attention',
      recommendation: 'Schedule regular wellness check-ins to monitor your emotional state'
    };
  }

  private analyzeTaskFactor(signals: SignalScore[], impact: number): { description: string; recommendation: string } {
    const lowCompletionTasks = signals.filter(s => 
      s.signal.metadata?.completionRate === '0-19%' || 
      s.signal.metadata?.completionRate === '20-39%'
    );

    if (lowCompletionTasks.length > signals.length * 0.6) {
      return {
        description: 'Task completion rates are significantly declining',
        recommendation: 'Break down complex tasks into smaller, manageable steps and set realistic daily goals'
      };
    } else if (lowCompletionTasks.length > signals.length * 0.3) {
      return {
        description: 'Some tasks are falling behind schedule',
        recommendation: 'Prioritize your most important tasks and consider delegating when possible'
      };
    }

    return {
      description: 'Task management patterns need optimization',
      recommendation: 'Review your workload and consider using time-blocking techniques'
    };
  }

  private analyzeCalendarFactor(signals: SignalScore[], impact: number): { description: string; recommendation: string } {
    const highStressMeetings = signals.filter(s => 
      s.signal.metadata?.meetingFrequency === '9+' ||
      s.signal.metadata?.meetingDuration === 'very-long'
    );

    if (highStressMeetings.length > 0) {
      return {
        description: 'High meeting load detected in your schedule',
        recommendation: 'Consider declining non-essential meetings and block focus time in your calendar'
      };
    }

    const moderateMeetings = signals.filter(s => 
      s.signal.metadata?.meetingFrequency === '6-8'
    );

    if (moderateMeetings.length > 0) {
      return {
        description: 'Meeting schedule may be contributing to stress',
        recommendation: 'Review your calendar and ensure you have adequate breaks between meetings'
      };
    }

    return {
      description: 'Calendar patterns need attention',
      recommendation: 'Schedule regular breaks and focus time in your calendar'
    };
  }

  private analyzeSleepFactor(signals: SignalScore[], impact: number): { description: string; recommendation: string } {
    const poorSleepSignals = signals.filter(s => 
      s.signal.metadata?.sleepDuration === 'less-than-6' ||
      s.signal.metadata?.sleepQuality === 'light-fragmented'
    );

    if (poorSleepSignals.length > signals.length * 0.5) {
      return {
        description: 'Sleep patterns indicate significant sleep deprivation',
        recommendation: 'Establish a consistent bedtime routine and aim for 7-8 hours of quality sleep'
      };
    }

    return {
      description: 'Sleep patterns need improvement',
      recommendation: 'Create a relaxing bedtime routine and avoid screens 1 hour before sleep'
    };
  }

  private analyzeActivityFactor(signals: SignalScore[], impact: number): { description: string; recommendation: string } {
    const sedentarySignals = signals.filter(s => 
      s.signal.metadata?.activityLevel === 'sedentary' ||
      s.signal.metadata?.movementScore === 'low'
    );

    if (sedentarySignals.length > signals.length * 0.7) {
      return {
        description: 'Very low activity levels detected',
        recommendation: 'Start with short walks or gentle stretching breaks throughout the day'
      };
    }

    return {
      description: 'Activity levels need attention',
      recommendation: 'Incorporate more movement into your daily routine, even short walks help'
    };
  }
} 