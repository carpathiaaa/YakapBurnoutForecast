import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  PassportScreen,
  BurnoutMirrorScreen,
  EmotionalWeatherScreen
} from '../screens';

import { FEATURES } from '../config/features';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator>
      {FEATURES.showPassport && (
        <Tab.Screen name="Passport" component={PassportScreen} />
      )}
      {FEATURES.showBurnoutMirror && (
        <Tab.Screen name="Burnout Mirror" component={BurnoutMirrorScreen} />
      )}
      {FEATURES.showWeather && (
        <Tab.Screen name="Weather" component={EmotionalWeatherScreen} />
      )}
    </Tab.Navigator>
  );
}
