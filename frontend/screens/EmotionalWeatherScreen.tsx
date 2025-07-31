import React from 'react';
import { useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {doc, setDoc, getDoc} from 'firebase/firestore';
import {db, auth} from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';


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
  const daysOfWeek = [
    { key: 'M', label: 'M' },
    { key: 'T', label: 'T' },
    { key: 'W', label: 'W' },
    { key: 'Th', label: 'Th' },
    { key: 'F', label: 'F' },
    { key: 'Sa', label: 'Sa' },
    { key: 'Su', label: 'Su' }
  ];

  return (
    <View className = "flex-1 bg-[#F8F8F8]">
      <PersistentHeader />
      <ScrollView>
        <View className = "bg-[#E5E5E5] mx-4 mt-4 rounded-2xl border-2 border-black shadow flex-row min-h-[130px]">
          <View className = "flex-1 p-4 justify-center">
            <Text className = "text-m text-black text-left mb-1">Wednesday, July 31, 2025</Text>
            <Text className = "text-3xl font-extrabold text-black text-left leading-tight mb-1">Partly Cloudy</Text>
          </View>

          <View className = "flex-1 justify-center p-4">
            <Text className = "text-xs text-black text-left mb-1 text-right">WEATHER ICON</Text>
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

      <View className="mt-10 mx-4 h-0.5 bg-black mb-2" />

      <View className="mx-4 mt-4">
          <View className="flex-row gap-4">
            {/* Left Card - Large */}
            <View className="flex-1 bg-white rounded-xl border-2 border-black p-4">
              <Text className="text-lg font-bold mb-2">Your Last Check-in:</Text>
              <View className="flex-1 justify-center items-center">
                <Text className="text-xl font-bold text-gray-500">NO DATA</Text>
              </View>
            </View>
            
            {/* Right Column - Two stacked cards */}
            <View className="flex-1 gap-4">
              {/* Top Right Card - Sleep */}
              <View className="bg-white rounded-xl border-2 border-black p-4">
                <View className="flex-row items-center mb-2">
                  <Text className="text-4xl mr-2">SLEEP ICON</Text>
                </View>
                <Text className="text-sm text-gray-600">Sleep down</Text>
                <Text className="text-4xl font-bold text-black-500">20%</Text>
                <Text className="text-sm text-gray-600">than usual</Text>
              </View>
              
              {/* Bottom Right Card - Meetings */}
              <View className="bg-white rounded-xl border-2 border-black p-4">
                <Text className="text-4xl font-bold text-black-500">+5</Text>
                <Text className="text-sm text-gray-600">more meetings</Text>
                <Text className="text-sm text-gray-600">than preferred</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

    </View>
  );
}
