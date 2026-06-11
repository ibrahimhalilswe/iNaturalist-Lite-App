import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import NetInfo from '@react-native-community/netinfo';
import { identifyPlant } from '../api/plantnetApi';
import { uploadPhoto, savePlant } from '../api/plantsApi';
import { getActiveUser } from '../utils/storage';
import { enqueueObservation } from '../utils/offlineQueue';

const STEPS = { MEDIA: 0, ANALYZING: 1, FORM: 2, SAVING: 3, SUCCESS: 4, QUEUED: 5 };

export default function AddObservationScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.MEDIA);
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [plantName, setPlantName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async (fromCamera) => {
    setError('');
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
          aspect: [1, 1],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
          aspect: [1, 1],
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await runAIAnalysis(uri);
      }
    } catch (e) {
      setError('Fotoğraf seçilirken hata oluştu: ' + e.message);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      return null;
    }
  };

  const runAIAnalysis = async (uri) => {
    setStep(STEPS.ANALYZING);
    setError('');
    try {
      const [aiData, loc] = await Promise.all([identifyPlant(uri), getLocation()]);
      setAiResult(aiData);
      setPlantName(aiData.commonName || '');
      setLocation(loc);
      setStep(STEPS.FORM);
    } catch (e) {
      setError('Görselde bir bitki tanımlanamadı! Lütfen geçerli ve net bir bitki fotoğrafı seçin.');
      setImageUri(null);
      setStep(STEPS.MEDIA);
    }
  };

  const handleSave = async () => {
    if (!plantName.trim()) {
      setError('Lütfen bitki adını girin.');
      return;
    }
    if (!imageUri) {
      setError('Fotoğraf gerekli.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        await enqueueObservation({
          imageUri,
          name: plantName.trim(),
          description: description.trim(),
          lat: location?.lat ?? 38.6745,
          lng: location?.lng ?? 39.1944,
        });
        setStep(STEPS.QUEUED);
        return;
      }

      const user = await getActiveUser();
      const photoUrl = await uploadPhoto(imageUri);
      await savePlant({
        name: plantName.trim(),
        description: description.trim(),
        lat: location?.lat ?? 38.6745,
        lng: location?.lng ?? 39.1944,
        photoUrl,
        userName: user?.username || 'Anonim',
        userBadge: user?.badge || '🌱',
      });

      setStep(STEPS.SUCCESS);
    } catch (e) {
      setError('Kaydetme hatası: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(STEPS.MEDIA);
    setImageUri(null);
    setLocation(null);
    setAiResult(null);
    setPlantName('');
    setDescription('');
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Gözlem</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      {step !== STEPS.SUCCESS && (
        <View style={styles.stepIndicator}>
          {['📷', '🔬', '📝'].map((icon, i) => (
            <React.Fragment key={i}>
              <View style={[styles.stepDot, i <= step && step < STEPS.SUCCESS && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>{icon}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* STEP 0: Media selection */}
        {step === STEPS.MEDIA && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>Fotoğraf Seç</Text>
            <Text style={styles.stepSubtitle}>
              Tanımlamak istediğin bitkinin fotoğrafını çek veya galerinden seç.
            </Text>
            <TouchableOpacity style={styles.cameraOption} onPress={() => pickImage(true)}>
              <View style={styles.cameraOptionIcon}>
                <Ionicons name="camera" size={32} color={Colors.primary} />
              </View>
              <View style={styles.cameraOptionText}>
                <Text style={styles.cameraOptionTitle}>Kamera ile Çek</Text>
                <Text style={styles.cameraOptionSub}>Gerçek zamanlı fotoğraf</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraOption} onPress={() => pickImage(false)}>
              <View style={[styles.cameraOptionIcon, { backgroundColor: `${Colors.accent}15` }]}>
                <Ionicons name="images" size={32} color={Colors.accent} />
              </View>
              <View style={styles.cameraOptionText}>
                <Text style={styles.cameraOptionTitle}>Galeriden Seç</Text>
                <Text style={styles.cameraOptionSub}>Mevcut fotoğraflarından seç</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        )}

        {/* STEP 1: Analyzing */}
        {step === STEPS.ANALYZING && (
          <View style={styles.analyzingSection}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.analyzingImage} resizeMode="cover" />
            )}
            <View style={styles.analyzingOverlay}>
              <View style={styles.analyzingCard}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.analyzingTitle}>🔬 AI Analiz Ediyor...</Text>
                <Text style={styles.analyzingSubtitle}>
                  PlantNet yapay zekası bitkiyi tanımlamaya çalışıyor.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Form */}
        {step === STEPS.FORM && (
          <View style={styles.section}>
            {/* Photo preview */}
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            )}

            {/* AI Result */}
            {aiResult && (
              <View style={styles.aiCard}>
                <View style={styles.aiCardHeader}>
                  <Text style={styles.aiCardTitle}>🤖 AI Sonucu</Text>
                  <View style={[
                    styles.confidenceBadge,
                    { backgroundColor: aiResult.confidence >= 70 ? `${Colors.success}20` : `${Colors.warning}20` }
                  ]}>
                    <Text style={[
                      styles.confidenceText,
                      { color: aiResult.confidence >= 70 ? Colors.success : Colors.warning }
                    ]}>
                      %{aiResult.confidence} Eşleşme
                    </Text>
                  </View>
                </View>
                <Text style={styles.aiScientific}>{aiResult.scientificName}</Text>
                {aiResult.family ? (
                  <Text style={styles.aiFamily}>Familya: {aiResult.family}</Text>
                ) : null}
                {aiResult.allResults?.length > 1 && (
                  <View style={styles.altResults}>
                    <Text style={styles.altResultsTitle}>Diğer Olasılıklar:</Text>
                    {aiResult.allResults.slice(1).map((r, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setPlantName(r.name)}
                        style={styles.altResultItem}
                      >
                        <Text style={styles.altResultName}>{r.name}</Text>
                        <Text style={styles.altResultConf}>%{r.confidence}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {!aiResult && error && (
              <View style={styles.aiErrorCard}>
                <Text style={styles.aiErrorText}>⚠️ {error}</Text>
                <Text style={styles.aiErrorSub}>
                  Bitki adını manuel olarak girebilirsin.
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.locationCard}>
              <Ionicons name="location" size={18} color={Colors.primary} />
              <Text style={styles.locationText}>
                {location
                  ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                  : '📍 Konum alınamadı — varsayılan kullanılacak'}
              </Text>
            </View>

            {/* Form fields */}
            <Input
              label="Bitki Adı *"
              value={plantName}
              onChangeText={setPlantName}
              placeholder="örn. Karahindiba"
              autoCapitalize="words"
              leftIcon={<Ionicons name="leaf-outline" size={18} color={Colors.textMuted} />}
              style={{ marginTop: 8 }}
            />
            <Input
              label="Notlarınız (opsiyonel)"
              value={description}
              onChangeText={setDescription}
              placeholder="Gözlem hakkında notlar..."
              multiline
              numberOfLines={3}
              leftIcon={<Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />}
            />

            {error && !aiResult && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <View style={styles.actionRow}>
              <Button
                title="Yeniden Seç"
                variant="outline"
                onPress={reset}
                style={{ flex: 1 }}
              />
              <Button
                title="Kaydet"
                onPress={handleSave}
                loading={saving}
                style={{ flex: 2 }}
                icon={<Ionicons name="cloud-upload-outline" size={18} color={Colors.white} />}
              />
            </View>
          </View>
        )}

        {/* STEP 4: Success */}
        {step === STEPS.SUCCESS && (
          <View style={styles.successSection}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Gözlem Eklendi!</Text>
            <Text style={styles.successSubtitle}>
              {plantName} başarıyla kaydedildi ve toplulukla paylaşıldı.
            </Text>
            <Button
              title="Akışa Git"
              onPress={() => { navigation.navigate('Feed'); reset(); }}
              style={{ marginBottom: 12 }}
              fullWidth
            />
            <Button
              title="Yeni Gözlem Ekle"
              variant="outline"
              onPress={reset}
              fullWidth
            />
          </View>
        )}

        {/* STEP 5: Queued (offline) */}
        {step === STEPS.QUEUED && (
          <View style={styles.successSection}>
            <Text style={styles.successEmoji}>📡</Text>
            <Text style={styles.successTitle}>Kuyruğa Alındı</Text>
            <Text style={styles.successSubtitle}>
              Şu an çevrimdışısın. {plantName} kuyruğa eklendi — internet bağlantısı kurulunca otomatik yüklenecek.
            </Text>
            <Button
              title="Tamam"
              onPress={() => { navigation.navigate('Feed'); reset(); }}
              style={{ marginBottom: 12 }}
              fullWidth
            />
            <Button
              title="Yeni Gözlem Ekle"
              variant="outline"
              onPress={reset}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 16,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingBottom: 18,
    paddingHorizontal: Spacing.xl,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: 'rgba(255,255,255,0.95)' },
  stepDotText: { fontSize: 16 },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: 'rgba(255,255,255,0.8)' },
  scroll: { flexGrow: 1, padding: Spacing.md },
  section: { flex: 1 },
  stepTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  stepSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  cameraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    ...Shadows.sm,
  },
  cameraOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOptionText: { flex: 1 },
  cameraOptionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cameraOptionSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  analyzingSection: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    height: 320,
    marginBottom: Spacing.md,
  },
  analyzingImage: { width: '100%', height: '100%' },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  analyzingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    ...Shadows.lg,
  },
  analyzingTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  analyzingSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.lg,
    marginBottom: 14,
    backgroundColor: Colors.backgroundAlt,
  },
  aiCard: {
    backgroundColor: `${Colors.primary}08`,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiCardTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  confidenceBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  confidenceText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  aiScientific: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  aiFamily: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  altResults: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${Colors.primary}20`,
    paddingTop: 8,
  },
  altResultsTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: Typography.weights.semibold,
  },
  altResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  altResultName: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  altResultConf: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  aiErrorCard: {
    backgroundColor: `${Colors.warning}10`,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  aiErrorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  aiErrorSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginBottom: 14,
    ...Shadows.sm,
  },
  locationText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  successSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  successEmoji: { fontSize: 72 },
  successTitle: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.heavy,
    color: Colors.primary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
});
