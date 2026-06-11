import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { getActiveUser } from './src/utils/storage';
import { flushQueue, getQueueCount } from './src/utils/offlineQueue';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/TabNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { Colors } from './src/constants/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const wasOfflineRef = React.useRef(false);

  useEffect(() => {
    checkAuth();
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      if (!offline && wasOfflineRef.current) {
        const count = await getQueueCount();
        if (count > 0) {
          const { flushed } = await flushQueue();
          if (flushed > 0) setQueueCount(0);
        }
      }
      wasOfflineRef.current = offline;
    });
    getQueueCount().then(setQueueCount);
    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const activeUser = await getActiveUser();
      setUser(activeUser);
    } catch (e) {
      console.warn('checkAuth error:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashInner}>
          <ActivityIndicator color={Colors.white} size="large" />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              {queueCount > 0
                ? `📡 Çevrimdışısın — ${queueCount} gözlem kuyrukta`
                : '📡 Çevrimdışısın — veriler önbellekten gösteriliyor'}
            </Text>
          </View>
        )}
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
              {(props) => (
                <AppNavigator
                  {...props}
                  onLogout={() => setUser(null)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Auth"
              options={{ animation: 'fade' }}
            >
              {() => <AuthScreen onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashInner: {
    alignItems: 'center',
    gap: 16,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#f59e0b',
    paddingTop: 44,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
