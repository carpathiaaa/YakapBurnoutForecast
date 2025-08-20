// navigation/MainNavigator.tsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Modal, Pressable, View, Text, TouchableOpacity, PanResponder, Animated, Alert } from 'react-native';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, User } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import OnboardingScreen from '../features/onboarding/OnboardingScreen';
import { SvgIcon } from '../components/SvgIcon';
import { auth } from '../services/firebase';
// Using react-native-google-signin instead of Expo Auth Session
import { forecastService, saveDailyCheckIn, hasDailyCheckInToday, seedDummyDailyData, generateTestForecast } from '../services/forecast-service';
import Constants from 'expo-constants';

// Expo WebBrowser not needed with react-native-google-signin

const Stack = createStackNavigator();

// Modal Context
interface ModalContextType {
  isModalVisible: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export default function MainNavigator() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null); // null = loading, false = needs onboarding, true = completed
  const [user, setUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasSeededDemoData, setHasSeededDemoData] = useState(false);
  // Extra config values from app.json
  const extra = (Constants.expoConfig?.extra || {}) as any;

  // Configure Google Sign-In SDK
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Check user profile to determine onboarding status
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) {
        setHasOnboarded(null);
        return;
      }

      try {
        console.log('[Onboarding] Checking profile for user:', user.uid);
        const profile = await forecastService.getUserProfile();
        
        if (profile && profile.profile && Object.keys(profile.profile).length > 0) {
          // User has a profile with data, consider them onboarded
          console.log('[Onboarding] User has profile, skipping onboarding');
          setHasOnboarded(true);
        } else {
          // User exists but has no profile data, needs onboarding
          console.log('[Onboarding] User has no profile, showing onboarding');
          setHasOnboarded(false);
        }
      } catch (error) {
        console.warn('[Onboarding] Error checking user profile:', error);
        // If there's an error, assume user needs onboarding
        setHasOnboarded(false);
      }
    };

    checkUserProfile();
  }, [user]);

  // TEMP: Seed demo data once after login (remove when not needed)
  useEffect(() => {
    const runSeed = async () => {
      try {
        if (user && !hasSeededDemoData && hasOnboarded === true) {
          await seedDummyDailyData(50);
          setHasSeededDemoData(true);
          console.log('[Seed] Demo data seeded for user');
        }
      } catch (e) {
        console.warn('[Seed] Failed to seed demo data', e);
      }
    };
    runSeed();
  }, [user, hasSeededDemoData, hasOnboarded]);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = (result as any)?.data?.idToken || (result as any)?.idToken;
      if (!idToken) {
        console.warn('Google Sign-In: missing idToken');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.warn('Google Sign-In error', error);
    }
  };

  const renderAuthScreen = () => <LoginScreen onContinue={handleGoogleSignIn} />;
  const [energyRating, setEnergyRating] = useState(0);
  const [modalStep, setModalStep] = useState(1); // 1 = energy, 2 = sleep
  const [sleepHours, setSleepHours] = useState(7);
  const [isDragging, setIsDragging] = useState(false);
  const sliderPosition = new Animated.Value((7 / 12) * 260); // Initial position for 7 hours (280 - 20 handle width)

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEnergyRating(0); // Reset rating when modal closes
    setModalStep(1); // Reset to first step
    setSleepHours(7); // Reset sleep hours
    setIsDragging(false);
    sliderPosition.setValue((7 / 12) * 260);
  };

  // PanResponder for custom slider
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      setIsDragging(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      const sliderWidth = 280;
      const handleWidth = 20;
      const maxPosition = sliderWidth - handleWidth;
      // Calculate position relative to the track start (accounting for modal padding)
      const trackStartX = 50; // Modal padding + margins
      const relativeX = gestureState.moveX - trackStartX;
      // Strict boundary enforcement
      const clampedPosition = Math.max(0, Math.min(maxPosition, relativeX));
      sliderPosition.setValue(clampedPosition);
      const percentage = clampedPosition / maxPosition;
      const newHours = Math.round(percentage * 12);
      setSleepHours(newHours);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    },
  });

  const submitCheckIn = async () => {
    try {
      const already = await hasDailyCheckInToday();
      if (already) {
        Alert.alert('Daily check-in done', 'Come back tomorrow for your next check-in.');
        return;
      }
      await saveDailyCheckIn(energyRating, sleepHours);
      
      // Generate new forecast after check-in
      try {
        await generateTestForecast();
        console.log('[CheckIn] Forecast generated successfully');
      } catch (forecastError) {
        console.warn('[CheckIn] Failed to generate forecast:', forecastError);
        // Don't fail the check-in if forecast generation fails
      }
    } catch (e) {
      if ((e as any)?.message === 'DAILY_CHECKIN_EXISTS') {
        Alert.alert('Daily check-in done', 'Come back tomorrow for your next check-in.');
      } else {
        console.warn('Failed to submit check-in', e);
      }
    } finally {
      closeModal();
    }
  };

  const modalContextValue = {
    isModalVisible,
    openModal,
    closeModal,
  };

  // Show loading while checking user profile
  if (user && hasOnboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ModalContext.Provider value={modalContextValue}>
      <NavigationContainer>
        {!user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">{() => <LoginScreen onContinue={handleGoogleSignIn} />}</Stack.Screen>
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          </Stack.Navigator>
        ) : (
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
        )}
      </NavigationContainer>

      {/* Weekly Check-in Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        {/* Backdrop with darkened background */}
        <Pressable 
          onPress={closeModal}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Modal content */}
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              borderWidth: 2,
              borderColor: 'black',
              padding: 24,
              marginHorizontal: 16,
              width: 320,
              height: 370,
              maxWidth: '90%',
            }}
          >
            {/* Header with X button */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13, marginTop: 6 }}>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 25, fontWeight: 'bold', color: 'black' }}>Daily Check-in</Text>
              </View>
              <TouchableOpacity 
                onPress={closeModal}
                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 24, color: '#666' }}>ⓧ</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-2 mx-1 h-0.5 bg-black mb-2" />

            {/* Energy Level Question */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, color: 'black', textAlign: 'left', lineHeight: 22 }}>
                How would you rate your <Text style={{ fontWeight: 'bold' }}>energy level</Text> today?
              </Text>
            </View>

            {/* Energy Level Rating */}
            <View style={{ marginBottom: 30 }}>
              {/* Rating Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}>1 - Drained</Text>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}>5 - High energy</Text>
              </View>
              
              {/* Star Rating */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity 
                    key={rating} 
                    style={{ alignItems: 'center' }}
                    onPress={() => setEnergyRating(rating)}
                  >
                    <Text style={{ fontSize: 20, color: 'black', marginBottom: 2 }}>{rating}</Text>
                                         <SvgIcon 
                       name={rating <= energyRating ? 'star' : 'star-empty'} 
                       size={50} 
                     />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={{
                backgroundColor: 'white',
                borderWidth: 2,
                borderColor: 'black',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
                alignItems: 'center',
                marginTop: -20
              }}
              onPress={() => setModalStep(2)}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black' }}>→ Continue</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sleep Duration Modal Step */}
      {modalStep === 2 && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
          statusBarTranslucent={true}
        >
          {/* Backdrop with darkened background */}
          <Pressable 
            onPress={closeModal}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Modal content */}
            <Pressable 
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: 24,
                borderWidth: 2,
                borderColor: 'black',
                padding: 24,
                marginHorizontal: 16,
                width: 320,
                height: 370,
                maxWidth: '90%',
              }}
            >
              {/* Header with X button */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13, marginTop: 6 }}>
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 25, fontWeight: 'bold', color: 'black' }}>Daily Check-in</Text>
                </View>
                <TouchableOpacity 
                  onPress={closeModal}
                  style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 24, color: '#666' }}>×</Text>
                </TouchableOpacity>
              </View>

              <View className="mt-2 mx-1 h-0.5 bg-black mb-2" />

              {/* Sleep Question */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, color: 'black', textAlign: 'left', lineHeight: 22 }}>
                  How many <Text style={{ fontWeight: 'bold' }}>hours of sleep</Text> did you get tonight?
                </Text>
              </View>

              {/* Sleep Hours Display */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black' }}>
                  {sleepHours} Hour{sleepHours !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Custom Slider */}
              <View style={{ marginBottom: 30 }}>
                <View style={{
                  height: 12,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: 'black',
                  borderRadius: 6,
                  position: 'relative',
                  marginHorizontal: 10
                }}>
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={{
                      position: 'absolute',
                      left: sliderPosition.interpolate({
                        inputRange: [0, 260],
                        outputRange: [0, 260],
                        extrapolate: 'clamp'
                      }),
                      top: -4,
                      width: 20,
                      height: 20,
                      backgroundColor: '#D3D3D3',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 10,
                      marginLeft: -10,
                      transform: [{ scale: isDragging ? 1.1 : 1 }],
                      zIndex: 10
                    }}
                  />
                </View>
                
                {/* Tap to position overlay */}
                <Pressable
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: 10,
                    right: 10,
                    height: 20,
                    zIndex: 1
                  }}
                  onPress={(event) => {
                    const { locationX } = event.nativeEvent;
                    const sliderWidth = 280;
                    const handleWidth = 20;
                    const maxPosition = sliderWidth - handleWidth;
                    // Calculate percentage based on track width
                    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
                    const newHours = Math.round(percentage * 12);
                    // Strict boundary enforcement for tap
                    const clampedPosition = Math.max(0, Math.min(maxPosition, percentage * maxPosition));
                    setSleepHours(newHours);
                    sliderPosition.setValue(clampedPosition);
                  }}
                />
                
              </View>

              {/* Instruction */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  Slide to Adjust
                </Text>
              </View>

              {/* Done Button */}
              <TouchableOpacity 
                style={{
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: 'black',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  marginTop: 'auto'
                }}
                onPress={submitCheckIn}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black' }}>Done!</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </ModalContext.Provider>
  );
}
