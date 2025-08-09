import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Button, Platform, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import Checkbox from 'expo-checkbox';
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
        return options.map(option => (
          <View key={option} style={styles.checkboxContainer}>
            <Checkbox
              value={value?.includes(option) || false}
              onValueChange={(checked: boolean) => {
                const currentValue = value || [];
                if (checked) {
                  onChange([...currentValue, option]);
                } else {
                  onChange(currentValue.filter((v: string) => v !== option));
                }
              }}
            />
            <Text style={styles.checkboxText}>{option}</Text>
          </View>
        ));

      case 'radio':
        return options.map(option => (
          <TouchableOpacity key={option} style={styles.radioButton} onPress={() => onChange(option)}>
            <Text style={{ color: value === option ? 'blue' : 'black' }}>{option}</Text>
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
          <View>
            <Slider
              minimumValue={extra?.min || 0}
              maximumValue={extra?.max || 10}
              step={1}
              value={value || 0}
              onValueChange={onChange}
              style={styles.slider}
            />
            <Text style={styles.sliderValue}>Selected: {value || 0}</Text>
          </View>
        );

      case 'image-upload':
        return (
          <View style={styles.wireframeImageUploadContainer}>
            <View style={styles.wireframeImageBox}>
              {value ? (
                <Image
                  source={{ uri: value }}
                  style={styles.wireframeUploadedImage}
                />
              ) : (
                <Text style={styles.wireframeNoImageText}>No Image Selected</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.wireframePickImageButton}
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
            >
              <Text style={styles.wireframePickImageButtonText}>PICK AN IMAGE</Text>
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
                  { backgroundColor: value === opt ? '#007BFF' : '#ccc' }
                ]}
                onPress={() => onChange(opt)}
              >
                <Text style={styles.buttonText}>{opt}</Text>
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
                    { backgroundColor: selected ? '#28a745' : '#ccc' }
                  ]}
                  onPress={() => {
                    const newValue = selected
                      ? currentValue.filter((v: string) => v !== opt)
                      : [...currentValue, opt];
                    onChange(newValue);
                  }}
                >
                  <Text style={styles.buttonText}>{opt}</Text>
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
              >
                <Text style={styles.timeButtonText}>
                  {from ? `From: ${from}` : 'From: --:--'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeButton, to && styles.timeButtonSelected]}
                onPress={() => {
                  setActivePickerType('end');
                  setTempDate(new Date());
                }}
              >
                <Text style={styles.timeButtonText}>
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
    fontSize: 16,
    marginBottom: 8
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkboxText: {
    marginLeft: 8,
  },
  radioButton: {
    padding: 8,
    marginVertical: 4,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  selectButton: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    marginTop: 8,
  },
  imageUploadContainer: {
    alignItems: 'center',
    gap: 16,
  },
  imageUploadTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  uploadedImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  noImageText: {
    fontSize: 16,
    color: '#666',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownToggleText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
  },
  dropdownChevron: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  dropdownListContainer: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 160,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 160,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#eef6ff',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#111',
  },
  dropdownItemTextSelected: {
    color: '#0a66c2',
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  singleButton: {
    margin: 5,
    padding: 10,
    borderRadius: 10,
  },
  multiButton: {
    margin: 5,
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
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
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#007BFF',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 8,
    marginTop: 4,
    borderRadius: 5,
  },
  wireframeImageUploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom: 24,
  },
  wireframeImageBox: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: '#aaa',
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wireframeUploadedImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  wireframeNoImageText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  wireframePickImageButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#aaa',
  },
  wireframePickImageButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  workArrangementCard: {
    flex: 1,
    minWidth: 120,
    maxWidth: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#bbb',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: -2,
    elevation: 2,
  },
  workArrangementCardSelected: {
    borderColor: '#007BFF',
    backgroundColor: '#e6f0ff',
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
  },
  workArrangementDesc: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
  },
});