import React, { useState, useRef } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { onboardingSteps } from './data/onboardingSteps';
import OnboardingStep from './components/OnboardingStep';
import { forecastService } from '../../services/forecast-service';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface OnboardingScreenProps {
  onDone: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const [stepValues, setStepValues] = useState<Record<string, any>>({});
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleChange = (index: number, val: any) => {
    setStepValues(prev => ({
      ...prev,
      [onboardingSteps[index].id]: val,
    }));
  };

  const handleNext = async () => {
    if (currentIndex < onboardingSteps.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ 
        index: nextIndex,
        animated: true 
      });
    } else {
      console.log('✅ Onboarding complete. Collected responses:', stepValues);
      try {
        // Persist profile and preferences aligned with Wellness Passport
        await forecastService.saveUserProfile({
          profile: {
            profilePictureUri: stepValues['profile_picture'] || null,
            workArrangement: stepValues['work_arrangement'] || undefined,
            focusHours: stepValues['focus_hours'] || undefined,
            productivityTime: stepValues['productivity_time'] || undefined,
            energizedDays: stepValues['energized_days'] || [],
            meetingTolerance: stepValues['meeting_tolerance'] ?? undefined,
            stressSignals: stepValues['stress_signals'] || [],
            recoveryStrategies: stepValues['recovery_strategies'] || [],
            department: stepValues['department'] || '',
          },
          preferences: {
            checkInReminders: true,
            forecastNotifications: true,
            dataSharing: false,
          },
        } as any);
      } catch (e) {
        console.warn('Failed to save profile during onboarding', e);
      }
      onDone();
    }
  };

  const getDefaultValue = (item: any) => {
    const currentValue = stepValues[item.id];
    
    // If we already have a value, return it
    if (currentValue !== undefined) {
      return currentValue;
    }
    
    // Set appropriate default values based on UI type
    switch (item.uiType) {
      case 'multi-checkbox':
      case 'multi-button':
        return [];
      case 'button-select':
        return '';
      case 'time-range':
        // Initialize empty object for time ranges
        return {};
      case 'slider':
        return item.extra?.min || 0;
      case 'radio':
      case 'single-button':
      case 'dropdown':
        return '';
      case 'image-upload':
        return null;
      default:
        return '';
    }
  };

  const renderPageIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex ? styles.activeIndicator : styles.inactiveIndicator
            ]}
          />
        ))}
      </View>
    );
  };

  // New shared header and arc for all onboarding steps
  const renderOnboardingPage = (item: any, index: number, isProfilePicture: boolean) => {
    // Dots distributed along the arc
    const DOT_COUNT = onboardingSteps.length;
    const DOT_SIZE = 36;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = -150;
    const RADIUS = 200;
    const ARC_SPAN = Math.PI * 0.6;
    const ARC_START = -ARC_SPAN / 2;
    const ROTATION = Math.PI / 2;
    const arcDots = Array.from({ length: DOT_COUNT }).map((_, i) => {
      const angle = ARC_START + ARC_SPAN * ((DOT_COUNT - 1 - i) / (DOT_COUNT - 1)) + ROTATION;
      const x = centerX + RADIUS * Math.cos(angle);
      const y = centerY + RADIUS * Math.sin(angle);
      return (
        <View
          key={i}
          style={[
            styles.passportDot,
            i === currentIndex ? styles.passportDotActive : null,
            {
              position: 'absolute',
              left: x - DOT_SIZE / 2,
              top: y - DOT_SIZE / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
            },
          ]}
        />
      );
    });
    return (
      <View style={styles.profilePageContainer}>
        <View style={styles.passportHeaderHalfCircle}>
          <Text style={styles.passportTitle}>Customize your</Text>
          <Text style={styles.passportSubtitle}>Wellness Passport</Text>
          <Text style={styles.passportHelper}>Follow the steps below to complete your passport.</Text>
        </View>
        <View style={styles.passportStepIndicatorArc}>{arcDots}</View>
        <View style={styles.passportContainer}>
          <View style={styles.profileUploadSection}>
            {isProfilePicture ? (
              <OnboardingStep
                title=""
                uiType="image-upload"
                value={getDefaultValue(item)}
                onChange={(val) => handleChange(index, val)}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <OnboardingStep
                  title={item.question}
                  uiType={item.uiType}
                  options={item.options}
                  extra={item.extra}
                  value={getDefaultValue(item)}
                  onChange={(val) => handleChange(index, val)}
                />
              </View>
            )}
          </View>
        </View>
        <View style={styles.passportButtonRow}>
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {index === onboardingSteps.length - 1 ? 'Finish' : '→ Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        horizontal
        pagingEnabled
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => {
          return renderOnboardingPage(item, index, item.id === 'profile_picture');
        }}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(newIndex);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Match app's background color
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 60, // Add extra padding for status bar
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#000', // Match app's black theme
  },
  inactiveIndicator: {
    backgroundColor: '#E5E5E5', // Match app's gray theme
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  // Profile picture page specific styles
  profilePageContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'space-between',
  },
  passportContainer: {
    alignItems: 'center',
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  passportTitle: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  passportSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    color: '#000',
  },
  passportHelper: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  passportDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5E5', // Match app's gray
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  passportDotActive: {
    backgroundColor: '#000', // Match app's black theme
  },
  profileUploadSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  passportButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 24, // Match app's rounded style
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 120,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passportHeaderHalfCircle: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E5E5', // Match app's gray theme
    borderBottomLeftRadius: 600,
    borderBottomRightRadius: 600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    marginBottom: 5,
  },
  passportStepIndicatorCurve: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 18,
    marginBottom: 0,
    width: '100%',
    // Optionally, you can add transform or margin to better follow the curve visually
  },
  passportStepIndicatorArc: {
    position: 'absolute',
    left: 0,
    top: 300, // Just below the semicircle
    width: '100%',
    height: 180,
    pointerEvents: 'none', // So it doesn't block touches
  },
});

export default OnboardingScreen;