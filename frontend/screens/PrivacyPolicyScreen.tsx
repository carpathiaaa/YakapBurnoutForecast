import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Privacy Policy</Text>
      <Text style={styles.text}>
        This is a placeholder privacy policy for YAKAP: Burnout Forecast.
        {"\n\n"}
        We are committed to protecting your personal data. Any information collected is used solely to provide and improve the app experience.
        {"\n\n"}
        This includes information such as your name, email address, and any mood or burnout-related data you provide.
        {"\n\n"}
        Data is stored securely and will not be sold or shared with third parties.
        {"\n\n"}
        You can request data deletion or modification at any time by contacting support@example.com.
        {"\n\n"}
        Please note this is not a final legal document and is for display purposes only.
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


