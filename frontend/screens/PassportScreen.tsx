import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Button } from 'react-native';

type PassportData = {
  workMode: string;
  burnoutSigns: string;
  focusHours: string;
};

export default function PassportScreen() {
  const [formData, setFormData] = useState<PassportData>({
    workMode: '',
    burnoutSigns: '',
    focusHours: '',
  });

  const onSubmit = () => {
    console.log(formData);
    // TODO: Save to Firestore here
  };

  const updateField = (field: keyof PassportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView className="flex-1 px-4 py-6 bg-white">
      <Text className="text-2xl font-bold mb-4">My Wellness Passport</Text>

      <Text className="text-base font-semibold">Preferred Work Mode</Text>
      <TextInput
        className="border p-2 rounded mb-4"
        placeholder="e.g. Remote / Hybrid"
        onChangeText={(value) => updateField('workMode', value)}
        value={formData.workMode}
      />

      <Text className="text-base font-semibold">Burnout Signs</Text>
      <TextInput
        className="border p-2 rounded mb-4"
        placeholder="e.g. Overthinking, fatigue"
        multiline
        onChangeText={(value) => updateField('burnoutSigns', value)}
        value={formData.burnoutSigns}
      />

      <Text className="text-base font-semibold">Focus Hours</Text>
      <TextInput
        className="border p-2 rounded mb-6"
        placeholder="e.g. 9am–12pm"
        onChangeText={(value) => updateField('focusHours', value)}
        value={formData.focusHours}
      />

      <Button title="Save Passport" onPress={onSubmit} />
    </ScrollView>
  );
}