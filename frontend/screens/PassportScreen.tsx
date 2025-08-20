import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import PersistentHeader from '../components/PersistentHeader';

interface PassportFormData {
  profileImage: string | null;
  department: string;
  productiveTime: string;
  energizedDays: string;
  meetingComfort: string;
  workArrangement: 'Onsite' | 'Hybrid' | 'Remote';
  focusHours: { start: string; end: string };
  stressSignals: string[];
  recoveryStrategies: string[];
}

export default function PassportScreen() {
  // Basic fallback display values (will be overridden by Firestore data)
  const user = {
    email: auth.currentUser?.email ?? 'user@example.com',
    productiveTime: '',
    energizedDays: '',
    meetingComfort: '',
    department: '',
    stressSignals: '',
    recoveryStrategies: '',
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
      department: '',
      productiveTime: '',
      energizedDays: '',
      meetingComfort: '',
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
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | 'productive' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showProductiveTimePicker, setShowProductiveTimePicker] = useState(false);

  const workArrangementOptions = ['Onsite', 'Hybrid', 'Remote'];
  
  const departmentOptions = [
    'Engineering',
    'Marketing', 
    'Sales',
    'Human Resources',
    'Finance',
    'Operations',
    'Product',
    'Design',
    'Customer Support',
    'Legal',
    'IT',
    'Research & Development'
  ];

  const productiveTimeOptions = [
    'Early Morning (6:00 AM - 9:00 AM)',
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 3:00 PM)',
    'Late Afternoon (3:00 PM - 6:00 PM)',
    'Evening (6:00 PM - 9:00 PM)',
    'Late Evening (9:00 PM - 12:00 AM)'
  ];

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

      const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userSnap.exists()) return;

      const data = userSnap.data() as any;
      const profile = data.profile || {};

      // Map profile.energizedDays (array) to display string like "MON, TUE"
      const toAbbr = (d: string) => {
        const map: Record<string, string> = {
          Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
        };
        return map[d] || d.slice(0, 3).toUpperCase();
      };
      const energizedDaysDisplay = Array.isArray(profile.energizedDays)
        ? profile.energizedDays.map((d: string) => toAbbr(d)).join(', ')
        : '';

      // Map meetingTolerance (0-10) to comfort label
      const meetingComfortFromTolerance = (n?: number) => {
        if (typeof n !== 'number') return '';
        if (n >= 7) return 'FREQUENT MEETINGS';
        if (n >= 3) return 'OCCASIONAL MEETINGS';
        return 'MINIMAL MEETINGS';
      };

      // Reset form with reflected onboarding profile data
      reset({
        profileImage: profile.profilePictureUri ?? null,
        workArrangement: profile.workArrangement ?? 'Hybrid',
        focusHours: {
          start: profile.focusHours?.start ?? '09:00',
          end: profile.focusHours?.end ?? '17:00',
        },
        department: profile.department ?? '',
        productiveTime: profile.productivityTime ?? '',
        energizedDays: energizedDaysDisplay,
        meetingComfort: meetingComfortFromTolerance(profile.meetingTolerance),
        stressSignals: profile.stressSignals ?? [],
        recoveryStrategies: profile.recoveryStrategies ?? [],
      });
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

      // Map edited Passport fields back to centralized profile structure
      const energizedArray = (data.energizedDays || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(abbr => {
          const map: Record<string, string> = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };
          const upper = abbr.toUpperCase();
          return map[upper] || abbr;
        });

      const meetingToleranceFromComfort = (label: string): number | undefined => {
        if (!label) return undefined;
        if (label.includes('FREQUENT')) return 8;
        if (label.includes('OCCASIONAL')) return 5;
        if (label.includes('MINIMAL')) return 1;
        return undefined;
      };

      await setDoc(doc(db, 'users', currentUser.uid), {
        profile: {
          profilePictureUri: data.profileImage ?? null,
          workArrangement: data.workArrangement,
          focusHours: {
            start: data.focusHours?.start ?? '09:00',
            end: data.focusHours?.end ?? '17:00',
          },
          productivityTime: data.productiveTime || '',
          energizedDays: energizedArray,
          meetingTolerance: meetingToleranceFromComfort(data.meetingComfort),
          stressSignals: data.stressSignals || [],
          recoveryStrategies: data.recoveryStrategies || [],
          department: data.department || '',
        },
        lastActive: new Date(),
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
      
      if (activeTimeField === 'productive') {
        setValue('productiveTime', formatted, { shouldValidate: true });
      } else {
        setValue(`focusHours.${activeTimeField}`, formatted, { shouldValidate: true });
      }
      
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
            
            {/* Department */}
            <View className="mb-2">
              <Text className="text-base text-black text-left">Department:</Text>
              {isEditMode ? (
                <View className="mt-1">
                  <TouchableOpacity
                    className="py-2 px-3 bg-gray-100 rounded-lg border border-gray-300"
                    onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
                    disabled={!isEditMode || isSubmitting}
                  >
                    <Text className="text-base font-bold text-black">
                      {watchedValues.department || 'Select department'}
                    </Text>
                  </TouchableOpacity>
                                     {showDepartmentPicker && (
                     <View className="mt-1 bg-white border border-gray-300 rounded-lg max-h-32 absolute top-full left-0 right-0 z-10">
                       <ScrollView 
                         className="max-h-32"
                         nestedScrollEnabled={true}
                         showsVerticalScrollIndicator={false}
                       >
                         {departmentOptions.map((dept) => (
                           <TouchableOpacity
                             key={dept}
                             className={`py-2 px-3 border-b border-gray-100 ${
                               watchedValues.department === dept ? 'bg-gray-200' : ''
                             }`}
                             onPress={() => {
                               setValue('department', dept, { shouldValidate: true });
                               setShowDepartmentPicker(false);
                             }}
                           >
                             <Text className={`text-sm ${
                               watchedValues.department === dept ? 'font-bold text-black' : 'text-black'
                             }`}>
                               {dept}
                             </Text>
                           </TouchableOpacity>
                         ))}
                       </ScrollView>
                     </View>
                   )}
                </View>
              ) : (
                <Text className="text-base font-bold text-black mt-1">
                  {watchedValues.department || user.department}
                </Text>
              )}
            </View>

            {/* Productive Time */}
            <View className="mb-2">
              <Text className="text-base text-black text-left">Most productive in the:</Text>
              {isEditMode ? (
                <View className="mt-1">
                  <TouchableOpacity
                    className="py-2 px-3 bg-gray-100 rounded-lg border border-gray-300"
                    onPress={() => setShowProductiveTimePicker(!showProductiveTimePicker)}
                    disabled={!isEditMode || isSubmitting}
                  >
                    <Text className="text-base font-bold text-black">
                      {watchedValues.productiveTime || 'Select productive time'}
                    </Text>
                  </TouchableOpacity>
                                     {showProductiveTimePicker && (
                     <View className="mt-1 bg-white border border-gray-300 rounded-lg max-h-32 absolute top-full left-0 right-0 z-10">
                       <ScrollView 
                         className="max-h-32"
                         nestedScrollEnabled={true}
                         showsVerticalScrollIndicator={false}
                       >
                         {productiveTimeOptions.map((time) => (
                           <TouchableOpacity
                             key={time}
                             className={`py-2 px-3 border-b border-gray-100 ${
                               watchedValues.productiveTime === time ? 'bg-gray-200' : ''
                             }`}
                             onPress={() => {
                               setValue('productiveTime', time, { shouldValidate: true });
                               setShowProductiveTimePicker(false);
                             }}
                           >
                             <Text className={`text-sm ${
                               watchedValues.productiveTime === time ? 'font-bold text-black' : 'text-black'
                             }`}>
                               {time}
                             </Text>
                           </TouchableOpacity>
                         ))}
                       </ScrollView>
                     </View>
                   )}
                </View>
              ) : (
                <Text className="text-base font-bold text-black mt-1">
                  {watchedValues.productiveTime || user.productiveTime}
                </Text>
              )}
            </View>

            {/* Energized Days */}
            <View className="mb-2">
              <Text className="text-base text-black text-left">Most energized on:</Text>
              {isEditMode ? (
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                    <TouchableOpacity
                      key={day}
                      className={`py-1 px-2 rounded-lg border ${
                        (watchedValues.energizedDays || '').includes(day)
                          ? 'bg-black border-black'
                          : 'bg-white border-gray-300'
                      }`}
                      onPress={() => {
                        const currentDays = watchedValues.energizedDays || '';
                        const dayList = currentDays.split(', ').filter(d => d);
                        const newDays = dayList.includes(day)
                          ? dayList.filter(d => d !== day)
                          : [...dayList, day];
                        setValue('energizedDays', newDays.join(', '), { shouldValidate: true });
                      }}
                      disabled={!isEditMode || isSubmitting}
                    >
                      <Text className={`text-xs font-medium ${
                        (watchedValues.energizedDays || '').includes(day) ? 'text-white' : 'text-black'
                      }`}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-base font-bold text-black mt-1">
                  {watchedValues.energizedDays || user.energizedDays}
                </Text>
              )}
            </View>

            {/* Meeting Comfort */}
            <View className="mb-2">
              <Text className="text-base text-black text-left">Comfortable with:</Text>
              {isEditMode ? (
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {['FREQUENT MEETINGS', 'OCCASIONAL MEETINGS', 'MINIMAL MEETINGS'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      className={`py-1 px-2 rounded-lg border ${
                        watchedValues.meetingComfort === option
                          ? 'bg-black border-black'
                          : 'bg-white border-gray-300'
                      }`}
                      onPress={() => setValue('meetingComfort', option, { shouldValidate: true })}
                      disabled={!isEditMode || isSubmitting}
                    >
                      <Text className={`text-xs font-medium ${
                        watchedValues.meetingComfort === option ? 'text-white' : 'text-black'
                      }`}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-base font-bold text-black mt-1">
                  {watchedValues.meetingComfort || user.meetingComfort}
                </Text>
              )}
            </View>
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
                      ? 'bg-black border-black'
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
                      ? 'bg-black border-black'
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
                  ? 'bg-black border-black' 
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