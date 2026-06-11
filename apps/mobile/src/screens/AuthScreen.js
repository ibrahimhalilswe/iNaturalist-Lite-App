import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, StatusBar, Animated, Switch, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { loginUser, registerUser } from '../utils/storage';
import { ENDPOINTS } from '../constants/api';

const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score < 2) return { score, text: 'Zayıf', color: '#ef4444', pct: '33%' };
    if (score < 4) return { score, text: 'Orta', color: '#f59e0b', pct: '66%' };
    return { score, text: 'Güçlü', color: '#10b981', pct: '100%' };
};

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'otp' | 'reset'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [agreed, setAgreed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Toast animation
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = () => {
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const handleRegister = async () => {
    setError(''); setSuccessMsg('');
    if (!username.trim() || !email.trim() || !password.trim()) { setError('Kullanıcı adı, E-posta ve parola gerekli.'); return; }
    if (password !== passwordConfirm) { setError('Parolalar eşleşmiyor.'); return; }
    if (password.length < 6) { setError('Parola en az 6 karakter olmalı.'); return; }
    if (!agreed) { setError('Kullanıcı sözleşmesini kabul etmelisiniz.'); return; }

    setLoading(true);
    try {
      const user = await registerUser(username.trim(), email.trim(), password);
      showToast();
      setTimeout(() => onAuthSuccess(user), 2500); // Wait for toast
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(''); setSuccessMsg('');
    if (!username.trim() || !password.trim()) { setError('Kullanıcı adı ve parola gerekli.'); return; }
    setLoading(true);
    try {
      const user = await loginUser(username.trim(), password);
      onAuthSuccess(user);
    } catch (e) {
      const errorMsg = e && e.message ? e.message : 'Bilinmeyen bir hata oluştu.';
      setError(errorMsg);
      Alert.alert('Giriş Hatası', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(''); setSuccessMsg('');
    if (!email.trim()) { setError('E-posta adresi gerekli.'); return; }
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.forgotPassword, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'İşlem başarısız');
      }
      setMode('otp');
      setSuccessMsg('Doğrulama kodu e-postanıza gönderildi.');
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleReset = async () => {
    setError(''); setSuccessMsg('');
    if (!otpCode.trim() || !password.trim()) { setError('Kod ve yeni şifre gerekli.'); return; }
    if (password !== passwordConfirm) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.resetPassword, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode: otpCode.trim(), newPassword: password }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'İşlem başarısız');
      setMode('login');
      setSuccessMsg('Şifreniz başarıyla sıfırlandı. Lütfen giriş yapın.');
      setPassword(''); setPasswordConfirm(''); setOtpCode('');
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  const strength = getPasswordStrength(password);

  const renderForm = () => {
    if (mode === 'login') {
      return (
        <View style={styles.form}>
          <Input label="Kullanıcı Adı" value={username} onChangeText={setUsername} placeholder="örn. botanik_severin" autoCapitalize="none" leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />} />
          <Input label="Parola" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
          
          <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}>
             <Text style={styles.forgotText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
          {successMsg ? <View style={styles.successBox}><Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} /><Text style={styles.successText}>{successMsg}</Text></View> : null}

          <Button title={loading ? '' : 'Giriş Yap'} onPress={handleLogin} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }} />
        </View>
      );
    }
    if (mode === 'register') {
      return (
        <View style={styles.form}>
          <Input label="Kullanıcı Adı" value={username} onChangeText={setUsername} placeholder="örn. botanik_severin" autoCapitalize="none" leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />} />
          <Input label="E-posta" value={email} onChangeText={setEmail} placeholder="örn. mail@ornek.com" autoCapitalize="none" keyboardType="email-address" leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />} />
          <Input label="Parola" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
          
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: strength.pct, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>{strength.text}</Text>
            </View>
          )}

          <Input label="Parola Tekrar" value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="••••••••" secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
          
          <View style={styles.checkboxContainer}>
            <Switch value={agreed} onValueChange={setAgreed} trackColor={{ false: '#d1d5db', true: Colors.primary }} />
            <Text style={styles.checkboxText}>Kullanıcı sözleşmesini ve gizlilik politikasını okudum, kabul ediyorum.</Text>
          </View>

          {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}

          <Button title={loading ? '' : 'Hesap Oluştur'} onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }} />
        </View>
      );
    }
    if (mode === 'forgot') {
      return (
        <View style={styles.form}>
          <Text style={styles.formSubtitle}>Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.</Text>
          <Input label="E-posta" value={email} onChangeText={setEmail} placeholder="örn. mail@ornek.com" autoCapitalize="none" keyboardType="email-address" leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />} />
          {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
          <Button title={loading ? '' : 'Kodu Gönder'} onPress={handleForgot} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }} />
          <TouchableOpacity onPress={() => setMode('login')} style={{ marginTop: 16, alignItems: 'center' }}><Text style={styles.backText}>Giriş ekranına dön</Text></TouchableOpacity>
        </View>
      );
    }
    if (mode === 'otp') {
      return (
        <View style={styles.form}>
          <Text style={styles.formSubtitle}>E-postanıza gönderilen 6 haneli doğrulama kodunu ve yeni şifrenizi girin.</Text>
          {successMsg ? <View style={styles.successBox}><Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} /><Text style={styles.successText}>{successMsg}</Text></View> : null}
          <Input label="Doğrulama Kodu" value={otpCode} onChangeText={setOtpCode} placeholder="000000" keyboardType="number-pad" leftIcon={<Ionicons name="key-outline" size={18} color={Colors.textMuted} />} />
          <Input label="Yeni Parola" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
          <Input label="Yeni Parola Tekrar" value={passwordConfirm} onChangeText={setPasswordConfirm} placeholder="••••••••" secureTextEntry leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />} />
          {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
          <Button title={loading ? '' : 'Şifreyi Sıfırla'} onPress={handleReset} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }} />
          <TouchableOpacity onPress={() => setMode('login')} style={{ marginTop: 16, alignItems: 'center' }}><Text style={styles.backText}>Giriş ekranına dön</Text></TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Toast Notification */}
      <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }]}>
        <Ionicons name="leaf" size={24} color={Colors.white} />
        <Text style={styles.toastText}>Aramıza hoş geldin, {username}!</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoCircle}><Text style={styles.logoEmoji}>🌿</Text></View>
          <Text style={styles.appName}>iNaturalist Lite</Text>
          <Text style={styles.tagline}>Doğayı Keşfet & Belgele</Text>
        </View>

        <View style={styles.card}>
          {(mode === 'login' || mode === 'register') && (
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => { setMode('login'); setError(''); setSuccessMsg(''); }}>
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Giriş Yap</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, mode === 'register' && styles.tabActive]} onPress={() => { setMode('register'); setError(''); setSuccessMsg(''); }}>
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderForm()}
        </View>
        <Text style={styles.footer}>Gözlemlerini paylaş, toplulukla büyü 🌿</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: Spacing.xl },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.heavy, color: Colors.white, letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 18, letterSpacing: 0.5 },
  card: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 1, ...Shadows.lg },
  tabRow: { flexDirection: 'row', margin: Spacing.lg, backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.white, ...Shadows.sm },
  tabText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  form: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: 16 },
  formSubtitle: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginBottom: 16, textAlign: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: BorderRadius.sm, padding: Spacing.sm, gap: 6, marginBottom: Spacing.sm, borderWidth: 1, borderColor: '#fee2e2' },
  errorText: { fontSize: Typography.sizes.sm, color: Colors.error, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: BorderRadius.sm, padding: Spacing.sm, gap: 6, marginBottom: Spacing.sm, borderWidth: 1, borderColor: '#dcfce7' },
  successText: { fontSize: Typography.sizes.sm, color: Colors.primary, flex: 1 },
  forgotText: { color: Colors.primary, fontSize: Typography.sizes.sm, textAlign: 'right', marginBottom: 16, fontWeight: Typography.weights.medium },
  backText: { color: Colors.textMuted, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: Typography.sizes.xs, paddingBottom: 20, paddingTop: 12, backgroundColor: Colors.white },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  strengthBarBg: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, width: 40, textAlign: 'right' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingRight: 32 },
  checkboxText: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginLeft: 8, flexShrink: 1 },
  toast: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 100, ...Shadows.lg },
  toastText: { color: Colors.white, fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold }
});
