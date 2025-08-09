import * as functions from 'firebase-functions';
import { BurnoutForecastEngine } from '../ml/heuristics/forecast-engine';
import { ForecastService } from '../firestore/forecast-service';
import { WellnessSignal } from '../ml/heuristics/scoring-rubric';

// Cloud Function (Gen 1) to generate burnout forecast
export const generateForecast = functions
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
      const forecastEngine = new BurnoutForecastEngine(config);
      const forecastService = new ForecastService();
      
      // Convert signals to proper format
      const wellnessSignals: WellnessSignal[] = signals.map((signal: any) => ({
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
      
    } catch (error) {
      console.error('❌ Error generating forecast:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

// Cloud Function (Gen 1) to get latest forecast
export const getLatestForecast = functions
  .region('us-central1')
  .runWith({ memory: '128MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    try {
      const { userId } = data || {};
      
      if (!userId) {
        throw new Error('userId is required');
      }
      
      const forecastService = new ForecastService();
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
      
    } catch (error) {
      console.error('❌ Error getting latest forecast:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

// Cloud Function (Gen 1) to get forecast history
export const getForecastHistory = functions
  .region('us-central1')
  .runWith({ memory: '128MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    try {
      const { userId, limit = 10 } = data || {};
      
      if (!userId) {
        throw new Error('userId is required');
      }
      
      const forecastService = new ForecastService();
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
      
    } catch (error) {
      console.error('❌ Error getting forecast history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

// Cloud Function (Gen 1) to save wellness signals
export const saveSignals = functions
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
      
      const forecastService = new ForecastService();
      
      // Convert signals to proper format
      const wellnessSignals: WellnessSignal[] = signals.map((signal: any) => ({
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
      
    } catch (error) {
      console.error('❌ Error saving signals:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

// Cloud Function (Gen 1) to get user signals
export const getUserSignals = functions
  .region('us-central1')
  .runWith({ memory: '128MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    try {
      const { userId, startDate, endDate } = data || {};
      
      if (!userId) {
        throw new Error('userId is required');
      }
      
      const forecastService = new ForecastService();
      
      let signals;
      if (startDate && endDate) {
        signals = await forecastService.getSignals(
          userId, 
          new Date(startDate), 
          new Date(endDate)
        );
      } else {
        signals = await forecastService.getAllSignals(userId);
      }
      
      return {
        success: true,
        signals: signals.map(signal => ({
          ...signal,
          timestamp: signal.timestamp.toISOString()
        }))
      };
      
    } catch (error) {
      console.error('❌ Error getting user signals:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

// Cloud Function (Gen 1) to save user profile
export const saveUserProfile = functions
  .region('us-central1')
  .runWith({ memory: '128MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    try {
      const { userId, email, profile, preferences } = data || {};
      
      if (!userId || !email) {
        throw new Error('userId and email are required');
      }
      
      const forecastService = new ForecastService();
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
      
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

// Cloud Function (Gen 1) to get user profile
export const getUserProfile = functions
  .region('us-central1')
  .runWith({ memory: '128MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    try {
      const { userId } = data || {};
      
      if (!userId) {
        throw new Error('userId is required');
      }
      
      const forecastService = new ForecastService();
      const user = await forecastService.getUser(userId);
      
      return {
        success: true,
        user: user ? {
          ...user,
          createdAt: user.createdAt.toDate().toISOString(),
          lastActive: user.lastActive.toDate().toISOString()
        } : null
      };
      
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });