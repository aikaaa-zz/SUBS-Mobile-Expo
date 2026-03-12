import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { userAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await userAPI.login({ email, password });

      if (response.requiresMFA) {
        router.push({ pathname: '/(auth)/mfa-verify', params: { email } });
        setLoading(false);
        return;
      }

      if (response.token && response.user) {
        if (response.user.accountType !== 'personal') {
          setError('This mobile app is for personal accounts only. Please use the web version for business accounts.');
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
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return;
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    try {
      await userAPI.forgotPassword({ email: forgotPasswordEmail });
      setForgotPasswordMessage('Password reset link sent to your email!');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage('');
      }, 3000);
    } catch (err: any) {
      setForgotPasswordMessage(err.message || 'Failed to send reset email.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card with gradient */}
          <LinearGradient
            colors={['#C84A00', '#3B1200', '#0D0500']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.card}
          >
            {/* Brand header */}
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/images/subsicon.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Subs</Text>
            </View>

            <Text style={styles.heading}>Log in</Text>
            <Text style={styles.subheading}>Continue to Subs</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email input */}
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="Email address"
              placeholderTextColor="#7a7a7a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {/* Password input */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="Password"
                placeholderTextColor="#7a7a7a"
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword
                  ? <EyeOff size={18} color="#7a7a7a" />
                  : <Eye size={18} color="#7a7a7a" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Continue with email button */}
            <TouchableOpacity
              style={[styles.emailButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.emailButtonText}>CONTINUE WITH EMAIL</Text>}
            </TouchableOpacity>

            {/* Passkey button */}
            <TouchableOpacity style={styles.passkeyButton} activeOpacity={0.8}>
              <Text style={styles.passkeyIcon}>🔑</Text>
              <Text style={styles.passkeyText}>SIGN WITH PASSKEY</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social login buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Text style={styles.socialApple}></Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Text style={styles.socialFacebook}>f</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <Text style={styles.socialGoogle}>G</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to SUBS? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Get Started →</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.legalRow}>
              <TouchableOpacity><Text style={styles.legalLink}>Help</Text></TouchableOpacity>
              <Text style={styles.legalDot}>  ·  </Text>
              <TouchableOpacity><Text style={styles.legalLink}>Privacy</Text></TouchableOpacity>
              <Text style={styles.legalDot}>  ·  </Text>
              <TouchableOpacity><Text style={styles.legalLink}>Terms</Text></TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotPassword} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#C84A00', '#3B1200', '#0D0500']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowForgotPassword(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            <TextInput
              style={styles.input}
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              placeholder="Enter your email"
              placeholderTextColor="#7a7a7a"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {forgotPasswordMessage ? (
              <View style={[styles.errorBox, forgotPasswordMessage.includes('sent') && styles.successBox]}>
                <Text style={[styles.errorText, forgotPasswordMessage.includes('sent') && styles.successText]}>
                  {forgotPasswordMessage}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.emailButton, forgotPasswordLoading && { opacity: 0.7 }]}
              onPress={handleForgotPassword}
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.emailButtonText}>SEND RESET LINK</Text>}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Card
  card: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    overflow: 'hidden',
  },

  // Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  brandName: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },

  // Headings
  heading: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subheading: {
    color: '#a0a0a0',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  successText: {
    color: '#34d399',
    fontFamily: 'Inter_400Regular',
  },

  // Inputs
  input: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#ffffff',
    marginBottom: 12,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 12,
    justifyContent: 'center',
  },

  // Forgot
  forgotLink: {
    color: '#ff6600',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
    marginBottom: 20,
  },

  // Email button
  emailButton: {
    backgroundColor: '#ff6600',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#ff4400',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },

  // Passkey button
  passkeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  passkeyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  passkeyText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    color: '#7a7a7a',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialApple: {
    fontSize: 20,
    color: '#000000',
    lineHeight: 22,
  },
  socialFacebook: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#1877F2',
    lineHeight: 22,
  },
  socialGoogle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#EA4335',
    lineHeight: 22,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerText: {
    color: '#a0a0a0',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  footerLink: {
    color: '#ff6600',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLink: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  legalDot: {
    color: '#444',
    fontSize: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    color: '#a0a0a0',
    fontSize: 28,
    lineHeight: 28,
  },
  modalDescription: {
    color: '#a0a0a0',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
});
