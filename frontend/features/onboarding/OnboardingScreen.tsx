import React, { useState, useRef } from 'react';
import { View, FlatList, Dimensions, Button, StyleSheet } from 'react-native';
import { onboardingSteps } from './data/onboardingSteps';
import OnboardingStep from './components/OnboardingStep';

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

  const handleNext = () => {
    if (currentIndex < onboardingSteps.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ 
        index: nextIndex,
        animated: true 
      });
    } else {
      console.log('✅ Onboarding complete. Collected responses:', stepValues);
      onDone(); // move to the main app or next screen
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
      case 'button-select':
      case 'multi-button':
        return [];
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

  return (
    <View style={styles.container}>
      {/* Page Indicators */}
      {renderPageIndicators()}
      
      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        horizontal
        pagingEnabled
        scrollEnabled={true} // Enable swiping
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={styles.pageContainer}>
            <View style={styles.contentContainer}>
              <OnboardingStep
                title={item.question}
                uiType={item.uiType}
                options={item.options}
                extra={item.extra}
                value={getDefaultValue(item)}
                onChange={(val) => handleChange(index, val)}
              />
            </View>
            
            {/* Show button at the bottom of each screen */}
            <View style={styles.buttonContainer}>
              <Button
                title={index === onboardingSteps.length - 1 ? 'Finish' : 'Next'}
                onPress={handleNext}
              />
            </View>
          </View>
        )}
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
    backgroundColor: '#fff',
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
    backgroundColor: '#007BFF',
  },
  inactiveIndicator: {
    backgroundColor: '#D3D3D3',
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
});

export default OnboardingScreen;