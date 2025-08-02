import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useModal } from '../navigation/MainNavigator';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { openModal } = useModal();

  const tabIcons = [
    { name: 'Settings', icon: '⚙️' },
    { name: 'Weather', icon: '☀️' },
    { name: 'Checkin', icon: '+' },
    { name: 'Mirror', icon: '👥' },
    { name: 'Passport', icon: '📄' },
  ];

  // Bar height and icon size
  const BAR_HEIGHT = 64; // px
  const ICON_SIZE = 64; // px (w-16 h-16)
  const SIDE_ICON_SIZE = 56; // px (w-14 h-14)
  const ICON_OVERLAP = ICON_SIZE / 2; // px

  return (
    <View className="relative" style={{ height: BAR_HEIGHT + ICON_OVERLAP, marginBottom: 32 }}>
      {/* Bar background */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-[#E5E5E5] rounded-t-3xl border-t-4 border-l-4 border-r-4 border-black"
        style={{ height: BAR_HEIGHT, borderBottomWidth: 0 }}
      />
      {/* Icons row */}
      <View className="absolute left-0 right-0 flex-row items-end justify-around z-20" style={{ top: 0, height: BAR_HEIGHT + ICON_OVERLAP }}>
        {state.routes.filter((route) => {
          const { options } = descriptors[route.key];
          return options.tabBarButton !== null;
        }).map((route, visibleIndex) => {
          const { options } = descriptors[route.key];
          const originalIndex = state.routes.findIndex(r => r.key === route.key);
          const isFocused = state.index === originalIndex;
          const isCentral = visibleIndex === 2; // Plus button is the 3rd item (index 2)

          const onPress = () => {
            if (isCentral) {
              // Open modal for plus button
              openModal();
            } else {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          };

          // Calculate icon position: all icons are shifted up by half their size
          const iconSize = isCentral ? ICON_SIZE : SIDE_ICON_SIZE;
          const iconStyle = {
            width: iconSize,
            height: iconSize,
            transform: [{ translateY: -ICON_OVERLAP }],
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                { alignItems: 'center', justifyContent: 'center' },
                iconStyle,
              ]}
              activeOpacity={0.8}
            >
              <View
                className={
                  isCentral
                    ? 'items-center justify-center bg-white border-2 border-black rounded-xl'
                    : 'items-center justify-center bg-white border-2 border-black rounded-full'
                }
                style={{ width: iconSize, height: iconSize }}
              >
                <Text className={`text-2xl ${isCentral ? 'text-black font-bold' : 'text-gray-600'}`}>
                  {tabIcons[visibleIndex].icon}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
} 