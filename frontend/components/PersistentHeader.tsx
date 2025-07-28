import React from 'react';
import { View, Text } from 'react-native';

export default function PersistentHeader() {
  return (
    <View className="bg-[#E5E5E5] pt-12 pb-7 px-0 rounded-b-full border-2 border-black">
      <View className="items-center">
        <View className="bg-white px-10 py-3 rounded-full border-2 border-black">
          <Text className="text-base font-medium text-gray-700">My Wellness Passport</Text>
        </View>
      </View>
    </View>
  );
} 