
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
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { useCouple } from '@/hooks/useCouple';
import { useInvitations } from '@/hooks/useInvitations';
import { IconSymbol } from '@/components/IconSymbol';

export default function PartnerSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, createCouple } = useCouple(user?.id);
  const { sendInvitation, loading: invitationLoading } = useInvitations();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Update profile with partner email
      await updateProfile({ partner_email: partnerEmail });

      // Try to create couple if partner already exists
      try {
        await createCouple(partnerEmail);
        Alert.alert(
          'Success! 🎉',
          'You are now connected with your partner!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/(home)') }]
        );
        return;
      } catch (error: any) {
        console.log('Partner not found, sending invitation...');
      }

      // Partner doesn't exist yet, send invitation
      const inviterName = profile?.full_name || user?.email || 'Someone';
      const result = await sendInvitation(partnerEmail, inviterName);

      if (result.success) {
        setInvitationSent(true);
        
        // Show success message
        const message = result.emailSent
          ? `Invitation sent to ${partnerEmail}! 📧\n\nThey will receive an email with a link to join. You can also share the invitation link directly.`
          : `Invitation created! 📧\n\nShare the invitation link with ${partnerEmail} so they can join.`;

        Alert.alert(
          'Invitation Sent! ✅',
          message,
          [
            {
              text: 'Share Link',
              onPress: () => handleShareInvitation(result.invitationLink),
            },
            {
              text: 'Continue to App',
              onPress: () => router.replace('/(tabs)/(home)'),
              style: 'default',
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Connect error:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleShareInvitation = async (invitationLink: string) => {
    try {
      await Share.share({
        message: `Join me on our Couple's Calendar app! 💕\n\nAccept my invitation here: ${invitationLink}`,
        title: 'Join Our Couple\'s Calendar',
      });
      
      // After sharing, navigate to the app
      setTimeout(() => {
        router.replace('/(tabs)/(home)');
      }, 500);
    } catch (error) {
      console.error('Error sharing invitation:', error);
      // Still navigate to the app even if sharing fails
      router.replace('/(tabs)/(home)');
    }
  };

  // If invitation was sent, show success state
  if (invitationSent) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Invitation Sent! ✅</Text>
          <Text style={styles.subtitle}>
            Your partner will receive an invitation to join
          </Text>
        </View>

        <View style={styles.infoBox}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.secondary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Once {partnerEmail} signs up and accepts the invitation, you&apos;ll be automatically connected!
            </Text>
            <Text style={[styles.infoText, styles.infoTextSpacing]}>
              You can start using the app now and your partner will join you soon.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(tabs)/(home)')}
        >
          <Text style={styles.buttonText}>Continue to App</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="people" size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>Connect with Your Partner</Text>
        <Text style={styles.subtitle}>
          Share your calendar, goals, and reminders
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Partner's Email"
            placeholderTextColor={colors.textSecondary}
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading && !invitationLoading}
          />
        </View>

        <Pressable
          style={[styles.button, (loading || invitationLoading) && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading || invitationLoading}
        >
          {(loading || invitationLoading) ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send Invitation</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading || invitationLoading}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.secondary} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoText}>
            Enter your partner&apos;s email address and we&apos;ll send them an invitation to join the app.
          </Text>
          <Text style={[styles.infoText, styles.infoTextSpacing]}>
            Once they sign up and accept the invitation, you&apos;ll be automatically connected!
          </Text>
        </View>
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
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoTextSpacing: {
    marginTop: 8,
  },
});
