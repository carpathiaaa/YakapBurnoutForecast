import { auth, db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

// Free-tier mode: directly use Firestore from the client (no Cloud Functions)

// Types
export interface GeneratedRecommendation {
  text: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
}

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
  recommendations: GeneratedRecommendation[];
  nextCheckIn: string;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  emotionalWeather?: {
    label: string;
    description: string;
    intensity: 'calm' | 'mild' | 'moderate' | 'stormy' | 'critical';
    icon: string;
  };
  primaryFactor?: {
    category: string;
    impact: number;
    description: string;
    specificRecommendation: string;
  };
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
    productivityTime?: 'Morning' | 'Afternoon' | 'Evening' | 'Varies';
    energizedDays?: string[];
    meetingTolerance?: number;
    profilePictureUri?: string;
    department?: string;
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
      console.log('[Forecast] generate start', { userId, signalsCount: signals.length });
      // Minimal heuristic forecast on client (placeholder)
      const now = new Date();
      const overallScore = Math.round(
        signals.reduce((s, cur) => s + (isFinite(cur.value) ? cur.value : 0), 0) / Math.max(1, signals.length)
      );
      const riskLevel: BurnoutForecast['riskLevel'] = overallScore >= 67 ? 'low' : overallScore >= 34 ? 'moderate' : 'high';
      const emotional = deriveEmotionalWeather(riskLevel, 'stable');
      const forecast: BurnoutForecast = {
        userId,
        timestamp: now.toISOString(),
        overallScore,
        riskLevel,
        confidence: 0.7,
        factors: { positive: [], negative: [], neutral: [] },
        recommendations: [],
        nextCheckIn: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        trend: 'stable',
        emotionalWeather: emotional,
        metadata: {
          signalCount: signals.length,
          timeRange: { start: now.toISOString(), end: now.toISOString() },
          processingTime: 1,
        },
      };
      console.log('[Forecast] computed', { overallScore, riskLevel: forecast.riskLevel });
      // Save forecast to Firestore
      const forecastsCol = collection(db, 'burnout_forecasts');
      const forecastDoc = await addDoc(forecastsCol, {
        userId,
        overallScore: forecast.overallScore,
        riskLevel: forecast.riskLevel,
        confidence: forecast.confidence,
        factors: forecast.factors,
        nextCheckIn: Timestamp.fromDate(new Date(forecast.nextCheckIn)),
        trend: forecast.trend,
        emotionalWeather: forecast.emotionalWeather,
        signalCount: forecast.metadata.signalCount,
        timeRange: {
          start: Timestamp.fromDate(new Date(forecast.metadata.timeRange.start)),
          end: Timestamp.fromDate(new Date(forecast.metadata.timeRange.end)),
        },
        processingTime: forecast.metadata.processingTime,
        timestamp: Timestamp.fromDate(new Date(forecast.timestamp)),
      });
      console.log('[Forecast] saved', { docId: forecastDoc.id });
      return forecast;
    } catch (error) {
      console.error('❌ Error generating forecast (client mode):', error);
      throw error;
    }
  }

  /**
   * Get the latest forecast for the current user
   */
  async getLatestForecast(): Promise<BurnoutForecast | null> {
    try {
      const userId = this.getCurrentUserId();
      const qDocs = query(
        collection(db, 'burnout_forecasts'),
        where('userId', '==', userId),
        fsLimit(50)
      );
      const snap = await getDocs(qDocs);
      if (snap.empty) return null;
      // Pick the newest by timestamp
      let newest: any = null;
      snap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        const ts = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
        if (!newest) {
          newest = { d, ts };
        } else if (ts && newest.ts && ts.getTime() > newest.ts.getTime()) {
          newest = { d, ts };
        }
      });
      if (!newest) return null;
      const d = newest.d;
      const ts = newest.ts as Date;
      const nextTs = d.nextCheckIn?.toDate ? d.nextCheckIn.toDate() : new Date(d.nextCheckIn);
      const startTs = d.timeRange?.start?.toDate ? d.timeRange.start.toDate() : new Date(d.timeRange?.start);
      const endTs = d.timeRange?.end?.toDate ? d.timeRange.end.toDate() : new Date(d.timeRange?.end);
      return {
        userId: d.userId,
        timestamp: ts?.toISOString?.() ?? new Date().toISOString(),
        overallScore: d.overallScore,
        riskLevel: d.riskLevel,
        confidence: d.confidence,
        factors: d.factors ?? { positive: [], negative: [], neutral: [] },
        recommendations: [],
        nextCheckIn: nextTs?.toISOString?.() ?? new Date().toISOString(),
        trend: d.trend ?? 'stable',
        emotionalWeather: d.emotionalWeather ?? deriveEmotionalWeather(d.riskLevel, d.trend ?? 'stable'),
        metadata: {
          signalCount: d.signalCount ?? 0,
          timeRange: { start: startTs?.toISOString?.() ?? '', end: endTs?.toISOString?.() ?? '' },
          processingTime: d.processingTime ?? 0,
        },
      };
    } catch (error) {
      console.error('❌ Error getting latest forecast (client mode):', error);
      throw error;
    }
  }

  /**
   * Get forecast history for the current user
   */
  async getForecastHistory(limit: number = 10): Promise<BurnoutForecast[]> {
    try {
      const userId = this.getCurrentUserId();
      const qDocs = query(
        collection(db, 'burnout_forecasts'),
        where('userId', '==', userId),
        fsLimit(Math.max(10, limit))
      );
      const snap = await getDocs(qDocs);
      const items = snap.docs.map((doc) => {
        const d = doc.data() as any;
        const ts = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
        const nextTs = d.nextCheckIn?.toDate ? d.nextCheckIn.toDate() : new Date(d.nextCheckIn);
        const startTs = d.timeRange?.start?.toDate ? d.timeRange.start.toDate() : new Date(d.timeRange?.start);
        const endTs = d.timeRange?.end?.toDate ? d.timeRange.end.toDate() : new Date(d.timeRange?.end);
        return {
          userId: d.userId,
          timestamp: ts?.toISOString?.() ?? new Date().toISOString(),
          overallScore: d.overallScore,
          riskLevel: d.riskLevel,
          confidence: d.confidence,
          factors: d.factors ?? { positive: [], negative: [], neutral: [] },
          recommendations: [],
          nextCheckIn: nextTs?.toISOString?.() ?? new Date().toISOString(),
          trend: d.trend ?? 'stable',
          emotionalWeather: d.emotionalWeather ?? deriveEmotionalWeather(d.riskLevel, d.trend ?? 'stable'),
          metadata: {
            signalCount: d.signalCount ?? 0,
            timeRange: { start: startTs?.toISOString?.() ?? '', end: endTs?.toISOString?.() ?? '' },
            processingTime: d.processingTime ?? 0,
          },
        } as BurnoutForecast;
      });
      // Sort client-side by timestamp desc and cap to limit
      return items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting forecast history (client mode):', error);
      throw error;
    }
  }

  /**
   * Save wellness signals
   */
  async saveSignals(signals: WellnessSignal[], source: string = 'manual'): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      console.log('[Signals] writing', { userId, source, count: signals.length });
      const batch = writeBatch(db);
      signals.forEach((signal, index) => {
        const ref = doc(collection(db, 'wellness_signals'));
        batch.set(ref, {
          userId,
          type: signal.type,
          timestamp: Timestamp.fromDate(new Date(signal.timestamp)),
          value: signal.value,
          metadata: signal.metadata,
          source,
        });
      });
      await batch.commit();
      console.log('[Signals] committed');
    } catch (error) {
      console.error('❌ Error saving signals (client mode):', error);
      throw error;
    }
  }

  /**
   * Get user signals within a time range
   */
  async getUserSignals(startDate?: string, endDate?: string): Promise<WellnessSignal[]> {
    try {
      const userId = this.getCurrentUserId();
      let qBase = query(collection(db, 'wellness_signals'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
      // For simplicity, not adding timestamp filters here; can be extended if needed
      const snap = await getDocs(qBase);
      return snap.docs.map((doc) => {
        const d = doc.data() as any;
        return {
          type: d.type,
          timestamp: d.timestamp.toDate().toISOString(),
          value: d.value,
          metadata: d.metadata,
        } as WellnessSignal;
      });
    } catch (error) {
      console.error('❌ Error getting user signals (client mode):', error);
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
      if (!user?.email) throw new Error('User email not available');
      const ref = doc(db, 'users', userId);
      await setDoc(
        ref,
        {
          userId,
          email: user.email,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          preferences: profile.preferences ?? {
            checkInReminders: true,
            forecastNotifications: true,
            dataSharing: false,
          },
          profile: profile.profile ?? {},
        },
        { merge: true }
      );
    } catch (error) {
      console.error('❌ Error saving user profile (client mode):', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const userId = this.getCurrentUserId();
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const d = snap.data() as any;
      return {
        userId: d.userId,
        email: d.email,
        createdAt: d.createdAt?.toDate?.().toISOString?.() ?? new Date().toISOString(),
        lastActive: d.lastActive?.toDate?.().toISOString?.() ?? new Date().toISOString(),
        preferences: d.preferences ?? { checkInReminders: true, forecastNotifications: true, dataSharing: false },
        profile: d.profile ?? {},
      } as UserProfile;
    } catch (error) {
      console.error('❌ Error getting user profile (client mode):', error);
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

// Convenience helpers (free-tier): save a daily check-in (energy + sleep)
export async function saveDailyCheckIn(energyRating: number, sleepHours: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const dateKey = getTodayDateKeyLocal();
  const checkinId = `${user.uid}_${dateKey}`;

  // Map energy rating to labels and value
  const emotionalState = energyRating >= 4 ? 'excellent' : energyRating === 3 ? 'okay' : 'poor';
  const energyLevel = energyRating >= 4 ? 'high' : energyRating === 3 ? 'moderate' : 'low';
  const energyValue = Math.max(10, Math.min(90, energyRating * 20));
  console.log('[CheckIn] start', { uid: user.uid, energyRating, sleepHours });

  const energySignal: WellnessSignal = forecastService.createCheckInSignal(
    emotionalState,
    energyLevel,
    'low',
    energyValue
  );
  const sleepSignal: WellnessSignal = {
    type: 'sleep',
    timestamp: new Date().toISOString(),
    value: Math.max(0, Math.min(100, (sleepHours / 12) * 100)),
    metadata: {
      sleepDuration: sleepHours <= 4 ? 'very-poor' : sleepHours <= 6 ? 'insufficient' : sleepHours <= 7 ? 'adequate' : 'optimal',
      sleepQuality: sleepHours >= 7 ? 'good' : 'fair',
      hours: sleepHours,
    },
  };
  console.log('[CheckIn] signals', { energySignal, sleepSignal });

  // Save raw signals
  try {
    await forecastService.saveSignals([energySignal, sleepSignal], 'daily-checkin');
  } catch (e) {
    console.error('[CheckIn] saveSignals failed', e);
  }
  console.log('[CheckIn] signals saved');

  // Save a summarized daily_checkins document for easier queries
  // Check existence via query (compatible with read rules)
  const existsQ = query(
    collection(db, 'daily_checkins'),
    where('userId', '==', user.uid),
    where('dateKey', '==', dateKey),
    fsLimit(1)
  );
  const existsSnap = await getDocs(existsQ);
  if (!existsSnap.empty) {
    console.log('[CheckIn] already exists for date', { dateKey });
    throw new Error('DAILY_CHECKIN_EXISTS');
  }
  const ref = doc(collection(db, 'daily_checkins'), checkinId);
  try {
    await setDoc(ref, {
    userId: user.uid,
    dateKey,
    timestamp: Timestamp.fromDate(new Date()),
    energyRating,
    energyValue,
    energyLabel: emotionalState,
    sleepHours,
    sleepPercent: Math.max(0, Math.min(100, (sleepHours / 12) * 100)),
    source: 'daily-checkin',
    });
    console.log('[CheckIn] daily_checkins saved', { docId: checkinId });
  } catch (e) {
    console.error('[CheckIn] daily_checkins write failed', e);
    throw e;
  }

  // Optionally compute and store a simple forecast based on these inputs
  try {
    const forecast = await forecastService.generateForecast([energySignal, sleepSignal]);
    console.log('[CheckIn] forecast done', { overallScore: forecast.overallScore, riskLevel: forecast.riskLevel });
  } catch (e) {
    console.error('[CheckIn] forecast failed', e);
  }
}

export async function hasDailyCheckInToday(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const dateKey = getTodayDateKeyLocal();
  const q = query(
    collection(db, 'daily_checkins'),
    where('userId', '==', user.uid),
    where('dateKey', '==', dateKey),
    fsLimit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

function getTodayDateKeyLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function deriveEmotionalWeather(
  risk: BurnoutForecast['riskLevel'],
  trend: BurnoutForecast['trend']
): { label: string; description: string; intensity: 'calm' | 'mild' | 'moderate' | 'stormy' | 'critical'; icon: string } {
  if (risk === 'low') {
    return {
      label: trend === 'improving' ? 'Clear Skies' : 'Mostly Sunny',
      description: 'Energy is balanced and stress is manageable.',
      intensity: 'calm',
      icon: '☀️',
    };
  }
  if (risk === 'moderate') {
    return {
      label: trend === 'declining' ? 'Cloudy with Rising Tension' : 'Partly Cloudy',
      description: 'Noticeable stress signals. Plan recovery blocks.',
      intensity: 'moderate',
      icon: '⛅',
    };
  }
  if (risk === 'high') {
    return {
      label: 'Storm Watch',
      description: 'Stress accumulation detected. Prioritize recovery today.',
      intensity: 'stormy',
      icon: '🌧️',
    };
  }
  return {
    label: 'Critical Storm',
    description: 'High risk. Reduce load and seek support.',
    intensity: 'critical',
    icon: '⛈️',
  };
}

// Seeder utilities for charts (sleep and meetings)
export async function seedDummyDailyData(count: number = 50): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const day = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    const y = day.getFullYear();
    const m = `${day.getMonth() + 1}`.padStart(2, '0');
    const d = `${day.getDate()}`.padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const energyRating = 1 + Math.floor(Math.random() * 5); // 1..5
    const sleepHours = Math.max(4, Math.min(10, Math.round(4 + Math.random() * 6)));

    // daily_checkins doc
    const checkinId = `${user.uid}_${dateKey}`;
    const ref = doc(collection(db, 'daily_checkins'), checkinId);
    await setDoc(ref, {
      userId: user.uid,
      dateKey,
      timestamp: Timestamp.fromDate(day),
      energyRating,
      energyValue: Math.max(10, Math.min(90, energyRating * 20)),
      energyLabel: energyRating >= 4 ? 'excellent' : energyRating === 3 ? 'okay' : 'poor',
      sleepHours,
      sleepPercent: Math.round((sleepHours / 12) * 100),
      source: 'seed',
    }, { merge: true });

    // meetings_daily doc
    const meetings = Math.floor(Math.random() * 8); // 0..7
    const mRef = doc(collection(db, 'meetings_daily'), `${user.uid}_${dateKey}`);
    await setDoc(mRef, {
      userId: user.uid,
      dateKey,
      timestamp: Timestamp.fromDate(day),
      count: meetings,
      source: 'seed',
    }, { merge: true });
  }
  console.log('[Seed] Inserted dummy daily data:', count);
}