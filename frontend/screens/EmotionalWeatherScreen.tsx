import React from 'react';
import { useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import { collection, getDocs, query, where, limit as fsLimit } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';
import { fetchTrelloData, TrelloData, getUrgencyColor } from '../services/trello-service';
import { forecastService, BurnoutForecast } from '../services/forecast-service';


interface EmotionalWeatherData {
  currentMood: string;
  energyLevel: number;
  stressLevel: number;
  weatherConditions: string;
  forecast: string
}

export default function EmotionalWeatherScreen() {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: {errors, isSubmitting, isDirty, isValid},
    reset,
  } = useForm<EmotionalWeatherData>({
    defaultValues: {
      currentMood: 'Neutral',
      energyLevel: 5,
      stressLevel: 3,
      weatherConditions: 'Partly Cloudy',
      forecast: ''
    }
  })

  const watchedValues = watch();
  const [selectedDay, setSelectedDay] = useState('M'); // Monday as default
  const [trelloData, setTrelloData] = useState<TrelloData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestForecast, setLatestForecast] = useState<BurnoutForecast | null>(null);
  const [sleepDeltaPct, setSleepDeltaPct] = useState<number | null>(null);
  const [sleepDirection, setSleepDirection] = useState<'up' | 'down' | 'even' | null>(null);
  
  const daysOfWeek = [
    { key: 'M', label: 'M' },
    { key: 'T', label: 'T' },
    { key: 'W', label: 'W' },
    { key: 'Th', label: 'Th' },
    { key: 'F', label: 'F' },
    { key: 'Sa', label: 'Sa' },
    { key: 'Su', label: 'Su' }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        const [data, forecast, sleepSnap] = await Promise.all([
          fetchTrelloData(),
          forecastService.getLatestForecast(),
          user
            ? getDocs(
                query(
                  collection(db, 'daily_checkins'),
                  where('userId', '==', user.uid),
                  fsLimit(50)
                )
              )
            : Promise.resolve(null as any),
        ]);
        setTrelloData(data);
        setLatestForecast(forecast);
        if (sleepSnap) {
          // Build keys for today and previous 7 days
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const keys: string[] = [];
          for (let i = 0; i <= 7; i++) {
            const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const y = d.getFullYear();
            const m = `${d.getMonth() + 1}`.padStart(2, '0');
            const dd = `${d.getDate()}`.padStart(2, '0');
            keys.push(`${y}-${m}-${dd}`);
          }
          const todayKey = keys[0];
          const baselineKeys = keys.slice(1); // previous 7 days
          const byKey: Record<string, number> = {};
          sleepSnap.forEach((docSnap: any) => {
            const d = docSnap.data();
            const key = d.dateKey as string | undefined;
            const hours = Number(d.sleepHours) || 0;
            if (key) byKey[key] = hours;
          });
          const todayHours = byKey[todayKey];
          const baselineValues = baselineKeys.map((k) => Number(byKey[k]) || 0).filter((v) => v > 0);
          if (todayHours > 0 && baselineValues.length > 0) {
            const avg = baselineValues.reduce((s, v) => s + v, 0) / baselineValues.length;
            if (avg > 0) {
              const diff = todayHours - avg;
              const pct = Math.round((Math.abs(diff) / avg) * 100);
              setSleepDeltaPct(pct);
              setSleepDirection(diff >= 0 ? (diff === 0 ? 'even' : 'up') : 'down');
            } else {
              setSleepDeltaPct(null);
              setSleepDirection(null);
            }
          } else {
            setSleepDeltaPct(null);
            setSleepDirection(null);
          }
        }
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getTasksForSelectedDay = () => {
    if (!trelloData) return 0;
    
    // Map selected day to actual date
    const today = new Date();
    const dayIndex = daysOfWeek.findIndex(day => day.key === selectedDay);
    if (dayIndex === -1) return 0;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayIndex);
    const dateString = targetDate.toISOString().split('T')[0];
    
    return trelloData.tasksByWeek[dateString] || 0;
  };

  const getUrgencySummary = () => {
    if (!trelloData) return { total: 0, urgent: 0 };
    
    const urgent = trelloData.urgencyLevels.overdue + trelloData.urgencyLevels.dueToday;
    return {
      total: trelloData.totalTasks,
      urgent
    };
  };

  const getTaskDistribution = () => {
    if (!trelloData) return { today: 0, thisWeek: 0, overdue: 0 };
    
    return {
      today: trelloData.urgencyLevels.dueToday,
      thisWeek: trelloData.urgencyLevels.dueThisWeek,
      overdue: trelloData.urgencyLevels.overdue
    };
  };

  return (
    <View className = "flex-1 bg-[#F8F8F8]">
      <PersistentHeader />
      <ScrollView>
        <View className = "bg-[#E5E5E5] mx-4 mt-4 rounded-2xl border-2 border-black shadow flex-row min-h-[130px]">
          <View className = "flex-1 p-4 justify-center">
            <Text className = "text-m text-black text-left mb-1">{new Date().toLocaleDateString()}</Text>
            <Text className = "text-3xl font-extrabold text-black text-left leading-tight mb-1">
              {latestForecast?.emotionalWeather?.label ?? 'No forecast yet'}
            </Text>
          </View>

          <View className = "flex-1 justify-center p-4">
            <Text className = "text-xs text-black text-left mb-1 text-right">{latestForecast?.emotionalWeather?.icon ?? '⛅'}</Text>
          </View>
        </View>

        <View className = "mx-4 mt-4">
          <View className = "gap-2 flex-row">
            {daysOfWeek.map((day) => (
              <TouchableOpacity key = {day.key}
                className={`flex-1 py-2 px-1 rounded-xl border-2 ${
                  selectedDay === day.key 
                  ? 'bg-gray-200 border-black' 
                  : 'bg-white border-black'
                }`}
                onPress = {() => setSelectedDay(day.key)}
                >
                <Text className="text-center font-bold text-black text-3xl">{day.label}</Text>
                {trelloData && (
                  <Text className="text-center text-xs text-gray-600">
                    {getTasksForSelectedDay()} tasks
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      <View className="mt-10 mx-4 h-0.5 bg-black mb-2" />

      <View className="mx-4 mt-4">
          <View className="flex-row gap-4">
            {/* Left Card - Large */}
            <View className="flex-1 bg-white rounded-xl border-2 border-black p-4">
              <Text className="text-lg font-bold mb-2">Latest Forecast</Text>
              {latestForecast ? (
                <View>
                  <Text className="text-base text-black">Risk: {latestForecast.riskLevel.toUpperCase()}</Text>
                  <Text className="text-base text-black">Score: {forecastService.formatScore(latestForecast.overallScore)}</Text>
                  <Text className="text-base text-black">Confidence: {forecastService.formatConfidence(latestForecast.confidence)}</Text>
                </View>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-xl font-bold text-gray-500">NO DATA</Text>
                </View>
              )}
            </View>
            
            {/* Right Column - Two stacked cards */}
            <View className="flex-1 gap-4">
              {/* Top Right Card - Sleep */}
              <View className="bg-white rounded-xl border-2 border-black p-4">
                <View className="flex-row items-center mb-2">
                  <Text className="text-4xl mr-2">SLEEP ICON</Text>
                </View>
                {sleepDirection && sleepDeltaPct !== null ? (
                  <>
                    <Text className="text-sm text-gray-600">Sleep {sleepDirection}</Text>
                    <Text className="text-4xl font-bold text-black-500">{sleepDeltaPct}%</Text>
                    <Text className="text-sm text-gray-600">than usual</Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-600">No recent sleep data</Text>
                )}
              </View>
              
              {/* Bottom Right Card - Urgency Levels */}
              <View className="bg-white rounded-xl border-2 border-black p-4">
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : error ? (
                  <Text className="text-sm text-red-500">Error loading data</Text>
                ) : trelloData ? (
                  <>
                    <Text className="text-2xl font-bold text-black-500">
                      {getUrgencySummary().urgent}
                    </Text>
                    <Text className="text-sm text-gray-600">urgent tasks</Text>
                    <Text className="text-sm text-gray-600">out of {getUrgencySummary().total} total</Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-500">No data available</Text>
                )}
              </View>

              {/* Bottom Card Trello - Detailed Task Info */}
              <View className="bg-white rounded-xl border-2 border-black p-4">
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : error ? (
                  <Text className="text-sm text-red-500">Error</Text>
                ) : trelloData ? (
                  <>
                    <Text className="text-lg font-bold mb-2">Task Overview</Text>
                    <View className="space-y-1">
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">Today:</Text>
                        <Text className="text-sm font-bold" style={{ color: getUrgencyColor('dueToday') }}>
                          {getTaskDistribution().today}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">This Week:</Text>
                        <Text className="text-sm font-bold" style={{ color: getUrgencyColor('dueThisWeek') }}>
                          {getTaskDistribution().thisWeek}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-600">Overdue:</Text>
                        <Text className="text-sm font-bold" style={{ color: getUrgencyColor('overdue') }}>
                          {getTaskDistribution().overdue}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text className="text-sm text-gray-500">No Trello data</Text>
                )}
              </View>

            </View>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}
