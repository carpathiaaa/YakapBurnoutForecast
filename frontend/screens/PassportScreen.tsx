import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';

interface PassportFormData {
  profileImage: string | null;
  workArrangement: 'Onsite' | 'Hybrid' | 'Remote';
  focusHours: { start: string; end: string };
  stressSignals: string[];
  recoveryStrategies: string[];
}

export default function PassportScreen() {
  // Placeholder data for now
  const user = {
    email: 'johndoe@gmail.com',
    productiveTime: 'AFTERNOON',
    energizedDays: 'FRI, SAT',
    meetingComfort: 'FREQUENT MEETINGS',
    stressSignals: '',
    recoveryStrategies: '',
    // Add more fields as needed
  };

  // Form state management
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<PassportFormData>({
    defaultValues: {
      profileImage: null,
      workArrangement: 'Hybrid',
      focusHours: { start: '09:00', end: '17:00' },
      stressSignals: [],
      recoveryStrategies: [],
    },
    mode: 'onChange',
  });

  // Watch form values for UI updates
  const watchedValues = watch();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const workArrangementOptions = ['Onsite', 'Hybrid', 'Remote'];

  // Options from onboardingSteps
  const stressSignalsOptions = [
    'Headaches or fatigue',
    'Trouble concentrating',
    'Irritability or mood swings',
    'Loss of motivation',
    'Sleep issues',
  ];

  const recoveryStrategiesOptions = [
    'Naps or sleep',
    'Exercise',
    'Meditation / prayer',
    'Talking with friends/family',
    'Journaling',
    'Taking breaks from screens',
  ];

  // Load user data on component mount
  useEffect(() => {
    loadUserPassport();
  }, []);

  const loadUserPassport = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.passport) {
          reset(userData.passport);
        }
      }
    } catch (error) {
      console.error('Error loading passport data:', error);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share button pressed');
  };

  const handleEdit = () => {
    if (isEditMode) {
      // Save changes
      handleSubmit(onSubmit)();
    } else {
      // Enter edit mode
      setIsEditMode(true);
    }
  };

  const onSubmit = async (data: PassportFormData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      await setDoc(doc(db, 'users', currentUser.uid), {
        passport: data,
        updatedAt: new Date(),
      }, { merge: true });

      setIsEditMode(false);
      Alert.alert('Success', 'Passport updated successfully!');
    } catch (error) {
      console.error('Error saving passport:', error);
      Alert.alert('Error', 'Failed to save passport. Please try again.');
    }
  };

  const handleTimeSelect = (field: 'start' | 'end') => {
    if (!isEditMode) return;
    setActiveTimeField(field);
    setTempDate(new Date());
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (Platform.OS === 'android') {
      setActiveTimeField(null);
    }

    if (selectedDate && activeTimeField) {
      const formatted = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      setValue(`focusHours.${activeTimeField}`, formatted, { shouldValidate: true });
      
      if (Platform.OS === 'ios') {
        setActiveTimeField(null);
      }
    }
  };

  const handleStressSignalToggle = (signal: string) => {
    if (!isEditMode) return;
    
    const currentSignals = watchedValues.stressSignals || [];
    const newSignals = currentSignals.includes(signal)
      ? currentSignals.filter(s => s !== signal)
      : [...currentSignals, signal];
    
    setValue('stressSignals', newSignals, { shouldValidate: true });
  };

  const handleRecoveryStrategyToggle = (strategy: string) => {
    if (!isEditMode) return;
    
    const currentStrategies = watchedValues.recoveryStrategies || [];
    const newStrategies = currentStrategies.includes(strategy)
      ? currentStrategies.filter(s => s !== strategy)
      : [...currentStrategies, strategy];
    
    setValue('recoveryStrategies', newStrategies, { shouldValidate: true });
  };

  const handleWorkArrangementSelect = (option: 'Onsite' | 'Hybrid' | 'Remote') => {
    if (!isEditMode) return;
    setValue('workArrangement', option, { shouldValidate: true });
  };

  const handleImagePick = async () => {
    if (!isEditMode) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
        setValue('profileImage', pickerResult.assets[0].uri, { shouldValidate: true });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-[#F8F8F8]">
      <PersistentHeader />
      <ScrollView>
        {/* SECTION: Passport Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl border-2 border-black shadow flex-row min-h-[180px]">
          {/* Profile Picture Placeholder */}
          <View className="flex-1 justify-center items-center p-4">
            <TouchableOpacity
              className="w-full h-60 rounded-2xl border-2 border-black overflow-hidden"
              onPress={handleImagePick}
              disabled={!isEditMode || isSubmitting}
            >
              {watchedValues.profileImage ? (
                <Image
                  source={{ uri: watchedValues.profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-300 justify-center items-center">
                  <Text className="text-gray-600 text-center">
                    {isEditMode ? 'Tap to add photo' : 'No photo'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {/* Passport Info */}
          <View className="flex-1 justify-center p-4">
            <Text className="text-xs text-black text-left mb-1">{user.email}</Text>
            <Text className="text-2xl font-extrabold text-black text-left leading-tight mb-1">Wellness{`\n`}Passport</Text>
            <View className="h-0.5 bg-black mb-3 mt-1" />
            <Text className="text-base text-black mb-2 text-left">Most productive in the{`\n`} <Text className="font-bold">{user.productiveTime}</Text></Text>
            <Text className="text-base text-black mb-2 text-left">Most energized on{`\n`} <Text className="font-bold">{user.energizedDays}</Text></Text>
            <Text className="text-base text-black text-left">Comfortable with{`\n`} <Text className="font-bold">{user.meetingComfort}</Text></Text>
          </View>
        </View>
        {/* Bottom border for the card */}
        <View className="mt-10 mx-4 h-0.5 bg-black mb-2" />

        {/* SECTION: Stress Signs/Burnout Signals */}
        <View className="mx-4 mt-8">
          <Text className="text-xl font-bold mb-4 text-left">Stress Signs/Burnout Signals</Text>
          <View className="bg-[#F5F5F5] rounded-2xl border-2 border-black p-4">
            <View className="flex-row flex-wrap gap-2">
              {stressSignalsOptions.map((signal) => (
                <TouchableOpacity
                  key={signal}
                  className={`py-2 px-4 rounded-xl border-2 ${
                    (watchedValues.stressSignals || []).includes(signal)
                      ? 'bg-blue-500 border-blue-600'
                      : 'bg-white border-black'
                  } ${!isEditMode ? 'opacity-60' : ''}`}
                  onPress={() => handleStressSignalToggle(signal)}
                  disabled={!isEditMode || isSubmitting}
                >
                  <Text className={`text-sm font-medium ${
                    (watchedValues.stressSignals || []).includes(signal) ? 'text-white' : 'text-black'
                  }`}>
                    {signal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION: Recovery Strategies */}
        <View className="mx-4 mt-8">
          <Text className="text-xl font-bold mb-4 text-left">Recovery Strategies</Text>
          <View className="bg-[#F5F5F5] rounded-2xl border-2 border-black p-4">
            <View className="flex-row flex-wrap gap-2">
              {recoveryStrategiesOptions.map((strategy) => (
                <TouchableOpacity
                  key={strategy}
                  className={`py-2 px-4 rounded-xl border-2 ${
                    (watchedValues.recoveryStrategies || []).includes(strategy)
                      ? 'bg-green-500 border-green-600'
                      : 'bg-white border-black'
                  } ${!isEditMode ? 'opacity-60' : ''}`}
                  onPress={() => handleRecoveryStrategyToggle(strategy)}
                  disabled={!isEditMode || isSubmitting}
                >
                  <Text className={`text-sm font-medium ${
                    (watchedValues.recoveryStrategies || []).includes(strategy) ? 'text-white' : 'text-black'
                  }`}>
                    {strategy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION: Work Arrangement */}
        <View className="mx-4 mt-8">
          <Text className="text-xl font-bold mb-4 text-left">Work Arrangement</Text>
          <View className="flex-row gap-3">
            {workArrangementOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                  watchedValues.workArrangement === option 
                    ? 'bg-gray-200 border-black' 
                    : 'bg-white border-black'
                } ${!isEditMode ? 'opacity-60' : ''}`}
                onPress={() => handleWorkArrangementSelect(option as 'Onsite' | 'Hybrid' | 'Remote')}
                disabled={!isEditMode || isSubmitting}
              >
                <Text className="text-center font-bold text-black">{option.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION: Focus Hours */}
        <View className="mx-4 mt-8">
          <Text className="text-xl font-bold mb-4 text-left">Focus Hours</Text>
          <View className="bg-white rounded-xl border-2 border-black p-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                className={`flex-1 mr-2 py-3 px-4 rounded-xl border-2 ${
                  activeTimeField === 'start' 
                    ? 'bg-gray-200 border-black' 
                    : 'bg-white border-black'
                } ${!isEditMode ? 'opacity-60' : ''}`}
                onPress={() => handleTimeSelect('start')}
                disabled={!isEditMode || isSubmitting}
              >
                <Text className="text-center font-bold text-black">From: {watchedValues.focusHours?.start || '09:00'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 ml-2 py-3 px-4 rounded-xl border-2 ${
                  activeTimeField === 'end' 
                    ? 'bg-gray-200 border-black' 
                    : 'bg-white border-black'
                } ${!isEditMode ? 'opacity-60' : ''}`}
                onPress={() => handleTimeSelect('end')}
                disabled={!isEditMode || isSubmitting}
              >
                <Text className="text-center font-bold text-black">To: {watchedValues.focusHours?.end || '17:00'}</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-gray-100 rounded-lg p-3">
              <Text className="text-center text-sm text-gray-600">
                Selected Focus Hours: {watchedValues.focusHours?.start || '09:00'} - {watchedValues.focusHours?.end || '17:00'}
              </Text>
            </View>
          </View>
        </View>

        {/* DateTimePicker */}
        {showTimePicker && (
          <DateTimePicker
            value={tempDate}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {/* SECTION: Separator Line */}
        <View className="mx-4 mt-9 h-0.5 bg-black" />

        {/* SECTION: Action Buttons */}
        <View className="mx-4 mt-8 mb-10">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 px-4 bg-white rounded-xl border-2 border-black"
              onPress={handleShare}
              disabled={isSubmitting}
            >
              <Text className="text-center font-bold text-black">SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-xl border-2 flex-row items-center justify-center ${
                isEditMode 
                  ? 'bg-red-500 border-red-600' 
                  : 'bg-white border-black'
              }`}
              onPress={handleEdit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={isEditMode ? "white" : "black"} />
              ) : (
                <Text className={`text-center font-bold ${
                  isEditMode ? 'text-white' : 'text-black'
                }`}>
                  {isEditMode ? 'SAVE' : 'EDIT'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}