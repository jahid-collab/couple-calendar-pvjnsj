
import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { useInvitations } from '@/hooks/useInvitations';
import { IconSymbol } from '@/components/IconSymbol';

export default function LoginScreen() {
  const router = useRouter();
  const { invitationToken } = useLocalSearchParams<{ invitationToken?: string }>();
  const { signIn, signUp } = useAuth();
  const { acceptInvitation, getInvitationByToken } = useInvitations();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);

  const loadInvitationEmail = useCallback(async () => {
    if (!invitationToken) return;
    
    try {
      const invitation = await getInvitationByToken(invitationToken);
      if (invitation) {
        setInvitationEmail(invitation.invitee_email);
        setEmail(invitation.invitee_email);
        setIsSignUp(true);
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
    }
  }, [invitationToken, getInvitationByToken]);

  useEffect(() => {
    if (invitationToken) {
      loadInvitationEmail();
    }
  }, [invitationToken, loadInvitationEmail]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    // If there's an invitation, verify the email matches
    if (invitationEmail && email !== invitationEmail) {
      Alert.alert(
        'Email Mismatch',
        `This invitation was sent to ${invitationEmail}. Please use that email address to sign up.`
      );
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, fullName);
        console.log('Sign up result:', result);
        
        // If there's an invitation token, try to accept it after sign up
        if (invitationToken && result.user) {
          try {
            await acceptInvitation(invitationToken);
            Alert.alert(
              'Success! 🎉',
              'Your account has been created and you\'re now connected with your partner! Please check your email to verify your account.',
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
          } catch (inviteError) {
            console.error('Error accepting invitation:', inviteError);
            Alert.alert(
              'Account Created',
              'Your account has been created! Please check your email to verify your account. You can accept the partner invitation after verification.',
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
          }
        } else {
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
        }
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

        // If there's an invitation token, redirect to accept it
        if (invitationToken) {
          router.replace(`/accept-invitation?token=${invitationToken}`);
        } else {
          // Navigation will be handled by _layout.tsx
          console.log('Login successful, user:', result.user);
        }
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
            {invitationEmail 
              ? '💕 Join your partner on this journey'
              : 'Plan your journey together'}
          </Text>
        </View>

        {invitationEmail && (
          <View style={styles.invitationBanner}>
            <IconSymbol ios_icon_name="envelope.badge.fill" android_material_icon_name="mail" size={24} color={colors.primary} />
            <Text style={styles.invitationText}>
              You&apos;ve been invited! Sign up to connect with your partner.
            </Text>
          </View>
        )}

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
              editable={!loading && !invitationEmail}
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

          {!invitationEmail && (
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
          )}
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
    marginBottom: 24,
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
  invitationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  invitationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
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
