import React from 'react';
import { View, Text, TextInput, ScrollView, Button } from 'react-native';
import { useForm, Controller } from 'react-hook-form';

type PassportData = {
  workMode: string;
  burnoutSigns: string;
  focusHours: string;
};

export default function PassportScreen() {
  const { control, handleSubmit } = useForm<PassportData>();

  const onSubmit = (data: PassportData) => {
    console.log(data);
    // TODO: Save to Firestore here
  };

  return (
    <ScrollView className="flex-1 px-4 py-6 bg-white">
      <Text className="text-2xl font-bold mb-4">My Wellness Passport</Text>

      <Text className="text-base font-semibold">Preferred Work Mode</Text>
      <Controller
        control={control}
        name="workMode"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border p-2 rounded mb-4"
            placeholder="e.g. Remote / Hybrid"
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <Text className="text-base font-semibold">Burnout Signs</Text>
      <Controller
        control={control}
        name="burnoutSigns"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border p-2 rounded mb-4"
            placeholder="e.g. Overthinking, fatigue"
            multiline
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <Text className="text-base font-semibold">Focus Hours</Text>
      <Controller
        control={control}
        name="focusHours"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border p-2 rounded mb-6"
            placeholder="e.g. 9am–12pm"
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <Button title="Save Passport" onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );
}
