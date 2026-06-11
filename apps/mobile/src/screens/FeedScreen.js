import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import FeedCard from '../components/FeedCard';
import CommentModal from '../components/CommentModal';
import { fetchPlants } from '../api/plantsApi';
import { getActiveUser } from '../utils/storage';

const PAGE_SIZE = 20;

export default function FeedScreen({ navigation }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [commentModal, setCommentModal] = useState({ visible: false, postId: null, plant: null, onCommentAdded: null });
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const searchRef = useRef('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const user = await getActiveUser();
    setCurrentUser(user);
    pageRef.current = 1;
    hasMoreRef.current = true;
    await loadPlants(1, true);
  };

  const loadPlants = async (page, reset = false) => {
    try {
      const result = await fetchPlants(page, PAGE_SIZE, searchRef.current);
      const sorted = [...result.plants].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setPlants((prev) => (reset ? sorted : [...prev, ...sorted]));
      hasMoreRef.current = result.total > page * PAGE_SIZE;
      pageRef.current = page;
    } catch (e) {
      console.error('Feed load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadPlants(1, true);
  };

  const handleSearch = (text) => {
    setSearch(text);
    searchRef.current = text;
    pageRef.current = 1;
    hasMoreRef.current = true;
    setLoading(true);
    loadPlants(1, true);
  };

  const onEndReached = () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    loadPlants(pageRef.current + 1);
  };

  const openComments = (postId, plant, onCommentAdded) => {
    setCommentModal({ visible: true, postId, plant, onCommentAdded });
  };

  const handleLocationPress = (plant) => {
    if (plant.lat && plant.lng) {
      navigation.navigate('Map', { targetLocation: { id: plant.id, lat: plant.lat, lng: plant.lng } });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Akış yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <FlatList
        data={plants}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={({ item }) => (
          <FeedCard
            plant={item}
            currentUser={currentUser}
            onCommentPress={openComments}
            onLocationPress={handleLocationPress}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.listHeader}>
              <Text style={styles.headerTitle}>Akış</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddObservation')}
              >
                <Text style={styles.addBtnText}>+ Gözlem Ekle</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tür adı ile ara..."
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={handleSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Henüz gözlem yok</Text>
            <Text style={styles.emptySubtitle}>İlk gözlemi ekleyen sen ol!</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddObservation')}
            >
              <Text style={styles.emptyBtnText}>Gözlem Ekle</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={plants.length === 0 ? styles.emptyList : { paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      <CommentModal
        visible={commentModal.visible}
        postId={commentModal.postId}
        plant={commentModal.plant}
        currentUser={currentUser}
        onCommentAdded={commentModal.onCommentAdded}
        onClose={() => setCommentModal({ visible: false, postId: null, plant: null, onCommentAdded: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.background,
  },
  loadingText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: 16,
  },
  headerTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: Colors.white, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    backgroundColor: Colors.surface || '#f5f5f5',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: { paddingLeft: 6 },
  emptyList: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, marginTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: Typography.sizes.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText: { color: Colors.white, fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
});
