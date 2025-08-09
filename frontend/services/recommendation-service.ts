import { collection, getDocs, query, where, limit as fsLimit } from 'firebase/firestore';
import { db, auth } from './firebase';
import { forecastService } from './forecast-service';

export type MirrorRecommendation = {
  text: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
};

type Trend = 'up' | 'down' | 'even' | 'unknown';

function computePercentDelta(today: number, baselineValues: number[]): { pct: number | null; dir: Trend } {
  const valid = baselineValues.filter((v) => v > 0);
  if (today <= 0 || valid.length === 0) return { pct: null, dir: 'unknown' };
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  if (avg <= 0) return { pct: null, dir: 'unknown' };
  const diff = today - avg;
  const pct = Math.round((Math.abs(diff) / avg) * 100);
  return { pct, dir: diff === 0 ? 'even' : diff > 0 ? 'up' : 'down' };
}

function buildDateKeys(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dd = `${d.getDate()}`.padStart(2, '0');
    out.push(`${y}-${m}-${dd}`);
  }
  return out;
}

export async function generateMirrorRecommendations(): Promise<MirrorRecommendation[]> {
  const user = auth.currentUser;
  if (!user) return [];

  // Fetch latest forecast and last ~50 daily docs
  const [forecast, dcSnap, mdSnap] = await Promise.all([
    forecastService.getLatestForecast(),
    getDocs(query(collection(db, 'daily_checkins'), where('userId', '==', user.uid), fsLimit(50))),
    getDocs(query(collection(db, 'meetings_daily'), where('userId', '==', user.uid), fsLimit(50))),
  ]);

  const keys = buildDateKeys(8); // today + last 7
  const todayKey = keys[0];
  const baselineKeys = keys.slice(1);

  const byKeySleep: Record<string, number> = {};
  dcSnap.forEach((doc) => {
    const d = doc.data() as any;
    const key = d.dateKey as string | undefined;
    if (key) byKeySleep[key] = Number(d.sleepHours) || 0;
  });
  const todaySleep = byKeySleep[todayKey] || 0;
  const baselineSleep = baselineKeys.map((k) => byKeySleep[k] || 0);
  const sleepDelta = computePercentDelta(todaySleep, baselineSleep);

  const byKeyMeet: Record<string, number> = {};
  mdSnap.forEach((doc) => {
    const d = doc.data() as any;
    const key = (d.dateKey as string) || '';
    if (key) byKeyMeet[key] = Number(d.count ?? d.meetings) || 0;
  });
  const todayMeet = byKeyMeet[todayKey] || 0;
  const baselineMeet = baselineKeys.map((k) => byKeyMeet[k] || 0);
  const meetDelta = computePercentDelta(todayMeet, baselineMeet);

  const recs: MirrorRecommendation[] = [];

  // Sleep-focused recs
  if (sleepDelta.pct !== null) {
    if (sleepDelta.dir === 'down' && sleepDelta.pct >= 10) {
      recs.push({
        text: `Sleep is down ${sleepDelta.pct}% vs usual. Schedule a 20–30 minute recovery block and target an earlier wind-down tonight.`,
        category: 'immediate',
        priority: 'high',
      });
    } else if (sleepDelta.dir === 'up' && sleepDelta.pct >= 10) {
      recs.push({
        text: `Great sleep (+${sleepDelta.pct}%). Protect this pattern by keeping your sleep window consistent.`,
        category: 'short-term',
        priority: 'medium',
      });
    }
  }

  // Meetings-focused recs
  if (meetDelta.pct !== null) {
    if (meetDelta.dir === 'up' && meetDelta.pct >= 20) {
      recs.push({
        text: `Meetings up ${meetDelta.pct}% vs usual. Decline low-priority invites and block 60–90 minutes of focus time.`,
        category: 'immediate',
        priority: 'high',
      });
    } else if (meetDelta.dir === 'down' && meetDelta.pct >= 20) {
      recs.push({
        text: `Fewer meetings (−${meetDelta.pct}%). Use this window to make progress on a deep-work task.`,
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
      text: 'Take a 5-minute breath or stretch break between tasks to reset attention.',
      category: 'short-term',
      priority: 'low',
    });
  }

  return recs.slice(0, 5);
}


