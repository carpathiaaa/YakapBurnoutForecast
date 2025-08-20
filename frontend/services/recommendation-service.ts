import { auth, db } from './firebase';
import { collection, getDocs, query, where, limit as fsLimit } from 'firebase/firestore';
import { forecastService, getSleepDataForDateRange, calculateSleepDelta } from './forecast-service';

export interface MirrorRecommendation {
  text: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
}

type Trend = 'up' | 'down' | 'even' | 'unknown';

export async function generateMirrorRecommendations(): Promise<MirrorRecommendation[]> {
  const user = auth.currentUser;
  if (!user) return [];

  // Fetch latest forecast and sleep data using unified functions
  const [forecast, sleepDataResult] = await Promise.all([
    forecastService.getLatestForecast(),
    getSleepDataForDateRange(7), // Use 7 days for consistency
  ]);

  // Use the unified sleep delta calculation
  const sleepDelta = calculateSleepDelta(sleepDataResult.sleepData);
  
  // Calculate meetings delta using the same logic
  const meetingsDelta = calculateMeetingsDelta(sleepDataResult.meetingsData);

  const recs: MirrorRecommendation[] = [];

  // Sleep-focused recs
  if (sleepDelta.deltaPct !== null) {
    if (sleepDelta.direction === 'down' && sleepDelta.deltaPct >= 10) {
      recs.push({
        text: `Sleep is down ${sleepDelta.deltaPct}% vs usual. Schedule a 20–30 minute recovery block and target an earlier wind-down tonight.`,
        category: 'immediate',
        priority: 'high',
      });
    } else if (sleepDelta.direction === 'up' && sleepDelta.deltaPct >= 10) {
      recs.push({
        text: `Great sleep (+${sleepDelta.deltaPct}%). Protect this pattern by keeping your sleep window consistent.`,
        category: 'short-term',
        priority: 'medium',
      });
    }
  }

  // Meetings-focused recs
  if (meetingsDelta.deltaPct !== null) {
    if (meetingsDelta.direction === 'up' && meetingsDelta.deltaPct >= 20) {
      recs.push({
        text: `Meetings up ${meetingsDelta.deltaPct}% vs usual. Decline low-priority invites and block 60–90 minutes of focus time.`,
        category: 'immediate',
        priority: 'high',
      });
    } else if (meetingsDelta.direction === 'down' && meetingsDelta.deltaPct >= 20) {
      recs.push({
        text: `Fewer meetings (−${meetingsDelta.deltaPct}%). Use this window to make progress on a deep-work task.`,
        category: 'short-term',
        priority: 'medium',
      });
    }
  }

  // Risk-based recs
  if (forecast) {
    if (forecast.riskLevel === 'high' || forecast.riskLevel === 'critical') {
      recs.push({
        text: 'High risk detected. Reduce workload for 24 hours and add two short restorative breaks.',
        category: 'immediate',
        priority: 'high',
      });
    } else if (forecast.riskLevel === 'moderate') {
      recs.push({
        text: 'Moderate risk. Plan one 30-minute walk or light exercise today to reset.',
        category: 'short-term',
        priority: 'medium',
      });
    } else {
      recs.push({
        text: 'Low risk. Maintain your current routines and do a quick check-in this evening.',
        category: 'long-term',
        priority: 'low',
      });
    }
  }

  // Ensure at least 3 suggestions
  while (recs.length < 3) {
    recs.push({
      text: 'Consider taking a 5-minute break to stretch and reset your focus.',
      category: 'immediate',
      priority: 'low',
    });
  }

  return recs.slice(0, 3);
}

// Helper function to calculate meetings delta using the same logic as sleep delta
function calculateMeetingsDelta(meetingsData: { day: string; meetings: number }[]): {
  deltaPct: number | null;
  direction: 'up' | 'down' | 'even' | null;
  todayMeetings: number;
  averageMeetings: number;
} {
  if (!meetingsData || meetingsData.length === 0) {
    return { deltaPct: null, direction: null, todayMeetings: 0, averageMeetings: 0 };
  }

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0-6
  
  // Map day of week to our fixed labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayLabel = dayLabels[todayDayOfWeek];
  
  // Find today's data in the array
  const todayData = meetingsData.find(d => d.day === todayLabel);
  const todayMeetings = todayData?.meetings || 0;

  // Get baseline data (all days except today with valid meetings data)
  const baselineData = meetingsData
    .filter(d => d.day !== todayLabel && d.meetings > 0); // Exclude today and days with no data

  if (baselineData.length === 0 || todayMeetings === 0) {
    return { deltaPct: null, direction: null, todayMeetings, averageMeetings: 0 };
  }

  // Calculate average baseline meetings
  const totalBaselineMeetings = baselineData.reduce((sum, d) => sum + d.meetings, 0);
  const averageMeetings = totalBaselineMeetings / baselineData.length;

  if (averageMeetings === 0) {
    return { deltaPct: null, direction: null, todayMeetings, averageMeetings: 0 };
  }

  // Calculate delta
  const diff = todayMeetings - averageMeetings;
  const deltaPct = Math.round((Math.abs(diff) / averageMeetings) * 100);
  
  // Determine direction
  let direction: 'up' | 'down' | 'even';
  if (diff > 0) {
    direction = 'up';
  } else if (diff < 0) {
    direction = 'down';
  } else {
    direction = 'even';
  }

  return { deltaPct, direction, todayMeetings, averageMeetings };
}


