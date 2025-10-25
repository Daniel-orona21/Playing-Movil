import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, } from 'react-native'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import MusicaSocketService from '../../services/MusicaSocketService';
import AuthService from '../../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistorialScreen() {
  const [historySongs, setHistorySongs] = useState([]);
  const [establecimientoId, setEstablecimientoId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeHistoryUpdate = useRef(null);
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../../assets/fonts/Onest-Bold.ttf'),
  });

  // Función para cargar el historial
  const loadHistory = useCallback(async (estabId, currentUserId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/musica/history?establecimientoId=${estabId}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.history) {
          console.log('History song sample:', data.history[0]);
          console.log('Current userId:', currentUserId);
          setHistorySongs(data.history);
        }
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect para obtener el establecimientoId y cargar el historial
  useEffect(() => {
    const fetchAndLoadHistory = async () => {
      try {
        await AuthService.loadStoredAuth();
        if (AuthService.isAuthenticated()) {
          const user = AuthService.getCurrentUser();
          let currentUserId = null;
          if (user && user.id) {
            currentUserId = user.id;
            setUserId(user.id);
          }
          
          const res = await AuthService.verifyToken();
          if (res && res.success && res.user && res.user.mesa_id_activa) {
            const token = await AsyncStorage.getItem('token');
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
            
            const mesaRes = await fetch(`${API_URL}/establecimientos/mesa/${res.user.mesa_id_activa}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (mesaRes.ok) {
              const mesaData = await mesaRes.json();
              if (mesaData.success && mesaData.mesa) {
                const estabId = mesaData.mesa.establecimiento_id;
                setEstablecimientoId(estabId);
                
                // Cargar historial inicial
                await loadHistory(estabId, currentUserId);
                
                // Suscribirse a actualizaciones del historial
                unsubscribeHistoryUpdate.current = MusicaSocketService.on('history_update', () => {
                  loadHistory(estabId, currentUserId);
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo establecimiento:', error);
        setLoading(false);
      }
    };
    
    fetchAndLoadHistory();
    
    // Cleanup
    return () => {
      if (unsubscribeHistoryUpdate.current) unsubscribeHistoryUpdate.current();
    };
  }, [loadHistory]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Función para formatear fecha/hora
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  return (
    <View style={styles.contenido} onLayout={onLayoutRootView}>
      <Text style={styles.texto}>Historial</Text>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={loading ? styles.scrollContentLoading : null}
      >
        {loading ? (
          <ActivityIndicator size="large" color="white" style={styles.loader} />
        ) : historySongs.length === 0 ? (
          <Text style={styles.noResultsText}>No hay canciones en el historial</Text>
        ) : (
          <View style={styles.historyContainer}>
            {historySongs.map((song) => (
              <View key={song.id_historial} style={styles.songResultButtonWrapper}>
                <BlurView intensity={20} tint='dark' style={styles.songResultButton}>
                  {song.imagen_url ? (
                    <Image 
                      source={{ uri: song.imagen_url }} 
                      style={styles.portada}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.portada}>
                      <MaterialIcons name="music-note" size={15} color="gray" />
                    </View>
                  )}
                  <View style={styles.infoCancion}>
                    <Text style={styles.songTitle} numberOfLines={1}>{song.titulo}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{song.artista}</Text>
                  </View>
                  {song.usuario_id === userId && (
                    <View style={styles.userBadge}>
                      <Feather name="user" size={16} color="white" style={styles.iconoUsuario} />
                    </View>
                  )}
                  <View style={styles.tiempoContainer}>
                    <Text style={styles.tiempoTexto}>{formatDate(song.reproducida_en)}</Text>
                  </View>
                </BlurView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  contenido: {
    flex: 1,
    gap: 15,
  },
  texto: {
    fontFamily: 'Michroma-Regular',
    color: 'white',
    marginLeft: 5,
  },
  scroll: {
    flex: 1,
  },
  scrollContentLoading: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 40,
  },
  historyContainer: {
    gap: 10
  },
  songResultButton: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  portada: {
    backgroundColor: Colors.tabSeleccionado,
    aspectRatio: 1/1,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden'
  },
  infoCancion: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10
  },
  tiempoContainer: {
    paddingHorizontal: 10
  },
  tiempoTexto: {
    color: Colors.textoSecundario,
    fontSize: 11,
    fontFamily: 'Onest-Regular',
  },
  songTitle: {
    color: Colors.textoPrincipal,
    fontSize: 16,
    fontFamily: 'Onest-Bold',
  },
  songArtist: {
    color: Colors.textoSecundario,
    fontSize: 14,
    fontFamily: 'Onest-Regular',
  },
  iconoUsuario : {
    opacity: .5
  },
  songResultButtonWrapper: {
    borderRadius: 10,
  },
  noResultsText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    textAlign: 'center',
    marginTop: 10,
  },
  userBadge: {
    paddingHorizontal: 8,
  },
});