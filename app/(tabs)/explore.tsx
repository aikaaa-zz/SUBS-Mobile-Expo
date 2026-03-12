import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl, ScrollView, ImageBackground,
  Image, StatusBar, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Heart, Bell, ChevronLeft, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/LoadingSpinner';
import { websiteAPI } from '../../services/api';
import { storage } from '../../utils/storage';

const ORANGE = '#FF5F1F';
const CATEGORIES = ['All', 'Dental', 'Hotel', 'Travel', 'Beach', 'Beauty', 'Fitness'];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<any[]>([]);

  const loadBusinesses = useCallback(async () => {
    try {
      setError('');
      const response = await websiteAPI.getPublicWebsites();
      const websites = response.websites || response.data || response || [];
      setBusinesses(websites);
    } catch (err: any) {
      setError(err.message || 'Failed to load businesses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    const favs = await storage.getFavorites();
    setFavorites(favs);
  }, []);

  useEffect(() => { loadBusinesses(); loadFavorites(); }, [loadBusinesses, loadFavorites]);

  useEffect(() => {
    let filtered = [...businesses];
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(b =>
        b.templateCategory?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.templateCategory?.toLowerCase().includes(q) ||
        b.businessData?.description?.toLowerCase().includes(q)
      );
    }
    setFilteredBusinesses(filtered);
  }, [searchQuery, selectedCategory, businesses]);

  const isFavorite = (id: string) => favorites.some(f => f._id === id);

  const toggleFavorite = async (business: any) => {
    const updated = isFavorite(business._id)
      ? favorites.filter(f => f._id !== business._id)
      : [...favorites, business];
    setFavorites(updated);
    await storage.setFavorites(updated);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses();
    await loadFavorites();
  };

  const renderBusiness = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTag}>
            {(item.templateCategory || 'DENTAL').toUpperCase()}
          </Text>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name?.toUpperCase() || 'BUSINESS NAME'}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.businessData?.description || 'Professional services at your fingertips'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item)}
          style={styles.heartBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={20}
            color={ORANGE}
            fill={isFavorite(item._id) ? ORANGE : 'none'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => router.push(`/business/${item.slug}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <ImageBackground
        source={require('../../assets/images/bg_org.png')}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        resizeMode="cover"
      >
        {/* Left-to-right: dark on left, transparent right to show orange */}
        <LinearGradient
          colors={['rgba(10,3,0,0.80)', 'rgba(20,6,0,0.40)', 'rgba(0,0,0,0.0)']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Bottom fade */}
        <LinearGradient
          colors={['transparent', 'rgba(8,2,0,0.50)']}
          locations={[0.4, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topBar}>
          {/* Back */}
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>

          {/* S Logo */}
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/subsicon.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>

          {/* Bell */}
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}
          >
            <Bell size={19} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* ── WHITE CONTENT CARD ── */}
      <View style={styles.contentCard}>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={17} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={15} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Results count */}
        <Text style={styles.resultsText}>
          {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
        </Text>

        {/* Business List */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={filteredBusinesses}
            keyExtractor={item => item._id}
            renderItem={renderBusiness}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'two-col' : 'one-col'}
            columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
            contentContainerStyle={[styles.listContent, isTablet && { paddingHorizontal: 16 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Search size={40} color="#ddd" />
                <Text style={styles.emptyText}>No businesses found</Text>
                <Text style={styles.emptySubText}>Try adjusting your search or filters</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },

  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 44,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImg: {
    width: 28,
    height: 28,
  },

  /* ── White card ── */
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 20,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1a1a1a',
    padding: 0,
  },

  /* Categories */
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
    marginBottom: 4,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  catPillActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  catPillText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#555',
  },
  catPillTextActive: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  retryText: {
    color: ORANGE,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Results */
  resultsText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 6,
  },

  /* List */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },

  /* Business card */
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: ORANGE,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#111',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#888',
  },
  heartBtn: {
    marginLeft: 8,
    paddingTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewDetailsBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 9,
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#888',
  },
  emptySubText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#bbb',
  },
});
