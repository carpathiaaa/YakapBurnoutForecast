// navigation/MainNavigator.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import BottomTabNavigator from './BottomTabNavigator';
import OnboardingScreen from '../features/onboarding/OnboardingScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  // Simulate onboarding state. Replace with real persisted value later.
  const [hasOnboarded, setHasOnboarded] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen {...props} onDone={() => setHasOnboarded(true)} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
