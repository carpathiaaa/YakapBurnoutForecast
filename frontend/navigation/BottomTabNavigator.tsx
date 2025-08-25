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

// Wrapper components to pass titles
const WeatherScreenWrapper = () => <EmotionalWeatherScreen headerTitle="Emotional Weather" />;
const SettingsScreenWrapper = () => <SettingsScreen headerTitle="Settings" />;
const CheckinScreenWrapper = () => <WeeklyCheckinScreen />;
const MirrorScreenWrapper = () => <BurnoutMirrorScreen headerTitle="Burnout Mirror" />;
const PassportScreenWrapper = () => <PassportScreen headerTitle="My Wellness Passport" />;

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator 
      initialRouteName="Weather"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreenWrapper}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Weather" 
        component={WeatherScreenWrapper}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Checkin" 
        component={CheckinScreenWrapper}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Mirror" 
        component={MirrorScreenWrapper}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen 
        name="Passport" 
        component={PassportScreenWrapper}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}
