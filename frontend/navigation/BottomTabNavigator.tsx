import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  PassportScreen,
  BurnoutMirrorScreen,
  EmotionalWeatherScreen,
  SettingsScreen,
  WeeklyCheckinScreen
} from '../screens';
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Weather" 
        component={EmotionalWeatherScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Checkin" 
        component={WeeklyCheckinScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Mirror" 
        component={BurnoutMirrorScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Passport" 
        component={PassportScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}
