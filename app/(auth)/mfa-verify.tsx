import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mfaAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Colors, FontSize, FontWeight, BorderRadius, Shadows, Spacing } from '../../constants/theme';

export default function MFAVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
  const trimmed = code.trim();
  if (!trimmed) {
    setError('Please enter the verification code.');
    return;
  }
  if (!isBackupMode && trimmed.length !== 6) {
    setError('Authenticator code must be 6 digits.');
    return;
  }

  setError('');
  setLoading(true);

  try {
    const response = await mfaAPI.verify(email, trimmed, isBackupMode);

    if (response.token && response.user) {
      if (response.user.accountType !== 'personal') {
        setError('This mobile app is for personal accounts only.');
        setLoading(false);
        return;
      }
      const success = await login(response.user, response.token);
      if (success) {
        router.replace('/(tabs)/home');
      } else {
        setError('This mobile app is for personal accounts only.');
      }
    } else {
      setError('Verification failed. Please try again.');
    }
  } catch (err: any) {
    // Just show error, don't crash
    setError(err.message || 'Invalid code. Please try again.');
    setCode(''); // Clear the code so user can try again
    setTimeout(() => inputRef.current?.focus(), 100); // Refocus input
  } finally {
    setLoading(false);
  }
};

  const toggleMode = () => {
    setIsBackupMode((prev) => !prev);
    setCode('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.iconWrapper}>
              <ShieldCheck size={36} color={Colors.primaryOrange} />
            </View>
            <Text style={styles.heading}>Two-Factor Authentication</Text>
            <Text style={styles.subheading}>
              {isBackupMode
                ? 'Enter one of your 8-character backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </Text>
            {email ? (
              <Text style={styles.emailHint}>{email}</Text>
            ) : null}
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Code Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {isBackupMode ? 'Backup Code' : 'Authenticator Code'}
            </Text>
            <TextInput
              ref={inputRef}
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(t) => { setCode(t); setError(''); }}
              placeholder={isBackupMode ? 'e.g. A1B2C3D4' : '000000'}
              placeholderTextColor={Colors.textMuted}
              keyboardType={isBackupMode ? 'default' : 'number-pad'}
              autoCapitalize={isBackupMode ? 'characters' : 'none'}
              maxLength={isBackupMode ? 8 : 6}
              autoFocus
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <View style={styles.buttonContent}>
                <ShieldCheck size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Verify</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Toggle backup code mode */}
          <TouchableOpacity style={styles.toggleRow} onPress={toggleMode}>
            <KeyRound size={15} color={Colors.primaryOrange} />
            <Text style={styles.toggleText}>
              {isBackupMode
                ? 'Use authenticator app instead'
                : "Can't access your authenticator? Use a backup code"}
            </Text>
          </TouchableOpacity>

          {/* Back to login */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
          >
            <ArrowLeft size={15} color={Colors.textMuted} />
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bgLight },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    ...Shadows.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  heading: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subheading: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  emailHint: {
    fontSize: FontSize.sm,
    color: Colors.primaryOrange,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.sm,
  },
  errorBox: {
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.errorRed,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textDark,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    letterSpacing: 6,
  },
  submitButton: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toggleText: {
    color: Colors.primaryOrange,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  backText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
