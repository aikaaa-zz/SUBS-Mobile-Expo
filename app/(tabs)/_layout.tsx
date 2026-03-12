import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { TabActions } from '@react-navigation/native';
import { Home, Search, Calendar, Heart, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../hooks/useAuth';

const ORANGE  = '#FF5F1F';
const BAR_H   = 62;   // black bar height
const FLOAT   = 24;   // how far the active circle rises above the bar
const CIRCLE  = 46;   // diameter of the active icon circle
const TOTAL_H = BAR_H + FLOAT;

const TABS = [
  { name: 'home',      Icon: Home,     label: 'Home'      },
  { name: 'bookings',  Icon: Calendar, label: 'Bookings'  },
  { name: 'explore',   Icon: Search,   label: 'Search'    },
  { name: 'favorites', Icon: Heart,    label: 'Favorites' },
  { name: 'profile',   Icon: User,     label: 'Profile'   },
];

/* ─────────────────────────────────────────────
   Custom Tab Bar
───────────────────────────────────────────── */
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabW = width / TABS.length;

  const activeIdx = TABS.findIndex(
    (t) => t.name === state.routes[state.index]?.name,
  );
  const activeTab = TABS[activeIdx];

  const navigate = (name: string) =>
    navigation.dispatch(TabActions.jumpTo(name));

  // Floating icon horizontal center
  const fabLeft = activeIdx * tabW + tabW / 2 - CIRCLE / 2;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>

      {/* ── Layer 1: black bar (only the bottom BAR_H) ── */}
      <View style={styles.barBg} />

      {/* ── Layer 2: notch circle behind the floating icon ── */}
      <View
        style={[
          styles.notch,
          { left: activeIdx * tabW + tabW / 2 - (CIRCLE + 14) / 2 },
        ]}
      />

      {/* ── Layer 3: tab items row ── */}
      <View style={styles.row}>
        {TABS.map(({ name, Icon, label }) => {
          const rIdx     = state.routes.findIndex((r) => r.name === name);
          const isActive = state.index === rIdx;

          return (
            <TouchableOpacity
              key={name}
              style={styles.tabItem}
              onPress={() => navigate(name)}
              activeOpacity={0.7}
            >
              {/* Icon slot — invisible on active tab (replaced by floating circle) */}
              <View style={[styles.iconSlot, isActive && styles.iconSlotHidden]}>
                <Icon size={21} color="#777" />
              </View>

              <Text style={[styles.label, isActive && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Layer 4: floating active icon (renders on top, unclipped) ── */}
      {activeTab && (
        <TouchableOpacity
          style={[styles.fab, { left: fabLeft }]}
          onPress={() => navigate(activeTab.name)}
          activeOpacity={0.85}
        >
          <activeTab.Icon size={22} color="#fff" />
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  /* Outer container — transparent so shadow bleeds freely above */
  root: {
    height: TOTAL_H,
    backgroundColor: 'transparent',
  },

  /* Black bar — sits at the bottom, exactly BAR_H tall */
  barBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_H,
    backgroundColor: '#111',
  },

  /* Notch — slightly lighter circle, centered on active tab */
  notch: {
    position: 'absolute',
    top: 0,
    width:  CIRCLE + 14,
    height: CIRCLE + 14,
    borderRadius: (CIRCLE + 14) / 2,
    backgroundColor: '#1c1c1c',
  },

  /* Tab items row — full TOTAL_H, aligned to bar bottom */
  row: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: BAR_H,
  },

  iconSlot: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSlotHidden: {
    opacity: 0,   // hidden — floating fab renders here instead
  },

  label: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#777',
    textAlign: 'center',
  },
  labelActive: {
    color: ORANGE,
    fontFamily: 'Inter_700Bold',
  },

  /* Floating active icon — absolutely positioned over everything */
  fab: {
    position: 'absolute',
    top: 0,                       // top of the TOTAL_H container = FLOAT above bar
    width:  CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow — not clipped because root has no overflow:hidden
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
});

/* ─────────────────────────────────────────────
   Layout
───────────────────────────────────────────── */
export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/welcome" />;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
