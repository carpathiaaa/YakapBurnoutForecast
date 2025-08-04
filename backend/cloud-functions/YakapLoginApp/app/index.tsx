import { View, StyleSheet } from 'react-native';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <GoogleSignInButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
