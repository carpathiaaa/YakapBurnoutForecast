import React, { useEffect } from 'react';
import { Button, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // adjust path
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

console.log(AuthSession.makeRedirectUri({ useProxy: true } as any));

export default function GoogleSignInButton() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '957912783664-p4a5sb2v8b6ctrb2lpaoe35m254udaa0.apps.googleusercontent.com',
    androidClientId: '957912783664-jj228h9ubsglchccoceahk6s0t9maqu1.apps.googleusercontent.com',
    iosClientId: '957912783664-1hrt0a7jr0ilic69ib14fqkkue2ml6it.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }as any),
  });

 useEffect(() => {
  const authenticate = async () => {
    console.log('response type:', response?.type);

    if (response?.type === 'success' && response.params?.id_token) {
      const idToken = response.params.id_token;

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(auth, credential);
        const user = userCred.user;

        console.log('Firebase Sign-in success:', user.email);

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
        });

        Alert.alert('Welcome', `Signed in as ${user.displayName}`);
      } catch (error) {
        console.error('❌ Firebase sign-in error', error);
        Alert.alert('Error', 'Firebase sign-in failed.');
      }
    } else if (response?.type === 'success') {
      console.warn('No idToken found in response.params');
    }
  };

  authenticate();
}, [response]);

  return (
<TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
  <Image
    source={require('../assets/google-logo.png')}
    style={styles.googleLogo}
  />
  <Text style={styles.googleButtonText}>Continue with Google</Text>
</TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',       // 🪄 Align logo + text horizontally
    alignItems: 'center',       // Vertically center them
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderColor: '#00000',
    borderWidth: 2,
  },
  googleLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
    marginVertical: 8,
    resizeMode: 'contain',
  },
  googleButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1F1F1F',
  },
});
