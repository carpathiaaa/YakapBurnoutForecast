import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type LoginScreenProps = {
  onContinue: () => void;
};

export default function LoginScreen({ onContinue }: LoginScreenProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcome}>Welcome to</Text>
        </View>
        <Text style={styles.title}>YAKAP: Burnout Forecast</Text>
      </View>

      <TouchableOpacity onPress={onContinue} style={styles.googleButton}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By signing up or signing in you agree to our{' '}
        <Text style={styles.linkText} onPress={() => (navigation as any).navigate('PrivacyPolicy')}>
          Privacy Policy
        </Text>{' '}
        and{' '}
        <Text style={styles.linkText} onPress={() => (navigation as any).navigate('TermsOfService')}>
          Terms of Service
        </Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 50,
    marginHorizontal: 30,
    backgroundColor: '#DBD7D5',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 15,
  },
  welcomeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  textContainer: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  welcome: {
    fontSize: 42,
    color: '#333',
    textAlign: 'left',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 42,
    color: '#111',
    marginBottom: 20,
    textAlign: 'left',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  terms: {
    marginTop: 50,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  linkText: {
    fontWeight: 'bold',
    color: '#000',
  },
});


