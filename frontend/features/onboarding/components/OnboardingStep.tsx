import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UIType } from '../data/onboardingSteps';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

type Option = string;

type OnboardingStepProps = {
  title: string;
  uiType: UIType;
  options?: Option[];
  value: any;
  onChange: (val: any) => void;
  extra?: any; // for things like min/max for sliders or weekday info
};

const OnboardingStep: React.FC<OnboardingStepProps> = ({ title, uiType, options = [], value, onChange, extra }) => {
  // State for time-range picker
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activePickerType, setActivePickerType] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Show picker only when a day and picker type is set
  const isPickerVisible = activeDay !== null && activePickerType !== null;

  const handleTimeChange = (_event: any, selectedDate: Date | undefined) => {
    console.log('Time changed:', selectedDate, 'for day:', activeDay, 'type:', activePickerType);
    
    if (Platform.OS === 'android') {
      // Android auto-dismisses picker
      setActiveDay(null);
      setActivePickerType(null);
    }

    if (selectedDate && activeDay && activePickerType) {
      const formatted = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const currentValue = value || {};
      const updatedValue = {
        ...currentValue,
        [activeDay]: {
          ...currentValue[activeDay],
          [activePickerType]: formatted,
        },
      };
      
      console.log('Updated time value:', updatedValue);
      onChange(updatedValue);
      
      // For iOS, manually close the picker
      if (Platform.OS === 'ios') {
        setActiveDay(null);
        setActivePickerType(null);
      }
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const renderOptions = () => {
    switch (uiType) {
      case 'multi-checkbox':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 }}>
            {options.map(option => {
              const isSelected = value?.includes(option) || false;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.clickableOption,
                    isSelected && styles.clickableOptionSelected
                  ]}
                  onPress={() => {
                    const currentValue = value || [];
                    if (isSelected) {
                      onChange(currentValue.filter((v: string) => v !== option));
                    } else {
                      onChange([...currentValue, option]);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.clickableOptionText,
                    isSelected && styles.clickableOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'radio':
        return options.map(option => (
          <TouchableOpacity 
            key={option} 
            style={[
              styles.radioButton,
              value === option && styles.radioButtonSelected
            ]} 
            onPress={() => onChange(option)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.radioButtonText,
              value === option && styles.radioButtonTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ));

      case 'button-select':
        return (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 16, marginVertical: 24 }}>
            {options.map(option => {
              const selected = value === option;
              // Use emoji as icon placeholder for now
              let icon = '❓';
              if (extra?.icons && extra.icons[option]) {
                if (option === 'Onsite') icon = '📍';
                else if (option === 'Hybrid') icon = '🔄';
                else if (option === 'Remote') icon = '💼';
                else icon = '❓';
              }
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.workArrangementCard,
                    selected && styles.workArrangementCardSelected
                  ]}
                  onPress={() => onChange(option)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.workArrangementIcon}>{icon}</Text>
                  <Text style={styles.workArrangementTitle}>{option.toUpperCase()}</Text>
                  <Text style={styles.workArrangementDesc}>{extra?.descriptions?.[option]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'slider':
        return (
          <View style={styles.sliderContainer}>
            <Slider
              minimumValue={extra?.min || 0}
              maximumValue={extra?.max || 10}
              step={1}
              value={value || 0}
              onValueChange={onChange}
              style={styles.slider}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="#E5E5E5"
            />
            <Text style={styles.sliderValue}>Selected: {value || 0}</Text>
          </View>
        );

      case 'image-upload':
        return (
          <View style={styles.imageUploadContainer}>
            <View style={styles.imageBox}>
              {value ? (
                <Image
                  source={{ uri: value }}
                  style={styles.uploadedImage}
                />
              ) : (
                <Text style={styles.noImageText}>No Image Selected</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.pickImageButton}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert("Permission to access camera roll is required!");
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 1,
                });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
                  onChange(pickerResult.assets[0].uri);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.pickImageButtonText}>PICK AN IMAGE</Text>
            </TouchableOpacity>
          </View>
        );

      case 'dropdown':
        return (
          <View>
            <TouchableOpacity
              style={styles.dropdownToggle}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownToggleText}>
                {value || 'Select an option...'}
              </Text>
              <Text style={styles.dropdownChevron}>{isDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                <ScrollView
                  style={styles.dropdownList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {options?.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownItem,
                        value === opt && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        onChange(opt);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          value === opt && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        );

      case 'single-button':
        return (
          <View style={styles.buttonContainer}>
            {options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.singleButton,
                  value === opt && styles.singleButtonSelected
                ]}
                onPress={() => onChange(opt)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.buttonText,
                  value === opt && styles.buttonTextSelected
                ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'multi-button':
        return (
          <View style={styles.buttonContainer}>
            {options?.map((opt) => {
              const currentValue = value || [];
              const selected = currentValue.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.multiButton,
                    selected && styles.multiButtonSelected
                  ]}
                  onPress={() => {
                    const newValue = selected
                      ? currentValue.filter((v: string) => v !== opt)
                      : [...currentValue, opt];
                    onChange(newValue);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    selected && styles.buttonTextSelected
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'time-range': {
        // Only show a single time range (no weekdays)
        const timeRangeValue = value || {};
        const from = timeRangeValue.start;
        const to = timeRangeValue.end;
        return (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                style={[styles.timeButton, from && styles.timeButtonSelected]}
                onPress={() => {
                  setActivePickerType('start');
                  setTempDate(new Date());
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.timeButtonText,
                  from && styles.timeButtonTextSelected
                ]}>
                  {from ? `From: ${from}` : 'From: --:--'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeButton, to && styles.timeButtonSelected]}
                onPress={() => {
                  setActivePickerType('end');
                  setTempDate(new Date());
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.timeButtonText,
                  to && styles.timeButtonTextSelected
                ]}>
                  {to ? `To: ${to}` : 'To: --:--'}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Show selected time range summary */}
            <Text style={{ marginTop: 16, fontSize: 16, color: '#333' }}>
              {from && to ? `Selected: ${from} - ${to}` : 'Selected: Not set'}
            </Text>
            {activePickerType && (
              <DateTimePicker
                mode="time"
                value={tempDate}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setActivePickerType(null);
                  }
                  if (selectedDate && activePickerType) {
                    const formatted = selectedDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const updatedValue = {
                      ...timeRangeValue,
                      [activePickerType]: formatted,
                    };
                    onChange(updatedValue);
                    if (Platform.OS === 'ios') {
                      setActivePickerType(null);
                    }
                  }
                }}
                display="default"
              />
            )}
          </View>
        );
      }

      default:
        return <Text>Unsupported UI Type</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {renderOptions()}
    </View>
  );
};

export default OnboardingStep;

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    color: '#000',
    textAlign: 'center',
  },
  radioButton: {
    padding: 16,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#F8F8F8',
  },
  radioButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  radioButtonTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  selectButton: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sliderValue: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  imageUploadContainer: {
    alignItems: 'center',
    gap: 16,
  },
  imageUploadTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  imageBox: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadedImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickImageButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  pickImageButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  dropdownToggleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownChevron: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  dropdownListContainer: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#fff',
    maxHeight: 160,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 160,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F8F8F8',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  singleButton: {
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    minWidth: 100,
    alignItems: 'center',
  },
  singleButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#F8F8F8',
  },
  multiButton: {
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    minWidth: 100,
    alignItems: 'center',
  },
  multiButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#F8F8F8',
  },
  buttonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  timeRangeDay: {
    marginBottom: 20,
  },
  dayLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeButtonSelected: {
    borderColor: '#000',
    backgroundColor: '#F8F8F8',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeButtonTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 8,
    marginTop: 4,
    borderRadius: 5,
  },
  workArrangementCard: {
    flex: 1,
    minWidth: 120,
    maxWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: -2,
    elevation: 2,
  },
  workArrangementCardSelected: {
    borderColor: '#000',
    backgroundColor: '#F8F8F8',
    elevation: 4,
  },
  workArrangementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  workArrangementTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    color: '#333',
  },
  workArrangementDesc: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  clickableOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  clickableOptionSelected: {
    borderColor: '#000',
    backgroundColor: '#F8F8F8',
  },
  clickableOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  clickableOptionTextSelected: {
    color: '#000',
    fontWeight: 'bold',
  },
});