import React from 'react';
import { useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import { collection, getDocs, query, where, limit as fsLimit } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';
import { SvgIcon } from '../components/SvgIcon';
import { fetchTrelloData, TrelloData, getUrgencyColor } from '../services/trello-service';
import { forecastService, BurnoutForecast, buildLastNDates, getSleepDataForDateRange, calculateSleepDelta } from '../services/forecast-service';
import { useFocusEffect } from '@react-navigation/native';


interface EmotionalWeatherData {
  currentMood: string;
  energyLevel: number;
  stressLevel: number;
  weatherConditions: string;
  forecast: string
}

interface EmotionalWeatherScreenProps {
  headerTitle?: string;
}

export default function EmotionalWeatherScreen({ headerTitle = "Emotional Weather" }: EmotionalWeatherScreenProps) {
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
  const [forecastLoading, setForecastLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const daysOfWeek = [
    { key: 'M', label: 'M' },
    { key: 'T', label: 'T' },
    { key: 'W', label: 'W' },
    { key: 'Th', label: 'Th' },
    { key: 'F', label: 'F' },
    { key: 'Sa', label: 'Sa' },
    { key: 'Su', label: 'Su' }
  ];

  const loadForecast = async () => {
    try {
      setForecastLoading(true);
      const forecast = await forecastService.getLatestForecast();
      setLatestForecast(forecast);
    } catch (err) {
      console.error('Error loading forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const user = auth.currentUser;
      const [data, forecast, sleepDataResult] = await Promise.all([
        fetchTrelloData(),
        forecastService.getLatestForecast(),
        getSleepDataForDateRange(7)
      ]);
      setTrelloData(data);
      setLatestForecast(forecast);
      
      if (sleepDataResult.sleepData.length > 0) {
        const sleepDelta = calculateSleepDelta(sleepDataResult.sleepData);
        setSleepDeltaPct(sleepDelta.deltaPct);
        setSleepDirection(sleepDelta.direction);
      } else {
        setSleepDeltaPct(null);
        setSleepDirection(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        const [data, forecast, sleepDataResult] = await Promise.all([
          fetchTrelloData(),
          forecastService.getLatestForecast(),
          getSleepDataForDateRange(7) // Use 7 days for consistent data ranges
        ]);
        setTrelloData(data);
        setLatestForecast(forecast);
        
        if (sleepDataResult.sleepData.length > 0) {
          // Use unified sleep delta calculation
          const sleepDelta = calculateSleepDelta(sleepDataResult.sleepData);
          setSleepDeltaPct(sleepDelta.deltaPct);
          setSleepDirection(sleepDelta.direction);
        } else {
          setSleepDeltaPct(null);
          setSleepDirection(null);
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

  // Refresh all data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshAllData = async () => {
        try {
          setLoading(true);
          const user = auth.currentUser;
          const [data, forecast, sleepDataResult] = await Promise.all([
            fetchTrelloData(),
            forecastService.getLatestForecast(),
            getSleepDataForDateRange(7) // Use 7 days for consistent data ranges
          ]);
          setTrelloData(data);
          setLatestForecast(forecast);
          
          if (sleepDataResult.sleepData.length > 0) {
            // Use unified sleep delta calculation
            const sleepDelta = calculateSleepDelta(sleepDataResult.sleepData);
            setSleepDeltaPct(sleepDelta.deltaPct);
            setSleepDirection(sleepDelta.direction);
          } else {
            setSleepDeltaPct(null);
            setSleepDirection(null);
          }
          setError(null);
        } catch (err) {
          setError('Failed to refresh data');
          console.error('Error refreshing data:', err);
        } finally {
          setLoading(false);
        }
      };
      refreshAllData();
    }, [])
  );

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
      <PersistentHeader title={headerTitle} />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className = "bg-[#E5E5E5] mx-4 mt-4 rounded-2xl border-2 border-black shadow flex-row min-h-[130px]">
          <View className = "flex-1 p-4 justify-center">
            <Text className = "text-m text-black text-left mb-1">{new Date().toLocaleDateString()}</Text>
            <Text className = "text-3xl font-extrabold text-black text-left leading-tight mb-1">
              {forecastLoading ? 'Updating...' : (latestForecast?.emotionalWeather?.label ?? 'No forecast yet')}
            </Text>
            <TouchableOpacity 
              onPress={loadForecast}
              className="mt-2 bg-black px-3 py-1 rounded-lg self-start"
            >
              <Text className="text-white text-xs">Refresh Forecast</Text>
            </TouchableOpacity>
          </View>

          <View className = "flex-1 justify-center p-4 items-end">
            {forecastLoading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <SvgIcon 
                name={latestForecast?.emotionalWeather?.icon ?? 'partly-cloudy'} 
                size={48} 
              />
            )}
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
                   <SvgIcon name="sleep" size={32} />
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
