import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where, orderBy, limit as fsLimit } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';
import { generateMirrorRecommendations, type MirrorRecommendation } from '../services/recommendation-service';

interface BurnoutMirrorData {
  Recommendations: string;
  sleepAmount: number;
  sleepQuality: number;
  sleepDuration: number;
  sleepTime: number;
  meetingsAmount: number;
  meetingsFrequency: number;
}

export default function BurnoutMirrorScreen() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMeetingDay, setSelectedMeetingDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<MirrorRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState<boolean>(true);
  const [recsError, setRecsError] = useState<string | null>(null);

  const [labels, setLabels] = useState<string[]>([]); // last 7 day labels (Mon..Sun)
  const [sleepData, setSleepData] = useState<{ day: string; hours: number }[]>([]);
  const [meetingsData, setMeetingsData] = useState<{ day: string; meetings: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const user = auth.currentUser;
        if (!user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Build last 7 local date keys and day labels
        const last7 = buildLastNDates(7);
        setLabels(last7.map((d) => d.label));

        // Fetch recent docs (last 30) and reduce to last 7 days
        const dcQ = query(
          collection(db, 'daily_checkins'),
          where('userId', '==', user.uid),
          fsLimit(50)
        );
        // Note: Some seeded docs might lack timestamp ordering; we primarily filter by userId
        const mdQ = query(
          collection(db, 'meetings_daily'),
          where('userId', '==', user.uid),
          fsLimit(50)
        );
        const [dcSnap, mdSnap] = await Promise.all([getDocs(dcQ), getDocs(mdQ)]);

        const byKeySleep: Record<string, number> = {};
        dcSnap.forEach((docSnap) => {
          const d = docSnap.data() as any;
          const key: string | undefined = d.dateKey || ''; // prefer dateKey written by our client
          if (!key) return;
          byKeySleep[key] = Number(d.sleepHours) || 0;
        });

        const byKeyMeetings: Record<string, number> = {};
        mdSnap.forEach((docSnap) => {
          const d = docSnap.data() as any;
          // Prefer explicit dateKey; fallback to timestamp-derived key
          let key: string | undefined = d.dateKey;
          if (!key) {
            const ts: any = d.timestamp;
            const date: Date | null = (ts?.toDate && ts.toDate()) || (ts ? new Date(ts) : null);
            if (date) {
              const y = date.getFullYear();
              const m = `${date.getMonth() + 1}`.padStart(2, '0');
              const dd = `${date.getDate()}`.padStart(2, '0');
              key = `${y}-${m}-${dd}`;
            }
          }
          if (!key) return;
          const meetingsValue = d.count ?? d.meetings; // support both field names
          byKeyMeetings[key] = Number(meetingsValue) || 0;
        });

        const sleepSeries = last7.map((d) => ({ day: d.label, hours: byKeySleep[d.key] ?? 0 }));
        const meetingsSeries = last7.map((d) => ({ day: d.label, meetings: byKeyMeetings[d.key] ?? 0 }));
        setSleepData(sleepSeries);
        setMeetingsData(meetingsSeries);
      } catch (e) {
        console.warn('Failed to load burnout mirror data', e);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load recommendations for the insight bubble
  useEffect(() => {
    const run = async () => {
      try {
        setRecsLoading(true);
        setRecsError(null);
        const r = await generateMirrorRecommendations();
        setRecs(r);
      } catch (e) {
        console.warn('[Mirror] Failed to generate recommendations', e);
        setRecsError('Failed to load recommendations');
      } finally {
        setRecsLoading(false);
      }
    };
    run();
  }, []);

  const getWeekdayIndex = (date: Date): number => {
    const js = date.getDay();
    return js === 0 ? 6 : js - 1;
  };

  function buildLastNDates(n: number): { key: string; label: string }[] {
    const out: { key: string; label: string }[] = [];
    const names = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const dd = `${d.getDate()}`.padStart(2, '0');
      const key = `${y}-${m}-${dd}`;
      const label = names[getWeekdayIndex(d)];
      out.push({ key, label });
    }
    return out;
  }

  const handleBarPress = (day: string, hours: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const handleMeetingBarPress = (day: string, meetings: number) => {
    setSelectedMeetingDay(selectedMeetingDay === day ? null : day);
  };

  return (
    <View className = "flex-1 bg-[#F8F8F8]">
      <PersistentHeader />
      <ScrollView>
        <Text className = "text-2xl font-bold text-black text-center mt-5">Today's Insight</Text>


        <View className="mx-4 mt-4">
          {/* Insight Bubble (Recommendations) */}
          <View className="bg-white rounded-2xl border-2 border-black shadow min-h-[130px] relative px-4 py-5">
            {recsLoading ? (
              <View className="items-center justify-center py-4">
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : recsError ? (
              <Text className="text-sm text-red-500 text-center">{recsError}</Text>
            ) : recs.length > 0 ? (
              <View>
                <Text className="text-lg font-bold text-black text-center mb-2">Today's Insight</Text>
                <View className="gap-1">
                  {recs.slice(0, 3).map((r, idx) => (
                    <Text key={idx} className="text-sm text-black leading-5">
                      • {r.text}
                    </Text>
                  ))}
                </View>
              </View>
            ) : (
              <Text className="text-sm text-gray-600 text-center">No insights available</Text>
            )}
            
            {/* Speech Bubble Tail - Black base */}
            <View 
              className="absolute -top-4 left-8 w-0 h-0 border-l-[12px] border-l-transparent border-r-[20px] border-r-transparent border-b-[12px] border-b-black"
            />
            {/* Speech Bubble Tail - White overlay */}
            <View 
              className="absolute -top-3 left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[18px] border-r-transparent border-b-[10px] border-b-[#F8F8F8]"
            />
          </View>
        </View>

      <View className="mt-10 mx-4 h-0.5 bg-black mb-2" />

             <View className="mx-4 mt-4">
              <View className="flex-1 bg-white rounded-3xl border-2 border-black p-4 h-[300px] mb-4">
               {/* Sleep Title Pill */}
               <View className="bg-gray-200 rounded-full border-2 border-black p-3 h-[50px] flex-row items-center mb-4">
                 <Text className="text-2xl mr-2">🌙</Text>
                 <Text className="text-lg font-bold text-black">Sleep</Text>
               </View>
               
               {/* Sleep Average */}
               <View className="items-center mb-6">
                  <Text className="text-lg text-black">
                    Average <Text className="font-bold">{avgSleepHours(sleepData)}</Text>
                  </Text>
               </View>
               
                               {/* Sleep Chart */}
                <View className="flex-1 justify-end">
                  <View className="flex-row justify-between items-end h-40 mb-2 px-2">
                    {sleepData.map((data) => (
                      <View key={data.day} className="items-center">
                        {/* Hours Text */}
                        {selectedDay === data.day && (
                          <Text className="text-xs font-bold text-black mb-1">
                            {data.hours}h
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => handleBarPress(data.day, data.hours)}
                          className={`bg-gray-200 border-2 border-black w-8 mb-1 ${selectedDay === data.day ? 'bg-blue-200' : ''}`}
                          style={{ height: barHeight(data.hours, sleepData, 140) }}
                          activeOpacity={0.7}
                        />
                        <Text className="text-xs text-black">{data.day}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Average Line */}
                  <View className="border-t-2 border-dashed border-black mx-2" />
                </View>
             </View>
 
                           <View className="flex-1 bg-white rounded-3xl border-2 border-black p-4 h-[300px]">
                {/* Meetings Title Pill */}
                <View className="bg-gray-200 rounded-full border-2 border-black p-3 h-[50px] flex-row items-center mb-4">
                  <Text className="text-2xl mr-2">📅</Text>
                  <Text className="text-lg font-bold text-black">Meetings</Text>
                </View>
                
                {/* Meetings Average */}
                <View className="items-center mb-6">
                  <Text className="text-lg text-black">
                    Average <Text className="font-bold">{avgMeetings(meetingsData)}</Text> meetings/day
                  </Text>
                </View>
                
                {/* Meetings Chart */}
                <View className="flex-1 justify-end">
                  <View className="flex-row justify-between items-end h-40 mb-2 px-2">
                    {meetingsData.map((data) => (
                      <View key={data.day} className="items-center">
                        {/* Meetings Count Text */}
                        {selectedMeetingDay === data.day && (
                          <Text className="text-xs font-bold text-black mb-1">
                            {data.meetings}
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => handleMeetingBarPress(data.day, data.meetings)}
                          className={`bg-gray-200 border-2 border-black w-8 mb-1 ${selectedMeetingDay === data.day ? 'bg-blue-200' : ''}`}
                          style={{ height: barHeight(data.meetings, meetingsData, 140) }}
                          activeOpacity={0.7}
                        />
                        <Text className="text-xs text-black">{data.day}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Average Line */}
                  <View className="border-t-2 border-dashed border-black mx-2" />
                </View>
              </View>
 
         </View>

      </ScrollView>

    </View>
  );
}

function avgSleepHours(data: { hours: number }[]): string {
  if (!data.length) return '0 h 0 min';
  const values = data.map((d) => Number(d.hours) || 0);
  const sum = values.reduce((s, v) => s + v, 0);
  const avg = values.length ? sum / values.length : 0;
  return formatHours(avg);
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h} h ${m}`;
}

function avgMeetings(data: { meetings: number }[]): number {
  if (!data.length) return 0;
  const values = data.map((d) => Number(d.meetings) || 0);
  const sum = values.reduce((s, v) => s + v, 0);
  const avg = values.length ? sum / values.length : 0;
  return Math.round(avg * 10) / 10;
}

function barHeight(value: number, arr: { [k: string]: any }[], maxPx: number): number {
  const values = arr.map((a: any) => Number(a.hours ?? a.meetings ?? 0) || 0);
  const maxVal = Math.max(1, ...values);
  const num = Number(value) || 0;
  const ratio = Math.max(0.08, Math.min(1, num / maxVal));
  return Math.round(ratio * maxPx);
}
