import { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export default function Welcome() {
  const logoDropY = useSharedValue(-500);
  const logoOpacity = useSharedValue(0);
  const logoFlip = useSharedValue(180);
  const contentTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Step 1: Drop from top to center with bounce at landing
    logoOpacity.value = withTiming(1, { duration: 200 });
    logoDropY.value = withSpring(0, {
      damping: 7,
      stiffness: 100,
      mass: 0.9,
    });

    // Step 2: Flip horizontally after landing
    logoFlip.value = withDelay(
      650,
      withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) })
    );

    // Step 3: Text & buttons fade + slide up after flip
    contentOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) })
    );
    contentTranslateY.value = withDelay(
      1200,
      withTiming(0, { duration: 650, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoDropY.value },
      { rotateY: `${logoFlip.value}deg` },
    ],
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Diagonal gradient: burnt orange top-left → charcoal black bottom-right */}
      <LinearGradient
        colors={['#CC3800', '#1a1a1a']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Logo centered slightly above middle */}
      <Animated.View style={[styles.logoWrapper, logoAnimStyle]}>
        <Image
          source={require('../assets/images/subsicon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Welcome text + CTA buttons */}
      <Animated.View style={[styles.bottomContent, contentAnimStyle]}>
        <Text style={styles.welcomeText}>WELCOME TO SUBS</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Continue to Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/register')}
          activeOpacity={0.7}
        >
          <Text style={styles.registerText}>
            Don't have an account yet?{' '}
            <Text style={styles.registerLink}>Get Started</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  logo: {
    width: 130,
    height: 130,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: '#ff6600',
    borderRadius: 50,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#ff4400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  registerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  registerLink: {
    color: '#ff6600',
    fontWeight: '600',
  },
});
