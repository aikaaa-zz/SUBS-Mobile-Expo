import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  RefreshControl, StatusBar, ImageBackground, Image, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell, Compass, Calendar, Bookmark, Heart,
  MapPin, Clock, Star, AlertCircle,
  Stethoscope, Plane, Building2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/LoadingSpinner';
import { websiteAPI } from '../../services/api';
import { storage } from '../../utils/storage';
import { useAuth } from '../../hooks/useAuth';

const ORANGE = '#FF5F1F';
const ORANGE_LIGHT = '#FF5F1F';

const CATEGORIES = [
  { key: 'Dental',  label: 'Dental',  Icon: Stethoscope },
  { key: 'Travel',  label: 'Travel',  Icon: Plane       },
  { key: 'Hotel',   label: 'Hotels',  Icon: Building2   },
];

/* ── Star row ───────────────────────────────────────────── */
function StarRow({ rating = 4 }: { rating?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={13}
          color={ORANGE_LIGHT}
          fill={i <= rating ? ORANGE_LIGHT : 'none'}
        />
      ))}
      <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );
}

/* ── Featured recommended card ──────────────────────────── */
function RecCard({ business, onPress }: { business: any; onPress: () => void }) {
  const [fav, setFav] = useState(false);
  const imageUri = business.businessData?.logo || business.businessData?.coverImage;

  const cardOverlay = (
    <>
      {/* Dark gradient overlay — bottom half */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.82)']}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Heart button — orange circle */}
      <TouchableOpacity
        style={styles.recFavBtn}
        onPress={() => setFav(v => !v)}
        activeOpacity={0.8}
      >
        <Heart size={16} color="#fff" fill={fav ? '#fff' : 'none'} />
      </TouchableOpacity>

      {/* Card body overlaid on image */}
      <View style={styles.recCardBody}>
        <Text style={styles.recCardName} numberOfLines={1}>
          {business.name || 'Santolan Dental Clinic'}
        </Text>
        <View style={styles.recMeta}>
          <View style={styles.recMetaItem}>
            <Clock size={11} color="#ef4444" />
            <Text style={styles.recMetaText}>
              {business.businessData?.hours || 'Available on Weekdays'}
            </Text>
          </View>
          <View style={styles.recMetaItem}>
            <MapPin size={11} color={ORANGE_LIGHT} />
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
    </>
  );

  if (imageUri) {
    return (
      <TouchableOpacity style={styles.recCard} onPress={onPress} activeOpacity={0.9}>
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.recCardImg}
          imageStyle={{ borderRadius: 18 }}
          resizeMode="cover"
        >
          {cardOverlay}
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  /* ── Fallback: dental clinic simulation ── */
  return (
    <TouchableOpacity style={styles.recCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.recCardImg}>
        {/* Warm beige base */}
        <LinearGradient
          colors={['#ddd4c8', '#c8bdb0', '#b8aba0']}
          start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Arch / curved wall element */}
        <View style={styles.archDecor} />
        {/* Ambient light spot */}
        <View style={styles.lightSpot} />
        {/* Counter/shelf */}
        <View style={styles.shelf} />
        {/* Sofa back */}
        <View style={styles.sofaBack} />
        {/* Sofa seat */}
        <View style={styles.sofa} />
        {/* Brand watermark */}
        <Text style={styles.watermark}>dentini</Text>
        {cardOverlay}
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
            {(business.templateCategory || 'DENTAL').toUpperCase()}
          </Text>
          <Text style={styles.bizName} numberOfLines={1}>
            {business.name?.toUpperCase() || 'KAYE DENTAL'}
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
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth * 0.76, 300);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Dental');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!session?.userId) return;
    try {
      setError('');
      const res = await websiteAPI.getPublicWebsites();
      const all = res.websites || res.data || res || [];
      const shuffled = [...all].sort(() => 0.5 - Math.random());
      setRecommended(shuffled.slice(0, 5));
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

  const filtered = businesses.filter(b =>
    b.templateCategory?.toLowerCase() === activeCategory.toLowerCase()
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE_LIGHT} />
        }
      >
        {/* ── HEADER with bg_org.png ── */}
        <ImageBackground
          source={require('../../assets/images/bg_org.png')}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
          resizeMode="cover"
        >
          {/* Left-to-right overlay: dark left (text legible) → transparent right (orange shows) */}
          <LinearGradient
            colors={['rgba(10,3,0,0.78)', 'rgba(20,6,0,0.42)', 'rgba(0,0,0,0.0)']}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom fade so cards transition cleanly */}
          <LinearGradient
            colors={['transparent', 'rgba(8,2,0,0.55)']}
            locations={[0.5, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar: logo | greeting | bell */}
          <View style={styles.topBar}>
            {/* S Logo */}
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/subsicon.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>

            {/* Greeting */}
            <View style={styles.greetWrap}>
              <Text style={styles.greetTop}>
                Welcome to <Text style={styles.greetBrand}>SUBS,</Text>
              </Text>
              <Text style={styles.greetName} numberOfLines={1}>
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
              <AlertCircle size={15} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Quick Action Cards */}
          <View style={styles.quickActions}>
            {[
              { icon: <Compass size={24} color={ORANGE} />,  label: 'Explore',   route: '/(tabs)/explore'   },
              { icon: <Calendar size={24} color={ORANGE} />, label: 'Bookings',  route: '/(tabs)/bookings'  },
              { icon: <Bookmark size={24} color={ORANGE} />, label: 'Favorites', route: '/(tabs)/favorites' },
            ].map(({ icon, label, route }) => (
              <TouchableOpacity
                key={label}
                style={styles.actionCard}
                onPress={() => router.push(route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconCircle}>{icon}</View>
                <Text style={styles.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ImageBackground>

        {/* ── RECOMMENDED FOR YOU ── */}
        <View style={styles.recommendedSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitleDark}>Recommended For You</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.viewAllOrange}>View All</Text>
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
              snapToInterval={cardWidth + 14}
              snapToAlignment="start"
            >
              {recommended.length > 0 ? recommended.map(biz => (
                <RecCard
                  key={biz._id}
                  business={biz}
                  onPress={() => router.push(`/business/${biz.slug}`)}
                />
              )) : (
                <RecCard
                  business={{ name: 'Santolan Dental Clinic' }}
                  onPress={() => {}}
                />
              )}
            </ScrollView>
          )}
        </View>

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
                    <View style={[styles.catIconCircle, isActive && styles.catIconCircleActive]}>
                      <Icon size={14} color={isActive ? '#fff' : ORANGE} />
                    </View>
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
              /* Demo card when no data */
              <BizCard
                business={{
                  templateCategory: 'dental',
                  name: 'Kaye Dental',
                  businessData: { description: 'Professional services at your fingertips' },
                }}
                onPress={() => {}}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoImg: {
    width: 28,
    height: 28,
  },
  greetWrap: {
    flex: 1,
  },
  greetTop: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  greetBrand: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  greetName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,150,50,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bellDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#6b1a00',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },

  /* Quick actions */
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },

  /* ── Recommended ── */
  recommendedSection: {
    backgroundColor: '#fff',
    paddingTop: 18,
    paddingBottom: 6,
    marginBottom: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  viewAllOrange: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: ORANGE,
  },
  carouselContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  recCard: {
    width: 284,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  recCardImg: {
    height: 220,
    justifyContent: 'flex-end',
    borderRadius: 18,
    overflow: 'hidden',
  },
  recFavBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  /* Dental clinic interior decor */
  archDecor: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 180,
    height: 200,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  lightSpot: {
    position: 'absolute',
    top: 10,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,248,235,0.28)',
  },
  shelf: {
    position: 'absolute',
    bottom: 64,
    right: 0,
    width: 100,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderTopLeftRadius: 4,
  },
  sofaBack: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    width: 130,
    height: 22,
    backgroundColor: 'rgba(245,240,232,0.85)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sofa: {
    position: 'absolute',
    bottom: 18,
    left: 14,
    width: 134,
    height: 20,
    backgroundColor: 'rgba(252,248,242,0.9)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  watermark: {
    position: 'absolute',
    bottom: 72,
    right: 12,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(100,80,60,0.4)',
    fontStyle: 'italic',
  },
  recCardBody: {
    padding: 14,
  },
  recCardName: {
    color: '#ffffff',
    fontSize: 16,
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
    gap: 4,
  },
  recMetaText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.82)',
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
    marginLeft: 4,
  },
  bookBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 50,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
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
    paddingBottom: 16,
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
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: '#fff0e8',
    borderWidth: 1,
    borderColor: 'rgba(230,81,0,0.15)',
  },
  catPillActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  catIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(230,81,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catIconCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  catPillText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: ORANGE,
  },
  catPillTextActive: {
    color: '#ffffff',
  },

  /* Other Businesses */
  bizSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  bizCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
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
    marginBottom: 4,
  },
  bizName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#111111',
    marginBottom: 4,
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
    marginTop: 14,
  },
  viewDetailsBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 9,
  },
  viewDetailsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
