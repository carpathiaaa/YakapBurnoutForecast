import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Button, Platform } from 'react-native';
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
        return options.map(option => (
          <TouchableOpacity 
            key={option} 
            style={[
              styles.selectButton,
              { backgroundColor: (value || []).includes(option) ? '#007BFF' : '#ccc' }
            ]} 
            onPress={() => {
              const currentValue = value || [];
              const exists = currentValue.includes(option);
              if (exists) {
                onChange(currentValue.filter((v: string) => v !== option));
              } else {
                onChange([...currentValue, option]);
              }
            }}
          >
            <Text style={{ color: (value || []).includes(option) ? 'white' : 'black' }}>
              {option}
            </Text>
          </TouchableOpacity>
        ));

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
          <View style={styles.imageUploadContainer}>
            <Text style={styles.imageUploadTitle}>{title}</Text>
            {value ? (
              <Image
                source={{ uri: value }}
                style={styles.uploadedImage}
              />
            ) : (
              <Text style={styles.noImageText}>No image selected.</Text>
            )}
            <Button
              title="Pick an image"
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
            />
          </View>
        );

      case 'dropdown':
        return (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => onChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item key="placeholder" label="Select an option..." value="" />
            {options?.map((opt) => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
          </Picker>
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
        const timeRangeValue = value || {};
        
        return (
          <View>
            {extra?.weekdays?.map((day: string) => (
              <View key={day} style={styles.timeRangeDay}>
                <Text style={styles.dayLabel}>{day}</Text>
                
                <View style={styles.timeButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.timeButton, timeRangeValue[day]?.start && styles.timeButtonSelected]}
                    onPress={() => {
                      console.log(`Selecting start time for ${day}`);
                      setActiveDay(day);
                      setActivePickerType('start');
                      setTempDate(new Date());
                    }}
                  >
                    <Text style={styles.timeButtonText}>
                      {timeRangeValue[day]?.start ? `Start: ${timeRangeValue[day].start}` : 'Select Start Time'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.timeButton, timeRangeValue[day]?.end && styles.timeButtonSelected]}
                    onPress={() => {
                      console.log(`Selecting end time for ${day}`);
                      setActiveDay(day);
                      setActivePickerType('end');
                      setTempDate(new Date());
                    }}
                  >
                    <Text style={styles.timeButtonText}>
                      {timeRangeValue[day]?.end ? `End: ${timeRangeValue[day].end}` : 'Select End Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {isPickerVisible && (
              <DateTimePicker
                mode="time"
                value={tempDate}
                onChange={handleTimeChange}
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
  }
});