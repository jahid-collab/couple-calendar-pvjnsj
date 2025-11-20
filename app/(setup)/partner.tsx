
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
  Clipboard,
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
  const [loading, setLoading] = useState('');
  const [invitationSent, setInvitationSent] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

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

      console.log('Invitation result:', result);
      setDebugInfo(result);

      if (result.success) {
        setInvitationSent(true);
        setInvitationLink(result.invitationLink);
        
        // Show detailed success message
        let message = '';
        if (result.emailSent) {
          message = `✅ Invitation email sent to ${partnerEmail}!\n\n📧 Your partner should receive the email shortly. Please ask them to check their inbox and spam folder.\n\n💡 You can also share the invitation link directly.`;
        } else {
          message = `⚠️ Invitation created but email could not be sent.\n\n`;
          
          if (result.emailError) {
            const errorMsg = typeof result.emailError === 'object' 
              ? JSON.stringify(result.emailError) 
              : String(result.emailError);
            message += `Error: ${errorMsg}\n\n`;
          }
          
          message += `Please share the invitation link with ${partnerEmail} manually.`;
        }

        Alert.alert(
          result.emailSent ? 'Invitation Sent! ✅' : 'Action Required ⚠️',
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

  const handleShareInvitation = async (link: string) => {
    try {
      await Share.share({
        message: `Join me on our Couple's Calendar app! 💕\n\nAccept my invitation here: ${link}`,
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

  const handleCopyLink = () => {
    if (invitationLink) {
      Clipboard.setString(invitationLink);
      Alert.alert('Copied!', 'Invitation link copied to clipboard');
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
            <IconSymbol 
              ios_icon_name={debugInfo?.emailSent ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"} 
              android_material_icon_name={debugInfo?.emailSent ? "check_circle" : "warning"} 
              size={80} 
              color={debugInfo?.emailSent ? "#4CAF50" : "#FF9800"} 
            />
          </View>
          <Text style={styles.title}>
            {debugInfo?.emailSent ? 'Invitation Sent! ✅' : 'Invitation Created ⚠️'}
          </Text>
          <Text style={styles.subtitle}>
            {debugInfo?.emailSent 
              ? 'Your partner will receive an invitation email' 
              : 'Please share the link with your partner manually'}
          </Text>
        </View>

        {debugInfo?.emailSent ? (
          <View style={styles.infoBox}>
            <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>
                ✅ Email sent to {partnerEmail}
              </Text>
              <Text style={[styles.infoText, styles.infoTextSpacing]}>
                Please ask your partner to check their inbox and spam folder.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.infoBox, { backgroundColor: '#FFF3E0' }]}>
            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={24} color="#FF9800" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>
                ⚠️ Email could not be sent
              </Text>
              {debugInfo?.emailError && (
                <Text style={[styles.infoText, styles.infoTextSpacing, { fontSize: 12, fontFamily: 'monospace' }]}>
                  Error: {JSON.stringify(debugInfo.emailError, null, 2)}
                </Text>
              )}
              <Text style={[styles.infoText, styles.infoTextSpacing]}>
                Please share the invitation link manually with {partnerEmail}
              </Text>
            </View>
          </View>
        )}

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

        {invitationLink && (
          <React.Fragment>
            <Pressable
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={() => handleShareInvitation(invitationLink)}
            >
              <IconSymbol ios_icon_name="square.and.arrow.up" android_material_icon_name="share" size={20} color="#FFFFFF" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Share Invitation Link</Text>
            </Pressable>

            <Pressable
              style={[styles.button, { backgroundColor: colors.textSecondary }]}
              onPress={handleCopyLink}
            >
              <IconSymbol ios_icon_name="doc.on.doc" android_material_icon_name="content_copy" size={20} color="#FFFFFF" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Copy Link</Text>
            </Pressable>
          </React.Fragment>
        )}

        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(tabs)/(home)')}
        >
          <Text style={styles.buttonText}>Continue to App</Text>
        </Pressable>

        {/* Debug info section */}
        {debugInfo && (
          <View style={[styles.debugBox]}>
            <Text style={styles.debugTitle}>Debug Information:</Text>
            <Text style={styles.debugText}>Email Sent: {debugInfo.emailSent ? 'Yes ✅' : 'No ❌'}</Text>
            {debugInfo.resendResponse && (
              <Text style={styles.debugText}>
                Resend Response: {JSON.stringify(debugInfo.resendResponse, null, 2)}
              </Text>
            )}
            <Text style={styles.debugText}>
              Invitation Link: {invitationLink}
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'center',
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
    marginBottom: 16,
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
  debugBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
