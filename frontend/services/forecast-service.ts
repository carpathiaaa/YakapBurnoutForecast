import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions();

// Cloud Function references
const generateForecastFunction = httpsCallable(functions, 'generateForecast');
const getLatestForecastFunction = httpsCallable(functions, 'getLatestForecast');
const getForecastHistoryFunction = httpsCallable(functions, 'getForecastHistory');
const saveSignalsFunction = httpsCallable(functions, 'saveSignals');
const getUserSignalsFunction = httpsCallable(functions, 'getUserSignals');
const saveUserProfileFunction = httpsCallable(functions, 'saveUserProfile');
const getUserProfileFunction = httpsCallable(functions, 'getUserProfile');

// Types
export interface BurnoutForecast {
  userId: string;
  timestamp: string;
  overallScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  recommendations: string[];
  nextCheckIn: string;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  metadata: {
    signalCount: number;
    timeRange: {
      start: string;
      end: string;
    };
    processingTime: number;
  };
}

export interface WellnessSignal {
  type: 'check-in' | 'task' | 'calendar-event' | 'sleep' | 'activity';
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  userId: string;
  email: string;
  createdAt: string;
  lastActive: string;
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
}

export class ForecastService {
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  /**
   * Generate a new burnout forecast
   */
  async generateForecast(signals: WellnessSignal[], config?: any): Promise<BurnoutForecast> {
    try {
      const userId = this.getCurrentUserId();
      
      const result = await generateForecastFunction({
        userId,
        signals,
        config
      });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate forecast');
      }
      
      return data.forecast;
    } catch (error) {
      console.error('❌ Error generating forecast:', error);
      throw error;
    }
  }

  /**
   * Get the latest forecast for the current user
   */
  async getLatestForecast(): Promise<BurnoutForecast | null> {
    try {
      const userId = this.getCurrentUserId();
      
      const result = await getLatestForecastFunction({ userId });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get latest forecast');
      }
      
      return data.forecast;
    } catch (error) {
      console.error('❌ Error getting latest forecast:', error);
      throw error;
    }
  }

  /**
   * Get forecast history for the current user
   */
  async getForecastHistory(limit: number = 10): Promise<BurnoutForecast[]> {
    try {
      const userId = this.getCurrentUserId();
      
      const result = await getForecastHistoryFunction({ userId, limit });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get forecast history');
      }
      
      return data.forecasts;
    } catch (error) {
      console.error('❌ Error getting forecast history:', error);
      throw error;
    }
  }

  /**
   * Save wellness signals
   */
  async saveSignals(signals: WellnessSignal[], source: string = 'manual'): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      const result = await saveSignalsFunction({
        userId,
        signals,
        source
      });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save signals');
      }
    } catch (error) {
      console.error('❌ Error saving signals:', error);
      throw error;
    }
  }

  /**
   * Get user signals within a time range
   */
  async getUserSignals(startDate?: string, endDate?: string): Promise<WellnessSignal[]> {
    try {
      const userId = this.getCurrentUserId();
      
      const result = await getUserSignalsFunction({
        userId,
        startDate,
        endDate
      });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get user signals');
      }
      
      return data.signals;
    } catch (error) {
      console.error('❌ Error getting user signals:', error);
      throw error;
    }
  }

  /**
   * Save user profile
   */
  async saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const user = auth.currentUser;
      
      if (!user?.email) {
        throw new Error('User email not available');
      }
      
      const result = await saveUserProfileFunction({
        userId,
        email: user.email,
        profile: profile.profile,
        preferences: profile.preferences
      });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save user profile');
      }
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const userId = this.getCurrentUserId();
      
      const result = await getUserProfileFunction({ userId });
      
      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get user profile');
      }
      
      return data.user;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Create a wellness check-in signal
   */
  createCheckInSignal(
    emotionalState: string,
    energyLevel: string,
    stressLevel: string,
    value: number = 50
  ): WellnessSignal {
    return {
      type: 'check-in',
      timestamp: new Date().toISOString(),
      value,
      metadata: {
        emotionalState,
        energyLevel,
        stressLevel
      }
    };
  }

  /**
   * Create a task completion signal
   */
  createTaskSignal(
    completionRate: string,
    complexity: string,
    deadlinePressure: string,
    value: number = 50
  ): WellnessSignal {
    return {
      type: 'task',
      timestamp: new Date().toISOString(),
      value,
      metadata: {
        completionRate,
        complexity,
        deadlinePressure
      }
    };
  }

  /**
   * Create a calendar event signal
   */
  createCalendarSignal(
    meetingFrequency: string,
    meetingDuration: string,
    timeOfDay: string,
    meetingType: string,
    value: number = 50
  ): WellnessSignal {
    return {
      type: 'calendar-event',
      timestamp: new Date().toISOString(),
      value,
      metadata: {
        meetingFrequency,
        meetingDuration,
        timeOfDay,
        meetingType
      }
    };
  }

  /**
   * Get risk level color for UI
   */
  getRiskLevelColor(riskLevel: BurnoutForecast['riskLevel']): string {
    switch (riskLevel) {
      case 'low':
        return '#10B981'; // Green
      case 'moderate':
        return '#F59E0B'; // Yellow
      case 'high':
        return '#EF4444'; // Red
      case 'critical':
        return '#7C2D12'; // Dark red
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get trend icon for UI
   */
  getTrendIcon(trend: BurnoutForecast['trend']): string {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'stable':
        return '➡️';
      case 'declining':
        return '📉';
      case 'critical':
        return '🚨';
      default:
        return '❓';
    }
  }

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  /**
   * Format score for display
   */
  formatScore(score: number): string {
    if (score >= 0) {
      return `+${Math.round(score)}`;
    }
    return `${Math.round(score)}`;
  }
}

// Export singleton instance
export const forecastService = new ForecastService(); 