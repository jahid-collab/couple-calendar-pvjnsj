
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Pastel color palette inspired by the design
export const colors = {
  // Backgrounds
  background: '#FFF9F5',
  card: '#FFFFFF',
  
  // Text colors
  text: '#1A1A1A',
  textSecondary: '#8E8E93',
  
  // Pastel accent colors
  peach: '#FF9B7D',
  lightPeach: '#FFE5DC',
  lavender: '#B8A4FF',
  lightLavender: '#E8E0FF',
  yellow: '#FFD88A',
  lightYellow: '#FFF4DC',
  pink: '#FFB4C8',
  lightPink: '#FFE5ED',
  mint: '#A8E6CF',
  lightMint: '#E0F7ED',
  
  // Primary colors
  primary: '#FF9B7D',
  secondary: '#B8A4FF',
  accent: '#FFD88A',
  
  // UI elements
  border: '#F0F0F0',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.card,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    width: '100%',
    boxShadow: `0px 4px 16px ${colors.shadow}`,
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
