
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { useInvitations } from '@/hooks/useInvitations';
import { IconSymbol } from '@/components/IconSymbol';

export default function AcceptInvitationScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const { acceptInvitation, getInvitationByToken, loading: invitationLoading } = useInvitations();
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && !authLoading) {
      loadInvitation();
    }
  }, [token, authLoading]);

  const loadInvitation = async () => {
    try {
      const invitationData = await getInvitationByToken(token);
      
      if (!invitationData) {
        setError('Invalid or expired invitation');
        return;
      }

      // Check if invitation has expired
      if (new Date(invitationData.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      if (invitationData.status !== 'pending') {
        setError('This invitation has already been used');
        return;
      }

      setInvitation(invitationData);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation');
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // User needs to sign up or sign in first
      Alert.alert(
        'Sign Up Required',
        'You need to create an account to accept this invitation. Please sign up with the email address this invitation was sent to.',
        [
          {
            text: 'Sign Up',
            onPress: () => router.push(`/(auth)/login?invitationToken=${token}`),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    try {
      await acceptInvitation(token);
      Alert.alert(
        'Success! 🎉',
        'You are now connected with your partner!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/(home)'),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      Alert.alert('Error', err.message || 'Failed to accept invitation');
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)/(home)'),
        },
      ]
    );
  };

  if (authLoading || invitationLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading invitation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="error" size={64} color={colors.error || '#FF5252'} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/(home)')}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  if (!invitation) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol ios_icon_name="heart.circle.fill" android_material_icon_name="favorite" size={80} color={colors.primary} />
        <Text style={styles.title}>Partner Invitation</Text>
        <Text style={styles.subtitle}>
          You&apos;ve been invited to connect as a couple!
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Invitation from:</Text>
          <Text style={styles.infoValue}>{invitation.invitee_email}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            disabled={invitationLoading}
          >
            {invitationLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Accept Invitation</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={invitationLoading}
          >
            <Text style={[styles.buttonText, styles.declineButtonText]}>Decline</Text>
          </Pressable>
        </View>

        <Text style={styles.noteText}>
          By accepting, you&apos;ll be able to share calendars, goals, and reminders with your partner.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.primary,
    boxShadow: '0px 4px 12px rgba(233, 30, 99, 0.3)',
    elevation: 4,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  declineButtonText: {
    color: colors.textSecondary,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
});
