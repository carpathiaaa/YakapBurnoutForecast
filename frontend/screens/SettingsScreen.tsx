import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Switch, StyleSheet } from 'react-native';
import { clearAllAuthData } from '../services/auth-utils';
import { generateTestForecast, seedDummyDailyData } from '../services/forecast-service';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';
import { useFocusEffect } from '@react-navigation/native';

interface UserPreferences {
  checkInReminders: boolean;
  forecastNotifications: boolean;
  dataSharing: boolean;
  trelloIntegration: boolean;
  autoForecastGeneration: boolean;
  weeklyInsights: boolean;
}

interface SettingsScreenProps {
  headerTitle?: string;
}

export default function SettingsScreen({ headerTitle = "Settings" }: SettingsScreenProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    checkInReminders: true,
    forecastNotifications: true,
    dataSharing: false,
    trelloIntegration: false,
    autoForecastGeneration: true,
    weeklyInsights: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Refresh preferences when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserPreferences();
    }, [])
  );

  const loadUserPreferences = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userPrefs = data.preferences || {};
        setPreferences({
          checkInReminders: userPrefs.checkInReminders ?? true,
          forecastNotifications: userPrefs.forecastNotifications ?? true,
          dataSharing: userPrefs.dataSharing ?? false,
          trelloIntegration: userPrefs.trelloIntegration ?? false,
          autoForecastGeneration: userPrefs.autoForecastGeneration ?? true,
          weeklyInsights: userPrefs.weeklyInsights ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      await setDoc(doc(db, 'users', user.uid), {
        preferences: newPreferences,
        updatedAt: new Date(),
      }, { merge: true });

      console.log(`Updated preference ${key}:`, value);
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all your data and you\'ll need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
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

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5E5', true: '#000' }}
        thumbColor={value ? '#fff' : '#fff'}
        ios_backgroundColor="#E5E5E5"
      />
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderActionButton = (
    title: string,
    subtitle: string,
    onPress: () => void,
    color: string = '#000'
  ) => (
    <TouchableOpacity style={[styles.actionButton, { borderColor: color }]} onPress={onPress}>
      <View style={styles.actionButtonContent}>
        <View style={styles.actionText}>
          <Text style={[styles.actionTitle, { color }]}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <PersistentHeader title={headerTitle} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PersistentHeader title={headerTitle} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        {renderSectionHeader('Notifications')}
        <View style={styles.section}>
          {renderSettingItem(
            'Daily Check-in Reminders',
            'Get reminded to complete your daily wellness check-in',
            preferences.checkInReminders,
            (value) => updatePreference('checkInReminders', value)
          )}
          {renderSettingItem(
            'Forecast Updates',
            'Receive notifications when your burnout forecast changes',
            preferences.forecastNotifications,
            (value) => updatePreference('forecastNotifications', value)
          )}
          {renderSettingItem(
            'Weekly Insights',
            'Get weekly summaries of your wellness patterns',
            preferences.weeklyInsights,
            (value) => updatePreference('weeklyInsights', value)
          )}
        </View>

        {/* Data & Privacy Section */}
        {renderSectionHeader('Data & Privacy')}
        <View style={styles.section}>
          {renderSettingItem(
            'Passport Sharing',
            'Share your wellness data with your manager for wellness support and insights',
            preferences.dataSharing,
            (value) => updatePreference('dataSharing', value)
          )}
          {renderSettingItem(
            'Auto Forecast Generation',
            'Automatically generate forecasts after check-ins',
            preferences.autoForecastGeneration,
            (value) => updatePreference('autoForecastGeneration', value)
          )}
        </View>

        {/* Integrations Section */}
        {renderSectionHeader('Integrations')}
        <View style={styles.section}>
          {renderSettingItem(
            'Trello Integration',
            'Connect your Trello boards for task analysis',
            preferences.trelloIntegration,
            (value) => updatePreference('trelloIntegration', value)
          )}
        </View>

        {/* Developer Tools Section */}
        {renderSectionHeader('Developer Tools')}
        <View style={styles.section}>
          {renderActionButton(
            'Generate Test Data',
            'Create sample daily check-ins for testing',
            handleGenerateTestData,
            '#666'
          )}
          {renderActionButton(
            'Generate Test Forecast',
            'Create a test burnout forecast',
            handleGenerateForecast,
            '#666'
          )}
        </View>

        {/* Account Section */}
        {renderSectionHeader('Account')}
        <View style={styles.section}>
          {renderActionButton(
            'Logout & Clear Cache',
            'Sign out and clear all local data',
            handleLogout,
            '#dc2626'
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Wellness Passport v1.0.0</Text>
          <Text style={styles.appInfoText}>Burnout Forecast & Prevention</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
}); 