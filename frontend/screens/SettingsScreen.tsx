import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { clearAllAuthData } from '../services/auth-utils';
import { generateTestForecast, seedDummyDailyData } from '../services/forecast-service';

export default function SettingsScreen() {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all your data and you\'ll need to sign in again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAllAuthData();
            Alert.alert('Logged Out', 'You have been logged out successfully. Please restart the app to sign in with a different account.');
          },
        },
      ]
    );
  };

  const handleGenerateTestData = async () => {
    try {
      Alert.alert(
        'Generate Test Data',
        'This will create sample forecast data for testing. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              await seedDummyDailyData(30);
              Alert.alert('Success', 'Test data generated! Check the forecast screen.');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate test data');
    }
  };

  const handleGenerateForecast = async () => {
    try {
      await generateTestForecast();
      Alert.alert('Success', 'Test forecast generated! Check the forecast screen.');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate forecast');
    }
  };

  return (
    <View className="flex-1 bg-[#F8F8F8] p-4">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold text-gray-700 mb-8">Settings</Text>
        
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-black px-6 py-3 rounded-lg mb-4"
        >
          <Text className="text-white font-semibold text-lg">Logout & Clear Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGenerateTestData}
          className="bg-gray-600 px-6 py-3 rounded-lg mb-4"
        >
          <Text className="text-white font-semibold text-lg">Generate Test Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGenerateForecast}
          className="bg-gray-800 px-6 py-3 rounded-lg mb-4"
        >
          <Text className="text-white font-semibold text-lg">Generate Test Forecast</Text>
        </TouchableOpacity>
        
        <Text className="text-gray-500 mt-4 text-center">
          Use these buttons to test the app functionality.{'\n'}
          Generate Test Data creates sample daily check-ins.{'\n'}
          Generate Test Forecast creates a forecast from existing data.
        </Text>
      </View>
    </View>
  );
} 