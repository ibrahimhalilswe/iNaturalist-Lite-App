import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../constants/theme';
import { fetchComments, postComment } from '../api/plantsApi';
import { timeAgo } from '../utils/date';

export default function CommentModal({ visible, postId, plant, currentUser, onCommentAdded, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && postId) loadComments();
  }, [visible, postId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchComments(postId);
    // Backend: { username, text, createdAt }
    setComments(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!currentUser) { Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmalısın.'); return; }
    setSending(true);
    try {
      await postComment(postId, text.trim());
      setText('');
      onCommentAdded?.();
      await loadComments();
    } catch (e) {
      if (e.message === 'AUTH_REQUIRED') {
        Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmalısın.');
      } else {
        Alert.alert('Hata', e.message || 'Yorum gönderilemedi.');
      }
    } finally {
      setSending(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentBadge}>
        <Text>{item.badge || '🌱'}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{item.username}</Text>
          <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Yorumlar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {plant && (
            <View style={styles.plantRow}>
              <Text style={styles.plantInfo}>🌿 {plant.name}</Text>
            </View>
          )}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 32 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item, i) => `${item.username || ''}_${item.createdAt || ''}_${i}`}
              style={styles.list}
              contentContainerStyle={{ padding: Spacing.md }}
              ListEmptyComponent={<Text style={styles.empty}>Henüz yorum yok. İlk yorumu sen yap!</Text>}
              renderItem={renderComment}
            />
          )}
          {currentUser && (
            <View style={styles.inputRow}>
              <View style={styles.selfBadge}><Text>{currentUser.badge}</Text></View>
              <TextInput
                style={styles.textInput}
                value={text}
                onChangeText={setText}
                placeholder="Yorum ekle..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={300}
              />
              <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending} style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}>
                {sending ? <ActivityIndicator color={Colors.white} size="small" /> : <Ionicons name="send" size={18} color={Colors.white} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', ...Shadows.lg },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  plantRow: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  plantInfo: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  list: { flexGrow: 0 },
  empty: { textAlign: 'center', color: Colors.textMuted, fontSize: Typography.sizes.sm, paddingVertical: 24 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 2 },
  commentUser: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  commentTime: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  commentText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md },
  selfBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: Typography.sizes.sm, color: Colors.textPrimary, maxHeight: 80 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4 },
});
