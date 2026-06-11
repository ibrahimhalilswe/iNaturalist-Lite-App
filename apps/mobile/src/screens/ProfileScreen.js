import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getActiveUser, logoutUser, getToken } from '../utils/storage';
import { ENDPOINTS, resolvePhotoUrl } from '../constants/api';
import Input from '../components/Input';
import Button from '../components/Button';
import FeedCard from '../components/FeedCard';
import CommentModal from '../components/CommentModal';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - Spacing.xl * 2) / 3;

export default function ProfileScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('my-plants'); // 'my-plants' | 'liked-plants' | 'stats' | 'settings'

  const [myPlants, setMyPlants] = useState([]);
  const [likedPlants, setLikedPlants] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loadingPlants, setLoadingPlants] = useState(false);

  const [selectedPlant, setSelectedPlant] = useState(null);
  const [commentModal, setCommentModal] = useState({ visible: false, postId: null, plant: null });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUser();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    setLoading(true);
    const activeUser = await getActiveUser();
    setUser(activeUser);
    
    if (activeUser) {
      await fetchUserPlants();
    }
    setLoading(false);
  };

  const fetchUserPlants = async () => {
    const token = await getToken();
    if (!token) return;
    setLoadingPlants(true);
    try {
      const [myRes, likedRes, statsRes] = await Promise.all([
        fetch(ENDPOINTS.myPlants, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(ENDPOINTS.likedPlants, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(ENDPOINTS.userStats, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (myRes.ok) setMyPlants(await myRes.json());
      if (likedRes.ok) setLikedPlants(await likedRes.json());
      if (statsRes.ok) setUserStats(await statsRes.json());
    } catch (e) {
      console.log('Error fetching plants:', e);
    } finally {
      setLoadingPlants(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    if (onLogout) {
      onLogout();
    } else {
      Alert.alert('Çıkış', 'Başarıyla çıkış yaptınız. Lütfen uygulamayı yeniden başlatın.', [
        { text: 'Tamam' }
      ]);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni parolalar eşleşmiyor.');
      return;
    }

    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(ENDPOINTS.changePassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Şifre değiştirilemedi.');
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const uniqueSpeciesCount = userStats?.uniqueSpecies
    ?? new Set(myPlants.map(p => p.name?.toLowerCase().trim()).filter(Boolean)).size;
  const totalLikesReceived = userStats?.likesReceived
    ?? myPlants.reduce((sum, p) => sum + (p.likeCount || 0), 0);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!user) {
    return <View style={styles.center}><Text>Lütfen giriş yapın.</Text></View>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{user.badge || '🌱'}</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats?.totalObservations ?? myPlants.length}</Text>
            <Text style={styles.statLabel}>Keşif</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{uniqueSpeciesCount}</Text>
            <Text style={styles.statLabel}>Tür</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalLikesReceived}</Text>
            <Text style={styles.statLabel}>Beğeni</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'my-plants' && styles.tabActive]} onPress={() => setTab('my-plants')}>
          <Ionicons name="grid" size={24} color={tab === 'my-plants' ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'liked-plants' && styles.tabActive]} onPress={() => setTab('liked-plants')}>
          <Ionicons name="heart" size={24} color={tab === 'liked-plants' ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'stats' && styles.tabActive]} onPress={() => setTab('stats')}>
          <Ionicons name="bar-chart" size={24} color={tab === 'stats' ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'settings' && styles.tabActive]} onPress={() => setTab('settings')}>
          <Ionicons name="settings" size={24} color={tab === 'settings' ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'my-plants' && (
          <View style={styles.gridContainer}>
            {loadingPlants ? <ActivityIndicator color={Colors.primary} style={{marginTop: 40}} /> : 
             myPlants.length === 0 ? <Text style={styles.emptyText}>Henüz keşif yapmadınız.</Text> :
             myPlants.map(p => (
               <TouchableOpacity key={p.id} style={styles.gridItem} activeOpacity={0.8} onPress={() => setSelectedPlant(p)}>
                  <Image source={{uri: resolvePhotoUrl(p.photoUrl)}} style={styles.gridImage} />
               </TouchableOpacity>
             ))
            }
          </View>
        )}
        {tab === 'liked-plants' && (
          <View style={styles.gridContainer}>
            {loadingPlants ? <ActivityIndicator color={Colors.primary} style={{marginTop: 40}} /> : 
             likedPlants.length === 0 ? <Text style={styles.emptyText}>Henüz keşif beğenmediniz.</Text> :
             likedPlants.map(p => (
               <TouchableOpacity key={p.id} style={styles.gridItem} activeOpacity={0.8} onPress={() => setSelectedPlant(p)}>
                  <Image source={{uri: resolvePhotoUrl(p.photoUrl)}} style={styles.gridImage} />
               </TouchableOpacity>
             ))
            }
          </View>
        )}
        {tab === 'stats' && (
          <View style={{ paddingTop: 16 }}>
            {loadingPlants ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardEmoji}>🌿</Text>
                    <Text style={styles.statCardValue}>{userStats?.totalObservations ?? myPlants.length}</Text>
                    <Text style={styles.statCardLabel}>Toplam Gözlem</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardEmoji}>🔬</Text>
                    <Text style={styles.statCardValue}>{uniqueSpeciesCount}</Text>
                    <Text style={styles.statCardLabel}>Farklı Tür</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardEmoji}>❤️</Text>
                    <Text style={styles.statCardValue}>{totalLikesReceived}</Text>
                    <Text style={styles.statCardLabel}>Alınan Beğeni</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardEmoji}>👍</Text>
                    <Text style={styles.statCardValue}>{userStats?.likesGiven ?? 0}</Text>
                    <Text style={styles.statCardLabel}>Verilen Beğeni</Text>
                  </View>
                </View>
                <View style={[styles.card, { marginTop: 12 }]}>
                  <Text style={styles.cardTitle}>Bu Ay</Text>
                  <View style={styles.monthStatRow}>
                    <Text style={styles.monthStatValue}>{userStats?.observationsThisMonth ?? 0}</Text>
                    <Text style={styles.monthStatLabel}>gözlem eklendi</Text>
                  </View>
                  {(userStats?.observationsThisMonth ?? 0) > 0 && (
                    <Text style={styles.monthStatBadge}>
                      {userStats.observationsThisMonth >= 10 ? '🏆 Aktif Gözlemci' :
                       userStats.observationsThisMonth >= 5 ? '⭐ İyi Gidiyor' : '🌱 Başlangıç'}
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        )}
        {tab === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Şifre Değiştir</Text>
            <Input label="Mevcut Parola" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
            <Input label="Yeni Parola" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Input label="Yeni Parola (Tekrar)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <Button title="Şifreyi Güncelle" onPress={handleChangePassword} loading={actionLoading} style={{ marginTop: 12 }} />
            
            <View style={styles.divider} />
            <Button title="Çıkış Yap" onPress={handleLogout} variant="outline" style={{ marginTop: 12, borderColor: Colors.error }} textStyle={{ color: Colors.error }} />
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedPlant} animationType="slide" transparent={true} onRequestClose={() => setSelectedPlant(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={() => setSelectedPlant(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Keşif Detayı</Text>
              <TouchableOpacity onPress={() => setSelectedPlant(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}>
              {selectedPlant && (
                <FeedCard
                  plant={{ ...selectedPlant, photoUrl: resolvePhotoUrl(selectedPlant.photoUrl) }}
                  currentUser={user}
                  onCommentPress={(postId, plant) => setCommentModal({ visible: true, postId, plant })}
                  onLocationPress={(plant) => {
                    setSelectedPlant(null);
                    if (plant.lat && plant.lng) {
                      navigation.navigate('Map', { targetLocation: { id: plant.id, lat: plant.lat, lng: plant.lng } });
                    }
                  }}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CommentModal
        visible={commentModal.visible}
        postId={commentModal.postId}
        plant={commentModal.plant}
        currentUser={user}
        onClose={() => setCommentModal({ visible: false, postId: null, plant: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 16, backgroundColor: Colors.primary, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36 },
  username: { fontSize: Typography.sizes.xl, fontWeight: 'bold', color: Colors.white },
  email: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 40, gap: 32 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  statLabel: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  content: { padding: Spacing.xl, paddingTop: 0 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 2 },
  gridImage: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: Colors.border },
  emptyText: { textAlign: 'center', color: Colors.textMuted, width: '100%', marginTop: 40 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, ...Shadows.sm, marginTop: 16 },
  cardTitle: { fontSize: Typography.sizes.lg, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 16 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCloseArea: { flex: 1 },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  closeButton: { padding: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: 16, alignItems: 'center', gap: 6, ...Shadows.sm,
  },
  statCardEmoji: { fontSize: 28 },
  statCardValue: { fontSize: 26, fontWeight: Typography.weights.heavy, color: Colors.primary },
  statCardLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, textAlign: 'center' },
  monthStatRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginVertical: 8 },
  monthStatValue: { fontSize: 40, fontWeight: Typography.weights.heavy, color: Colors.primary },
  monthStatLabel: { fontSize: Typography.sizes.md, color: Colors.textSecondary },
  monthStatBadge: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 4 },
});
