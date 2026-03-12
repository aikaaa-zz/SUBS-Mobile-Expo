import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell, Compass, Calendar, Bookmark, Heart,
  MapPin, Clock, Star, AlertCircle, Globe, Building2, Dumbbell, Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/LoadingSpinner';
import { websiteAPI } from '../../services/api';
import { storage } from '../../utils/storage';
import { useAuth } from '../../hooks/useAuth';

const ORANGE = '#ff6600';

const CATEGORIES = [
  { key: 'All',      label: 'All',      Icon: Compass    },
  { key: 'Dental',   label: 'Dental',   Icon: Star       },
  { key: 'Travel',   label: 'Travel',   Icon: Globe      },
  { key: 'Hotel',    label: 'Hotels',   Icon: Building2  },
  { key: 'Fitness',  label: 'Fitness',  Icon: Dumbbell   },
  { key: 'Beauty',   label: 'Beauty',   Icon: Sparkles   },
];

/* ── Inline S logo ──────────────────────────────────────── */
function SLogo() {
  return (
    <View style={styles.sLogo}>
      <Text style={styles.sLogoText}>S</Text>
    </View>
  );
}

/* ── Star row ───────────────────────────────────────────── */
function StarRow({ rating = 4 }: { rating?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={13}
          color={ORANGE}
          fill={i <= rating ? ORANGE : 'none'}
        />
      ))}
      <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

/* ── Recommended card ───────────────────────────────────── */
function RecCard({ business, onPress }: { business: any; onPress: () => void }) {
  const [fav, setFav] = useState(false);
  return (
    <TouchableOpacity style={styles.recCard} onPress={onPress} activeOpacity={0.88}>
      {/* Image placeholder */}
      <View style={styles.recCardImg}>
        <LinearGradient
          colors={['#d8d0c8', '#c0b8ae', '#a8a099']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Simulated sofa / furniture */}
        <View style={styles.sofa} />
        <View style={styles.sofaBack} />
        <View style={styles.imgOverlay} />
        <TouchableOpacity
          style={styles.recFavBtn}
          onPress={() => setFav(v => !v)}
          activeOpacity={0.8}
        >
          <Heart size={14} color="#fff" fill={fav ? '#fff' : 'none'} />
        </TouchableOpacity>
        <Text style={styles.watermark}>dentini</Text>
      </View>

      {/* Card body */}
      <View style={styles.recCardBody}>
        <Text style={styles.recCardName} numberOfLines={1}>
          {business.name || 'Business Name'}
        </Text>
        <View style={styles.recMeta}>
          <View style={styles.recMetaItem}>
            <Clock size={10} color="#ef4444" />
            <Text style={styles.recMetaText}>
              {business.businessData?.hours || 'Available on Weekdays'}
            </Text>
          </View>
          <View style={styles.recMetaItem}>
            <MapPin size={10} color={ORANGE} />
            <Text style={styles.recMetaText}>
              {business.businessData?.address || business.businessData?.location || 'Santolan, Pasig'}
            </Text>
          </View>
        </View>
        <View style={styles.recCardFooter}>
          <StarRow rating={4} />
          <TouchableOpacity style={styles.bookBtn} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.bookBtnText}>BOOK NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ── Business list card ──────────────────────────────────── */
function BizCard({ business, onPress }: { business: any; onPress: () => void }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={styles.bizCard}>
      <View style={styles.bizCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bizTag}>
            {(business.templateCategory || 'BUSINESS').toUpperCase()}
          </Text>
          <Text style={styles.bizName} numberOfLines={1}>
            {business.name?.toUpperCase() || 'BUSINESS'}
          </Text>
          <Text style={styles.bizDesc} numberOfLines={1}>
            {business.businessData?.description || 'Professional services at your fingertips'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setLiked(v => !v)} style={styles.heartBtn}>
          <Heart size={20} color={ORANGE} fill={liked ? ORANGE : 'none'} />
        </TouchableOpacity>
      </View>
      <View style={styles.bizCardFooter}>
        <TouchableOpacity style={styles.viewDetailsBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════ */
export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!session?.userId) return;
    try {
      setError('');
      const res = await websiteAPI.getPublicWebsites();
      const all = res.websites || res.data || res || [];
      const shuffled = [...all].sort(() => 0.5 - Math.random());
      setRecommended(shuffled.slice(0, 6));
      setBusinesses(all);

      try {
        const userId = await storage.getUserId();
        if (userId) {
          const { notificationAPI } = await import('../../services/api');
          const n = await notificationAPI.getUserNotifications(userId, true);
          setUnreadCount(n.unreadCount || 0);
        }
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filtered = activeCategory === 'All'
    ? businesses
    : businesses.filter(b =>
        b.templateCategory?.toLowerCase() === activeCategory.toLowerCase()
      );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
        }
      >
        {/* ── GRADIENT HEADER ── */}
        <LinearGradient
          colors={['#5c1a00', '#a03600', '#d95000', '#ff6e00', '#2a0e00']}
          locations={[0, 0.25, 0.50, 0.70, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            {/* S Logo */}
            <View style={styles.logoCircle}>
              <SLogo />
            </View>

            {/* Greeting */}
            <View style={{ flex: 1 }}>
              <Text style={styles.greetTop}>
                Welcome to <Text style={styles.greetBrand}>SUBS,</Text>
              </Text>
              <Text style={styles.greetName}>
                {session?.firstName} {session?.lastName}!
              </Text>
            </View>

            {/* Bell */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.8}
            >
              <Bell size={19} color="#fff" />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Quick action cards */}
          <View style={styles.quickActions}>
            {[
              { icon: <Compass size={22} color={ORANGE} />,  label: 'Explore',   route: '/(tabs)/explore'   },
              { icon: <Calendar size={22} color={ORANGE} />, label: 'Bookings',  route: '/(tabs)/bookings'  },
              { icon: <Bookmark size={22} color={ORANGE} />, label: 'Favorites', route: '/(tabs)/favorites' },
            ].map(({ icon, label, route }) => (
              <TouchableOpacity
                key={label}
                style={styles.actionCard}
                onPress={() => router.push(route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconBox}>{icon}</View>
                <Text style={styles.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* ── RECOMMENDED FOR YOU ── */}
        <LinearGradient
          colors={['#c84200', '#f5f5f5']}
          locations={[0, 0.55]}
          style={styles.recommendedSection}
        >
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitleWhite}>Recommended For You</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.viewAllWhite}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              decelerationRate="fast"
              snapToInterval={278}
            >
              {/* Left peek ghost */}
              <View style={[styles.recCard, styles.peekCard]}>
                <LinearGradient colors={['#2a1000', '#1a0800']} style={{ flex: 1, borderRadius: 18 }} />
              </View>

              {recommended.map(biz => (
                <RecCard
                  key={biz._id}
                  business={biz}
                  onPress={() => router.push(`/business/${biz.slug}`)}
                />
              ))}

              {/* Right peek ghost */}
              <View style={[styles.recCard, styles.peekCard]}>
                <LinearGradient colors={['#1a0800', '#2a1000']} style={{ flex: 1, borderRadius: 18 }} />
              </View>
            </ScrollView>
          )}
        </LinearGradient>

        {/* ── WHITE CONTENT ── */}
        <View style={styles.whiteContent}>

          {/* Choose by Category */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitleDark}>Choose by Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map(({ key, label, Icon }) => {
                const isActive = activeCategory === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setActiveCategory(key)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      size={15}
                      color={isActive ? '#fff' : '#cc5500'}
                    />
                    <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Other Businesses */}
          <View style={styles.bizSection}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitleDark}>Other Businesses</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.viewAllOrange}>View All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <LoadingSpinner />
            ) : filtered.length > 0 ? (
              filtered.map(biz => (
                <BizCard
                  key={biz._id}
                  business={biz}
                  onPress={() => router.push(`/business/${biz.slug}`)}
                />
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No businesses found</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoCircle: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sLogo: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,102,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sLogoText: {
    color: ORANGE,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  greetTop: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  greetBrand: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  greetName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginTop: 1,
  },
  bellBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 6, right: 7,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#c84200',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { flex: 1, color: '#fff', fontSize: 12, fontFamily: 'Inter_400Regular' },
  retryText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold', textDecorationLine: 'underline' },

  /* Quick actions */
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  actionIconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: '#fff5f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },

  /* ── Recommended ── */
  recommendedSection: {
    paddingTop: 20,
    paddingBottom: 0,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleWhite: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  viewAllWhite: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.88)',
  },
  carouselContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  recCard: {
    width: 262,
    backgroundColor: '#111111',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  peekCard: {
    width: 130,
    opacity: 0.45,
    height: 220,
  },
  recCardImg: {
    height: 155,
    position: 'relative',
    overflow: 'hidden',
  },
  sofa: {
    position: 'absolute',
    bottom: 18, left: 18,
    width: 120, height: 32,
    backgroundColor: 'rgba(248,243,234,0.88)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sofaBack: {
    position: 'absolute',
    bottom: 32, left: 20,
    width: 116, height: 20,
    backgroundColor: 'rgba(252,248,240,0.82)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  imgOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 40,
    backgroundColor: 'transparent',
  },
  recFavBtn: {
    position: 'absolute',
    top: 10, right: 10,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    position: 'absolute',
    bottom: 8, right: 10,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
  },
  recCardBody: {
    padding: 14,
  },
  recCardName: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  recMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  recMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recMetaText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#a0a0a0',
  },
  recCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNum: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginLeft: 3,
  },
  bookBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 50,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },

  /* ── White content ── */
  whiteContent: {
    backgroundColor: '#f5f5f5',
  },
  categorySection: {
    backgroundColor: '#ffffff',
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 8,
  },
  sectionTitleDark: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#111111',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: '#fff0e8',
  },
  catPillActive: {
    backgroundColor: ORANGE,
  },
  catPillText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#cc5500',
  },
  catPillTextActive: {
    color: '#ffffff',
  },

  /* Other Businesses */
  bizSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  viewAllOrange: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: ORANGE,
  },
  bizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bizCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bizTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: ORANGE,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  bizName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#111111',
    marginBottom: 3,
  },
  bizDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#888888',
  },
  heartBtn: {
    marginLeft: 8,
    padding: 2,
  },
  bizCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  viewDetailsBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#888',
    textAlign: 'center',
  },
});
