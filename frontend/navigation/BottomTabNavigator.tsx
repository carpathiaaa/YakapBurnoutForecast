import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  PassportScreen,
  BurnoutMirrorScreen,
  EmotionalWeatherScreen
} from '../screens';


const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Passport" component={PassportScreen} />
      <Tab.Screen name="Burnout Mirror" component={BurnoutMirrorScreen} />
      <Tab.Screen name="Weather" component={EmotionalWeatherScreen} />
    </Tab.Navigator>
  );
}
