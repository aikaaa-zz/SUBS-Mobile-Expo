import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, RefreshCw, Menu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationAPI } from '../services/api';
import { storage } from '../utils/storage';
import { Colors, FontSize, FontWeight } from '../constants/theme';

type HeaderProps = {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  onRefresh?: () => Promise<void> | void;
};

const Header: React.FC<HeaderProps> = ({ title, showBack = false, onMenuClick, onRefresh }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const userId = await storage.getUserId();
      if (userId) {
        const response = await notificationAPI.getUserNotifications(userId, true);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <LinearGradient
      colors={['#2a0800', '#7a2200', '#CC4400', '#FF5F1F']}
      locations={[0, 0.3, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 8 }]}
    >
      {showBack ? (
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <View style={styles.circleBtn}>
            <ArrowLeft size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/subsicon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={styles.rightActions}>
        {onRefresh && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <View style={styles.circleBtn}>
              <RefreshCw size={18} color={isRefreshing ? 'rgba(255,255,255,0.5)' : '#fff'} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/notifications')}
        >
          <View style={styles.circleBtn}>
            <Bell size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {onMenuClick && (
          <TouchableOpacity style={styles.headerButton} onPress={onMenuClick}>
            <View style={styles.circleBtn}>
              <Menu size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 999,
  },
  headerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 24,
    height: 24,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.errorRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
});

export default Header;
