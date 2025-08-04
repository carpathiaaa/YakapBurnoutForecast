import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../type'; // adjust the path if needed


type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcome}>Welcome to</Text>
        </View>

        <Text style={styles.title}>YAKAP: Burnout Forecast</Text>
      </View>

      <GoogleSignInButton />

      <Text style={styles.terms}>
        By signing up or signing in you agree to our{' '}
        <Text
          style={styles.linkText}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          Privacy Policy
        </Text>{' '}
        and{' '}
        <Text
          style={styles.linkText}
          onPress={() => navigation.navigate('TermsOfService')}
        >
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
    outlineColor: '#000000',
    outlineWidth: 3,
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
  link: {
    marginTop: 15,
    fontSize: 14,
    color: '#000',
    textDecorationLine: 'underline',
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