import { db } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { BurnoutForecast } from '../ml/heuristics/forecast-engine';
import { GeneratedRecommendation } from '../ml/nlp/recommendation-generator';
import { WellnessSignal } from '../ml/heuristics/scoring-rubric';

// Firestore collection names
export const COLLECTIONS = {
  FORECASTS: 'burnout_forecasts',
  SIGNALS: 'wellness_signals',
  USERS: 'users',
  CONFIG: 'forecast_config'
} as const;

// Firestore data structures
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
  version: string; // For future schema migrations
}

export interface FirestoreSignal {
  userId: string;
  type: 'check-in' | 'task' | 'calendar-event' | 'sleep' | 'activity';
  timestamp: Timestamp;
  value: number;
  metadata?: Record<string, any>;
  source: string; // e.g., 'manual', 'google_calendar', 'todoist', etc.
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

export class ForecastService {
  private readonly currentVersion = '1.0.0';
  
  /**
   * Save a burnout forecast to Firestore
   */
  async saveForecast(forecast: BurnoutForecast): Promise<void> {
    try {
      const firestoreForecast: FirestoreForecast = {
        userId: forecast.userId,
        timestamp: Timestamp.fromDate(forecast.timestamp),
        overallScore: forecast.overallScore,
        riskLevel: forecast.riskLevel,
        confidence: forecast.confidence,
        factors: forecast.factors,
        recommendations: forecast.recommendations,
        nextCheckIn: Timestamp.fromDate(forecast.nextCheckIn),
        trend: forecast.trend,
        signalCount: forecast.metadata.signalCount,
        timeRange: {
          start: Timestamp.fromDate(forecast.metadata.timeRange.start),
          end: Timestamp.fromDate(forecast.metadata.timeRange.end)
        },
        processingTime: forecast.metadata.processingTime,
        emotionalWeather: forecast.emotionalWeather,
        primaryFactor: forecast.primaryFactor,
        version: this.currentVersion
      };
      
      const docRef = db.collection(COLLECTIONS.FORECASTS).doc(`${forecast.userId}_${forecast.timestamp.getTime()}`);
      await docRef.set(firestoreForecast);
      
      console.log(`✅ Forecast saved for user ${forecast.userId}`);
    } catch (error) {
      console.error('❌ Error saving forecast:', error);
      throw new Error(`Failed to save forecast: ${error}`);
    }
  }
  
  /**
   * Save wellness signals to Firestore
   */
  async saveSignals(signals: WellnessSignal[], userId: string, source: string): Promise<void> {
    try {
      const batch = db.batch();
      
      signals.forEach((signal, index) => {
        const firestoreSignal: FirestoreSignal = {
          userId,
          type: signal.type,
          timestamp: Timestamp.fromDate(signal.timestamp),
          value: signal.value,
          metadata: signal.metadata,
          source,
          version: this.currentVersion
        };
        
        const docRef = db.collection(COLLECTIONS.SIGNALS).doc(`${userId}_${signal.timestamp.getTime()}_${index}`);
        batch.set(docRef, firestoreSignal);
      });
      
      await batch.commit();
      console.log(`✅ Saved ${signals.length} signals for user ${userId}`);
    } catch (error) {
      console.error('❌ Error saving signals:', error);
      throw new Error(`Failed to save signals: ${error}`);
    }
  }
  
  /**
   * Get the latest forecast for a user
   */
  async getLatestForecast(userId: string): Promise<BurnoutForecast | null> {
    try {
      const querySnapshot = await db
        .collection(COLLECTIONS.FORECASTS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data() as FirestoreForecast;
      
      return this.convertFirestoreForecast(data);
    } catch (error) {
      console.error('❌ Error getting latest forecast:', error);
      throw new Error(`Failed to get latest forecast: ${error}`);
    }
  }
  
  /**
   * Get forecast history for a user
   */
  async getForecastHistory(userId: string, limitCount: number = 10): Promise<BurnoutForecast[]> {
    try {
      const querySnapshot = await db
        .collection(COLLECTIONS.FORECASTS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreForecast;
        return this.convertFirestoreForecast(data);
      });
    } catch (error) {
      console.error('❌ Error getting forecast history:', error);
      throw new Error(`Failed to get forecast history: ${error}`);
    }
  }
  
  /**
   * Get signals for a user within a date range
   */
  async getSignals(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<WellnessSignal[]> {
    try {
      const querySnapshot = await db
        .collection(COLLECTIONS.SIGNALS)
        .where('userId', '==', userId)
        .where('timestamp', '>=', Timestamp.fromDate(startDate))
        .where('timestamp', '<=', Timestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')
        .get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreSignal;
        return this.convertFirestoreSignal(data);
      });
    } catch (error) {
      console.error('❌ Error getting signals:', error);
      throw new Error(`Failed to get signals: ${error}`);
    }
  }
  
  /**
   * Get all signals for a user
   */
  async getAllSignals(userId: string): Promise<WellnessSignal[]> {
    try {
      const querySnapshot = await db
        .collection(COLLECTIONS.SIGNALS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreSignal;
        return this.convertFirestoreSignal(data);
      });
    } catch (error) {
      console.error('❌ Error getting all signals:', error);
      throw new Error(`Failed to get all signals: ${error}`);
    }
  }
  
  /**
   * Save user profile to Firestore
   */
  async saveUser(userData: Partial<FirestoreUser>): Promise<void> {
    try {
      if (!userData.userId) {
        throw new Error('userId is required');
      }
      
      const userRef = db.collection(COLLECTIONS.USERS).doc(userData.userId);
      await userRef.set({
        ...userData,
        version: this.currentVersion
      }, { merge: true });
      
      console.log(`✅ User profile saved for ${userData.userId}`);
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      throw new Error(`Failed to save user profile: ${error}`);
    }
  }
  
  /**
   * Get user profile from Firestore
   */
  async getUser(userId: string): Promise<FirestoreUser | null> {
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return doc.data() as FirestoreUser;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }
  
  /**
   * Clean up old forecasts for a user
   */
  async cleanupOldForecasts(userId: string, daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const querySnapshot = await db
        .collection(COLLECTIONS.FORECASTS)
        .where('userId', '==', userId)
        .where('timestamp', '<', Timestamp.fromDate(cutoffDate))
        .get();
      
      const batch = db.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleaned up ${querySnapshot.docs.length} old forecasts for user ${userId}`);
    } catch (error) {
      console.error('❌ Error cleaning up old forecasts:', error);
      throw new Error(`Failed to clean up old forecasts: ${error}`);
    }
  }
  
  /**
   * Convert Firestore forecast data to BurnoutForecast
   */
  private convertFirestoreForecast(data: FirestoreForecast): BurnoutForecast {
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
  private convertFirestoreSignal(data: FirestoreSignal): WellnessSignal {
    return {
      type: data.type,
      timestamp: data.timestamp.toDate(),
      value: data.value,
      metadata: data.metadata
    };
  }
} 