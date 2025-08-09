import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Terms of Service</Text>
      <Text style={styles.text}>
        Welcome to YAKAP: Burnout Forecast.
        {"\n\n"}
        By using this app, you agree to the following placeholder terms:
        {"\n\n"}
        1. You must be 13 years or older to use this app.
        {"\n"}
        2. You are responsible for any content you input and should avoid submitting harmful or inappropriate data.
        {"\n"}
        3. The app provides wellness-related features for informational purposes only and does not constitute medical advice.
        {"\n"}
        4. We reserve the right to update these terms at any time.
        {"\n\n"}
        These terms are temporary and will be replaced with a finalized version before official release.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});


