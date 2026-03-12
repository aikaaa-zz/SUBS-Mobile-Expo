import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { userAPI } from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !firstName || !lastName || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await userAPI.register({
        email, firstName, lastName, password, accountType: 'personal',
      });
      if (response.message || response.user) {
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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

            <Text style={styles.heading}>Create Account</Text>
            <Text style={styles.subheading}>Join Subs today</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* First & Last name row */}
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={firstName}
                onChangeText={(t) => { setFirstName(t); setError(''); }}
                placeholder="First name"
                placeholderTextColor="#7a7a7a"
                autoComplete="given-name"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={lastName}
                onChangeText={(t) => { setLastName(t); setError(''); }}
                placeholder="Last name"
                placeholderTextColor="#7a7a7a"
                autoComplete="family-name"
              />
            </View>

            {/* Email */}
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

            {/* Password */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="Password"
                placeholderTextColor="#7a7a7a"
                secureTextEntry={!showPassword}
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
            <Text style={styles.hint}>Minimum 6 characters</Text>

            {/* Confirm Password */}
            <View style={[styles.passwordWrapper, { marginTop: 12 }]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                placeholder="Confirm password"
                placeholderTextColor="#7a7a7a"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword
                  ? <EyeOff size={18} color="#7a7a7a" />
                  : <Eye size={18} color="#7a7a7a" />}
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitButtonText}>CREATE ACCOUNT</Text>}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign In →</Text>
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

  card: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    overflow: 'hidden',
  },

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

  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },

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
    marginBottom: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hint: {
    color: '#7a7a7a',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 0,
    paddingLeft: 2,
  },

  submitButton: {
    backgroundColor: '#ff6600',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#ff4400',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },

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
});
