import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPublicProfile, fetchPublicPlants } from '../api/plantsApi';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import FeedCard from '../components/FeedCard';
import { timeAgo } from '../utils/date';

export default function PublicProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const [profile, setProfile] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [username]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [profData, plantsData] = await Promise.all([
        fetchPublicProfile(username),
        fetchPublicPlants(username)
      ]);
      setProfile(profData);
      setPlants(plantsData);
    } catch (e) {
      setError('Kullanıcı bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => {
    if (loading) return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (!profile) return null;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.avatarContainer}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarBadge}>{profile.badge || '🌱'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.joinDate}>Katılım: {timeAgo(profile.createdAt)}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.totalObservations}</Text>
            <Text style={styles.statLabel}>Gözlem</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.discoveredSpecies}</Text>
            <Text style={styles.statLabel}>Farklı Tür</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{username}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <FlatList
        data={plants}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        renderItem={({ item }) => (
          <FeedCard 
            plant={item} 
            currentUser={null} // null to disable actions if not logged in (actually handles inside FeedCard)
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  appBarTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    fontSize: 40,
  },
  username: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  statNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.heavy,
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  errorText: {
    textAlign: 'center',
    color: Colors.error,
    marginTop: Spacing.xl,
  }
});
