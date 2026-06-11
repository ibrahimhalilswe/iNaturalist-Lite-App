import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import StatCard from '../components/StatCard';
import { fetchStats } from '../api/plantsApi';
import { getActiveUser, logoutUser } from '../utils/storage';

export default function HomeScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadStats();
    }, [])
  );

  const loadUser = async () => {
    const u = await getActiveUser();
    setUser(u);
  };

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      // silently fail - show placeholder
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) {
      onLogout();
    } else {
      navigation.replace('Auth');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hoş geldin,</Text>
            <Text style={styles.username}>{user?.username || 'Botanikçi'} {user?.badge}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroEmoji}>🌿</Text>
            <Text style={styles.heroTitle}>Doğayı Keşfet</Text>
            <Text style={styles.heroSubtitle}>
              Çevrenizdeki bitkileri fotoğrafla,{'\n'}AI ile tanımlat ve paylaş.
            </Text>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroDecor}>🌺</Text>
            <Text style={[styles.heroDecor, { fontSize: 28, marginLeft: 8 }]}>🍄</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>İstatistikler</Text>
        {statsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={styles.statsRow}>
              <StatCard
                icon="🌿"
                value={stats?.totalObservations ?? '—'}
                label="Toplam Gözlem"
                color={Colors.primary}
              />
              <StatCard
                icon="🔬"
                value={stats?.uniquePlants ?? '—'}
                label="Keşfedilen Tür"
                color={Colors.accent}
              />
              <StatCard
                icon="👥"
                value={stats?.activeUsers ?? '—'}
                label="Aktif Kullanıcı"
                color="#7c3aed"
              />
            </View>
          </ScrollView>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı Aksiyonlar</Text>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddObservation')}
          activeOpacity={0.85}
        >
          <View style={styles.fabIconWrap}>
            <Ionicons name="camera" size={28} color={Colors.white} />
          </View>
          <View style={styles.fabContent}>
            <Text style={styles.fabTitle}>Yeni Gözlem Ekle</Text>
            <Text style={styles.fabSubtitle}>Fotoğraf çek veya galeriden seç</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.quickEmoji}>🗺️</Text>
            <Text style={styles.quickLabel}>Haritayı{'\n'}Keşfet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Feed')}
          >
            <Text style={styles.quickEmoji}>📰</Text>
            <Text style={styles.quickLabel}>Akışı{'\n'}Görüntüle</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Bilgi</Text>
          <Text style={styles.tipText}>
            En iyi sonuç için çiçek ya da yaprağa yakından çekim yapın.
            Parlak ışık altında fotoğraf çekmek AI tanımlama doğruluğunu artırır.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingTop: 56, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  username: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundAlt,
  },
  heroBanner: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  heroLeft: { flex: 1 },
  heroEmoji: { fontSize: 32, marginBottom: 8 },
  heroTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.heavy,
    color: Colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  heroRight: { flexDirection: 'row', alignItems: 'center' },
  heroDecor: { fontSize: 36, opacity: 0.7 },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    marginBottom: 12,
    marginTop: 4,
  },
  statsScroll: { marginBottom: Spacing.lg },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  fab: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    ...Shadows.md,
  },
  fabIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContent: { flex: 1 },
  fabTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  fabSubtitle: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  quickRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    gap: 12,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 18,
    alignItems: 'center',
    ...Shadows.sm,
  },
  quickEmoji: { fontSize: 28, marginBottom: 8 },
  quickLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  tipCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: `${Colors.accent}12`,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  tipTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    marginBottom: 4,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
