import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { collection, getDocs, query, where, orderBy, limit as fsLimit } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';
import { generateMirrorRecommendations, type MirrorRecommendation } from '../services/recommendation-service';
import { useFocusEffect } from '@react-navigation/native';
import { buildLastNDates, getSleepDataForDateRange } from '../services/forecast-service';

interface BurnoutMirrorData {
  Recommendations: string;
  sleepAmount: number;
  sleepQuality: number;
  sleepDuration: number;
  sleepTime: number;
  meetingsAmount: number;
  meetingsFrequency: number;
}

interface BurnoutMirrorScreenProps {
  headerTitle?: string;
}

export default function BurnoutMirrorScreen({ headerTitle = "Burnout Mirror" }: BurnoutMirrorScreenProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMeetingDay, setSelectedMeetingDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<MirrorRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState<boolean>(true);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [labels, setLabels] = useState<string[]>([]); // last 7 day labels (Sun..Sat)
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

        // Use shared utility function for consistent data
        const { sleepData: sleepSeries, meetingsData: meetingsSeries } = await getSleepDataForDateRange(7);
        
        // Set labels from the shared function
        const last7 = buildLastNDates(7);
        setLabels(last7.map((d) => d.label));
        
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

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          setLoading(true);
          setRecsLoading(true);
          setError(null);
          setRecsError(null);
          const user = auth.currentUser;
          if (!user) {
            setError('Not authenticated');
            setLoading(false);
            setRecsLoading(false);
            return;
          }

          // Use shared utility function for consistent data
          const { sleepData: sleepSeries, meetingsData: meetingsSeries } = await getSleepDataForDateRange(7);
          
          // Set labels from the shared function
          const last7 = buildLastNDates(7);
          setLabels(last7.map((d) => d.label));
          
          setSleepData(sleepSeries);
          setMeetingsData(meetingsSeries);
          
          // Also refresh recommendations
          try {
            const r = await generateMirrorRecommendations();
            setRecs(r);
          } catch (e) {
            console.warn('[Mirror] Failed to refresh recommendations', e);
            setRecsError('Failed to refresh recommendations');
          }
          
        } catch (e) {
          console.warn('Failed to refresh burnout mirror data', e);
          setError('Failed to refresh');
        } finally {
          setLoading(false);
          setRecsLoading(false);
        }
      };
      refreshData();
    }, [])
  );

  const handleBarPress = (day: string, hours: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const handleMeetingBarPress = (day: string, meetings: number) => {
    setSelectedMeetingDay(selectedMeetingDay === day ? null : day);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setLoading(true);
      setRecsLoading(true);
      setError(null);
      setRecsError(null);
      const user = auth.currentUser;
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        setRecsLoading(false);
        setRefreshing(false);
        return;
      }

      // Use shared utility function for consistent data
      const { sleepData: sleepSeries, meetingsData: meetingsSeries } = await getSleepDataForDateRange(7);
      
      // Set labels from the shared function
      const last7 = buildLastNDates(7);
      setLabels(last7.map((d) => d.label));
      
      setSleepData(sleepSeries);
      setMeetingsData(meetingsSeries);
      
      // Also refresh recommendations
      try {
        const r = await generateMirrorRecommendations();
        setRecs(r);
      } catch (e) {
        console.warn('[Mirror] Failed to refresh recommendations', e);
        setRecsError('Failed to refresh recommendations');
      }
      
    } catch (e) {
      console.warn('Failed to refresh burnout mirror data', e);
      setError('Failed to refresh');
    } finally {
      setLoading(false);
      setRecsLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <PersistentHeader title={headerTitle} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.mainTitle}>Today's Insight</Text>

        <View style={styles.insightContainer}>
          {/* Insight Bubble (Recommendations) */}
          <View style={styles.insightBubble}>
            {recsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : recsError ? (
              <Text style={styles.errorText}>{recsError}</Text>
            ) : recs.length > 0 ? (
              <View>
                <Text style={styles.insightTitle}>Today's Insight</Text>
                <View style={styles.insightList}>
                  {recs.slice(0, 3).map((r, idx) => (
                    <Text key={idx} style={styles.insightItem}>
                      • {r.text}
                    </Text>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.noInsightText}>No insights available</Text>
            )}
            
            {/* Speech Bubble Tail */}
            <View style={styles.bubbleTail} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.chartsContainer}>
          {/* Sleep Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartIcon}>🌙</Text>
              <Text style={styles.chartTitle}>Sleep Analytics</Text>
            </View>
            
            <View style={styles.chartStats}>
              <Text style={styles.chartStatText}>
                Average <Text style={styles.chartStatValue}>{avgSleepHours(sleepData)}</Text>
              </Text>
            </View>
            
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {sleepData.map((data) => (
                  <View key={data.day} style={styles.barContainer}>
                    {/* Value Label */}
                    {selectedDay === data.day && (
                      <Text style={styles.barValueLabel}>
                        {data.hours.toFixed(1)}h
                      </Text>
                    )}
                    {/* Bar */}
                    <TouchableOpacity
                      onPress={() => handleBarPress(data.day, data.hours)}
                      style={[
                        styles.chartBar,
                        selectedDay === data.day && styles.chartBarSelected,
                        { height: barHeight(data.hours, sleepData, 120) }
                      ]}
                      activeOpacity={0.8}
                    />
                    {/* Day Label */}
                    <Text style={styles.barDayLabel}>{data.day}</Text>
                  </View>
                ))}
              </View>
              {/* Average Line */}
              <View style={styles.averageLine} />
            </View>
          </View>

          {/* Meetings Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartIcon}>📅</Text>
              <Text style={styles.chartTitle}>Meetings Analytics</Text>
            </View>
            
            <View style={styles.chartStats}>
              <Text style={styles.chartStatText}>
                Average <Text style={styles.chartStatValue}>{avgMeetings(meetingsData)}</Text> meetings/day
              </Text>
            </View>
            
            <View style={styles.chartContainer}>
              <View style={styles.chartBars}>
                {meetingsData.map((data) => (
                  <View key={data.day} style={styles.barContainer}>
                    {/* Value Label */}
                    {selectedMeetingDay === data.day && (
                      <Text style={styles.barValueLabel}>
                        {data.meetings}
                      </Text>
                    )}
                    {/* Bar */}
                    <TouchableOpacity
                      onPress={() => handleMeetingBarPress(data.day, data.meetings)}
                      style={[
                        styles.chartBar,
                        selectedMeetingDay === data.day && styles.chartBarSelected,
                        { height: barHeight(data.meetings, meetingsData, 120) }
                      ]}
                      activeOpacity={0.8}
                    />
                    {/* Day Label */}
                    <Text style={styles.barDayLabel}>{data.day}</Text>
                  </View>
                ))}
              </View>
              {/* Average Line */}
              <View style={styles.averageLine} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  insightContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  insightBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 130,
    paddingHorizontal: 20,
    paddingVertical: 20,
    position: 'relative',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  insightList: {
    gap: 8,
  },
  insightItem: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  noInsightText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    top: -8,
    left: 32,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderLeftColor: 'transparent',
    borderRightWidth: 20,
    borderRightColor: 'transparent',
    borderBottomWidth: 12,
    borderBottomColor: '#000',
  },
  divider: {
    marginTop: 40,
    marginHorizontal: 16,
    height: 1,
    backgroundColor: '#000',
    marginBottom: 8,
  },
  chartsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 20,
    marginBottom: 20,
    minHeight: 320,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  chartIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  chartStats: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chartStatText: {
    fontSize: 16,
    color: '#000',
  },
  chartStatValue: {
    fontWeight: 'bold',
    color: '#000',
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barValueLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
  chartBar: {
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
    width: 24,
    marginBottom: 8,
    minHeight: 8,
  },
  chartBarSelected: {
    backgroundColor: '#9ca3af',
    borderColor: '#000',
  },
  barDayLabel: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  averageLine: {
    borderTopWidth: 2,
    borderTopColor: '#000',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
});
