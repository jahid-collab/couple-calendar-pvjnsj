
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { IconSymbol } from '@/components/IconSymbol';

export default function PartnerSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, createCouple } = useCouple(user?.id);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSkip = () => {
    router.replace('/(tabs)/(home)');
  };

  const handleConnect = async () => {
    if (!partnerEmail) {
      Alert.alert('Error', 'Please enter your partner&apos;s email');
      return;
    }

    if (partnerEmail === user?.email) {
      Alert.alert('Error', 'You cannot connect with yourself');
      return;
    }

    setLoading(true);

    try {
      // Update profile with partner email
      await updateProfile({ partner_email: partnerEmail });

      // Try to create couple if partner exists
      try {
        await createCouple(partnerEmail);
        Alert.alert(
          'Success!',
          'You are now connected with your partner!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/(home)') }]
        );
      } catch (error: any) {
        // Partner might not have signed up yet
        Alert.alert(
          'Invitation Sent',
          'Your partner hasn&apos;t signed up yet. Once they create an account with this email, you&apos;ll be automatically connected!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/(home)') }]
        );
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      Alert.alert('Error', error.message || 'Failed to connect with partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol name="person.2.fill" size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>Connect with Your Partner</Text>
        <Text style={styles.subtitle}>
          Share your calendar, goals, and reminders
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Partner's Email"
            placeholderTextColor={colors.textSecondary}
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Connect</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <IconSymbol name="info.circle.fill" size={24} color={colors.secondary} />
        <Text style={styles.infoText}>
          Your partner needs to sign up with the same email address you enter here.
          Once they do, you&apos;ll be automatically connected!
        </Text>
      </View>
    </ScrollView>
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
    fontSize: 28,
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
    marginBottom: 32,
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
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
