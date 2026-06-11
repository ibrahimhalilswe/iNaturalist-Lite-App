import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../constants/theme';
import { fetchLikes, toggleLike } from '../api/plantsApi';
import { timeAgo } from '../utils/date';

export default function FeedCard({ plant, currentUser, onCommentPress, onLocationPress }) {
  const navigation = useNavigation();
  const [likeData, setLikeData] = useState({ count: 0, liked: false });
  const [commentCount, setCommentCount] = useState(plant.commentCount || 0);
  const heartScale = useRef(new Animated.Value(1)).current;
  const lastTap = useRef(null);
  const isLiking = useRef(false);

  useEffect(() => {
    loadLikes();
    return () => { heartScale.stopAnimation(); };
  }, []);

  const loadLikes = async () => {
    if (!plant.id) return;
    const data = await fetchLikes(plant.id);
    setLikeData(data);
  };

  const handleLike = async () => {
    if (isLiking.current) return;
    if (!currentUser) {
      Alert.alert('Giriş Gerekli', 'Beğenmek için giriş yapmalısın.');
      return;
    }
    isLiking.current = true;
    try {
      const updated = await toggleLike(plant.id);
      setLikeData(updated);
      if (updated.liked) animateHeart();
    } catch (e) {
      if (e.message === 'AUTH_REQUIRED') {
        Alert.alert('Giriş Gerekli', 'Beğenmek için giriş yapmalısın.');
      } else {
        Alert.alert('Hata', 'Beğeni işlemi başarısız oldu.');
      }
    } finally {
      isLiking.current = false;
    }
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 30 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!likeData.liked) handleLike();
    }
    lastTap.current = now;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={() => navigation.navigate('PublicProfile', { username: plant.userName || 'Anonim' })}
        >
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeText}>{plant.userBadge || '🌱'}</Text>
          </View>
          <View>
            <Text style={styles.username}>{plant.userName || 'Anonim'}</Text>
            <Text style={styles.timestamp}>{timeAgo(plant.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>🌿 Bitki</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        {plant.photoUrl ? (
          <Image source={{ uri: plant.photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={{ fontSize: 48 }}>🌿</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={likeData.liked ? 'heart' : 'heart-outline'}
                size={26}
                color={likeData.liked ? Colors.error : Colors.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>
          {likeData.count > 0 && (
            <Text style={styles.likeCount}>{likeData.count}</Text>
          )}
          <TouchableOpacity
            onPress={() => onCommentPress?.(plant.id, plant, () => setCommentCount(c => c + 1))}
            style={[styles.actionBtn, { marginLeft: 4 }]}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          {commentCount > 0 && (
            <Text style={styles.commentCount}>{commentCount}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLocationPress?.(plant)}>
          <Ionicons name="location-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.plantName}>{plant.name}</Text>
        {plant.description ? (
          <Text style={styles.description} numberOfLines={2}>{plant.description}</Text>
        ) : null}
        {plant.lat && plant.lng ? (
          <Text style={styles.location}>
            📍 {Number(plant.lat).toFixed(4)}, {Number(plant.lng).toFixed(4)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.md, marginBottom: Spacing.md, overflow: 'hidden', ...Shadows.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.backgroundAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  badgeText: { fontSize: 20 },
  username: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  timestamp: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 1 },
  typeBadge: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: Typography.sizes.xs, color: Colors.primary, fontWeight: Typography.weights.semibold },
  photo: { width: '100%', aspectRatio: 1, backgroundColor: Colors.backgroundAlt },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { padding: 4 },
  likeCount: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginLeft: 2, marginRight: 6 },
  commentCount: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, marginLeft: 2 },
  content: { paddingHorizontal: 14, paddingBottom: 14 },
  plantName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.textPrimary, marginBottom: 3 },
  description: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 19, marginBottom: 6 },
  location: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
});
