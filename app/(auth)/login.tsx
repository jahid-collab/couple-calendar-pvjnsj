
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { IconSymbol } from '@/components/IconSymbol';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, fullName);
        console.log('Sign up result:', result);
        
        Alert.alert(
          'Check Your Email! 📧',
          'We\'ve sent you a verification email. Please click the link in the email to verify your account before logging in.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsSignUp(false);
                setPassword('');
                setFullName('');
              },
            },
          ]
        );
      } else {
        const result = await signIn(email, password);
        console.log('Sign in result:', result);
        
        if (!result.session) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email address before logging in. Check your inbox for the verification link.'
          );
          return;
        }

        // Navigation will be handled by _layout.tsx
        console.log('Login successful, user:', result.user);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification link.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="heart.fill" android_material_icon_name="favorite" size={64} color={colors.primary} />
          </View>
          <Text style={styles.title}>Couple&apos;s Calendar</Text>
          <Text style={styles.subtitle}>
            Plan your journey together
          </Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setFullName('');
            }}
            disabled={loading}
          >
            <Text style={styles.switchButtonText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Don&apos;t have an account? Sign Up'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💕 Share your calendar with your partner
          </Text>
          <Text style={styles.footerText}>
            🎯 Set and track shared goals
          </Text>
          <Text style={styles.footerText}>
            📅 Plan events and trips together
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0px 4px 12px rgba(233, 30, 99, 0.3)',
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
