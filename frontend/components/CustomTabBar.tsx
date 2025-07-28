import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabIcons = [
    { name: 'Settings', icon: '⚙️' },
    { name: 'Weather', icon: '☀️' },
    { name: 'Checkin', icon: '+' },
    { name: 'Mirror', icon: '👥' },
    { name: 'Passport', icon: '📄' },
  ];

  return (
    <View className="bg-[#E5E5E5] rounded-t-2xl shadow-lg border-t border-gray-300 mb-8">
      {/* Connecting line */}
      <View className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-0.5 z-0" />
      
      {/* Tab buttons */}
      <View className="flex-row items-center justify-around py-4 px-6">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCentral = index === 2; // Plus button is the 3rd item (index 2)

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              className={`items-center justify-center ${
                isCentral ? 'w-16 h-16' : 'w-14 h-14'
              }`}
            >
              <View
                className={`items-center justify-center ${
                  isCentral
                    ? 'w-16 h-16 bg-white border-2 border-black rounded-xl shadow-lg'
                    : 'w-14 h-14 bg-gray-300 rounded-full shadow-md'
                }`}
              >
                <Text className={`text-xl ${isCentral ? 'text-black font-bold' : 'text-gray-600'}`}>
                  {tabIcons[index].icon}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
} 