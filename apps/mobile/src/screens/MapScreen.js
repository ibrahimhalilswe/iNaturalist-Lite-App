import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../constants/theme';
import { fetchPlants } from '../api/plantsApi';
import { DEFAULT_REGION, resolvePhotoUrl } from '../constants/api';

const generateMapHTML = (plants, region, userLocation) => {
  const markers = plants
    .filter(p => !isNaN(parseFloat(p.lat)) && !isNaN(parseFloat(p.lng)))
    .map(p => ({
      id: p.id,
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      name: p.name || 'Bilinmeyen',
      userName: p.userName || 'Misafir',
      userBadge: p.userBadge || '🌿',
      description: p.description || '',
      photoUrl: resolvePhotoUrl(p.photoUrl) || '',
    }));

  const centerLat = region.latitude;
  const centerLng = region.longitude;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker {
      background: #fff;
      border: 2px solid #1a4731;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      background-size: cover;
      background-position: center;
      overflow: hidden;
    }
    .custom-marker.has-image {
      border: 2px solid #4ade80;
    }
    .popup-img {
      width: 100%;
      max-height: 140px;
      object-fit: cover;
      border-radius: 8px;
      margin-top: 6px;
      margin-bottom: 6px;
    }
    .user-marker {
      background: #3b82f6;
      border: 3px solid #fff;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.2);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .leaflet-popup-content {
      margin: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .popup-name {
      font-size: 14px;
      font-weight: 700;
      color: #1a4731;
      margin-bottom: 4px;
    }
    .popup-user {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .popup-desc {
      font-size: 11px;
      color: #999;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false
    }).setView([${centerLat}, ${centerLng}], 13);
    
    window.plantMarkers = {};

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    var markers = ${JSON.stringify(markers)};
    markers.forEach(function(m) {
      var safePhotoUrl = escapeHtml(m.photoUrl);
      var safeName = escapeHtml(m.name);
      var safeUserName = escapeHtml(m.userName);
      var safeBadge = escapeHtml(m.userBadge);
      var safeDesc = escapeHtml(m.description);

      var markerHtml = '';
      if (m.photoUrl) {
         markerHtml = '<div class="custom-marker has-image" style="background-image: url(&quot;' + safePhotoUrl + '&quot;)"></div>';
      } else {
         markerHtml = '<div class="custom-marker">' + safeBadge + '</div>';
      }

      var icon = L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24]
      });

      var imgHtml = m.photoUrl ? '<img src="' + safePhotoUrl + '" class="popup-img"/>' : '';

      var popupContent = '<div class="popup-name">' + safeName + '</div>' +
        '<div class="popup-user">' + safeBadge + ' ' + safeUserName + '</div>' +
        imgHtml +
        (m.description ? '<div class="popup-desc">' + safeDesc + '</div>' : '');

      var marker = L.marker([m.lat, m.lng], { icon: icon })
        .addTo(map)
        .bindPopup(popupContent);
        
      if (m.id) {
        window.plantMarkers[m.id] = marker;
      }
    });

    ${userLocation ? `
      var userIcon = L.divIcon({
        className: '',
        html: '<div class="user-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      window.userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div class="popup-name">📍 Konumunuz</div>');
    ` : ''}

    window.updateUserLocation = function(lat, lng) {
      if (!window.userMarker) {
        var userIcon = L.divIcon({
          className: '',
          html: '<div class="user-marker"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        window.userMarker = L.marker([lat, lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<div class="popup-name">📍 Konumunuz</div>');
      } else {
        window.userMarker.setLatLng([lat, lng]);
      }
    };

    window.goToLocation = function(lat, lng, plantId) {
      map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
      if (plantId && window.plantMarkers && window.plantMarkers[plantId]) {
        setTimeout(function() {
          window.plantMarkers[plantId].openPopup();
        }, 1500);
      }
    };

    document.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'goToLocation') {
          window.goToLocation(data.lat, data.lng);
        }
      } catch(err) {}
    });
  </script>
</body>
</html>`;
};

export default function MapScreen({ route, navigation }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [])
  );

  useEffect(() => {
    if (!route.params?.targetLocation && !userLocation) {
      requestLocation();
    }
  }, []);

  useEffect(() => {
    const target = route.params?.targetLocation;
    if (target && target.lat && target.lng) {
      const lat = Number(target.lat);
      const lng = Number(target.lng);
      setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      const plantId = target.id ? `'${target.id}'` : 'null';
      
      if (mapReady && webViewRef.current) {
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(`
            if (typeof window.goToLocation === 'function') {
              window.goToLocation(${lat}, ${lng}, ${plantId});
            }
            true;
          `);
        }, 300);
        setTimeout(() => {
          navigation.setParams({ targetLocation: null });
        }, 1000);
      }
    }
  }, [route.params?.targetLocation, mapReady]);

  const loadPlants = async () => {
    if (plants.length === 0) setLoading(true);
    try {
      const result = await fetchPlants(1, 500);
      const newPlants = result.plants || [];
      if (JSON.stringify(newPlants) !== JSON.stringify(plants)) {
        setPlants(newPlants);
      }
    } catch (e) {
      console.error('Plants load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(coords);
      // Sadece ilk seferde region'ı güncelle, harita tekrar render olmasın
      if (!userLocation) {
        setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      }
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation && mapReady && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.updateUserLocation === 'function') {
          window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
        }
        true;
      `);
    }
  }, [userLocation, mapReady]);

  const goToUserLocation = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.goToLocation === 'function') {
          window.goToLocation(${userLocation.latitude}, ${userLocation.longitude});
        }
        true;
      `);
    } else if (!userLocation) {
      requestLocation();
    }
  };

  const mapSource = useMemo(() => {
    return { html: generateMapHTML(plants, region, userLocation) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants]);

  return (
    <View style={styles.root}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.white} size="large" />
          <Text style={styles.loadingText}>Harita yükleniyor...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={mapSource}
        style={styles.map}
        onLoadEnd={() => setMapReady(true)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled={false}
        bounces={false}
      />

      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>🗺️ Gözlem Haritası</Text>
          <Text style={styles.headerCount}>
            {plants.length} gözlem
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={goToUserLocation}>
          {locationLoading
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Ionicons name="locate" size={22} color={Colors.primary} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={loadPlants}>
          <Ionicons name="refresh" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => navigation.navigate('AddObservation')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${Colors.primary}cc`,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  headerOverlay: {
    position: 'absolute',
    top: 56,
    left: Spacing.md,
    right: Spacing.md,
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  headerCount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  controls: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 110,
    gap: 10,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  addFab: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
