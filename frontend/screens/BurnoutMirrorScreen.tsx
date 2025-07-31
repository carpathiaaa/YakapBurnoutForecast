import React from 'react';
import { useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {doc, setDoc, getDoc} from 'firebase/firestore';
import {db, auth} from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';

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
  
  const sleepData = [
    { day: 'M', hours: 6.5 },
    { day: 'T', hours: 8.5 },
    { day: 'W', hours: 7.0 },
    { day: 'Th', hours: 7.5 },
    { day: 'F', hours: 5.5 },
    { day: 'Sa', hours: 6.8 },
    { day: 'Su', hours: 9.2 }
  ];

  const meetingsData = [
    { day: 'M', meetings: 4 },
    { day: 'T', meetings: 6 },
    { day: 'W', meetings: 3 },
    { day: 'Th', meetings: 5 },
    { day: 'F', meetings: 2 },
    { day: 'Sa', meetings: 1 },
    { day: 'Su', meetings: 0 }
  ];

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
          {/* Speech Bubble */}
          <View className="bg-white rounded-2xl border-2 border-black shadow min-h-[130px] relative">
            <Text className="text-lg font-medium text-black text-center mt-5 px-4 pb-4 leading-6">
              Consider scheduling a recovery{'\n'}block on Fridayyyyy
            </Text>
            
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
                   Average <Text className="font-bold">7 h 50</Text> min
                 </Text>
               </View>
               
                               {/* Sleep Chart */}
                <View className="flex-1 justify-end">
                  <View className="flex-row justify-between items-end h-40 mb-2 px-2">
                    {sleepData.map((data, index) => (
                      <View key={data.day} className="items-center">
                        {/* Hours Text */}
                        {selectedDay === data.day && (
                          <Text className="text-xs font-bold text-black mb-1">
                            {data.hours}h
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => handleBarPress(data.day, data.hours)}
                          className={`bg-gray-200 border-2 border-black w-8 mb-1 ${
                            index === 0 ? 'h-10' : 
                            index === 1 ? 'h-24' : 
                            index === 2 ? 'h-12' : 
                            index === 3 ? 'h-14' : 
                            index === 4 ? 'h-8' : 
                            index === 5 ? 'h-11' : 'h-28'
                          } ${selectedDay === data.day ? 'bg-blue-200' : ''}`}
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
                    Average <Text className="font-bold">3</Text> meetings/day
                  </Text>
                </View>
                
                {/* Meetings Chart */}
                <View className="flex-1 justify-end">
                  <View className="flex-row justify-between items-end h-40 mb-2 px-2">
                    {meetingsData.map((data, index) => (
                      <View key={data.day} className="items-center">
                        {/* Meetings Count Text */}
                        {selectedMeetingDay === data.day && (
                          <Text className="text-xs font-bold text-black mb-1">
                            {data.meetings}
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => handleMeetingBarPress(data.day, data.meetings)}
                          className={`bg-gray-200 border-2 border-black w-8 mb-1 ${
                            index === 0 ? 'h-16' : 
                            index === 1 ? 'h-24' : 
                            index === 2 ? 'h-12' : 
                            index === 3 ? 'h-20' : 
                            index === 4 ? 'h-8' : 
                            index === 5 ? 'h-4' : 'h-0'
                          } ${selectedMeetingDay === data.day ? 'bg-blue-200' : ''}`}
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
