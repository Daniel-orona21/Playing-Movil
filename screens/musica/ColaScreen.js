import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native'
import Feather from '@expo/vector-icons/Feather';
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import MusicaSocketService from '../../services/MusicaSocketService';
import AuthService from '../../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ColaScreen() {
  const [queueSongs, setQueueSongs] = useState([]);
  const [establecimientoId, setEstablecimientoId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeQueueUpdate = useRef(null);
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../../assets/fonts/Onest-Bold.ttf'),
  });

  // Función para cargar la cola
  const loadQueue = useCallback(async (estabId, currentUserId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/musica/queue?establecimientoId=${estabId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.queue) {
          // Filtrar solo las canciones 'pending' (excluir la que está 'playing')
          const pendingQueue = data.queue.filter(song => song.status === 'pending');
          console.log('Queue song sample:', pendingQueue[0]);
          console.log('Current userId:', currentUserId);
          setQueueSongs(pendingQueue);
        }
      }
    } catch (error) {
      console.error('Error cargando cola:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect para obtener el establecimientoId y cargar la cola
  useEffect(() => {
    const fetchAndLoadQueue = async () => {
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
                
                // Cargar cola inicial
                await loadQueue(estabId, currentUserId);
                
                // Suscribirse a actualizaciones de la cola
                unsubscribeQueueUpdate.current = MusicaSocketService.on('queue_update', () => {
                  loadQueue(estabId, currentUserId);
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
    
    fetchAndLoadQueue();
    
    // Cleanup
    return () => {
      if (unsubscribeQueueUpdate.current) unsubscribeQueueUpdate.current();
    };
  }, [loadQueue]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.contenido} onLayout={onLayoutRootView}>
      <Text style={styles.texto}>A continuación...</Text>
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={loading ? styles.scrollContentLoading : null}
      >
        {loading ? (
          <ActivityIndicator size="large" color="white" style={styles.loader} />
        ) : queueSongs.length === 0 ? (
          <Text style={styles.noResultsText}>No hay canciones en la cola</Text>
        ) : (
          <View style={styles.queueContainer}>
            {queueSongs.map((song) => (
              <View key={song.id} style={styles.songResultButtonWrapper}>
                <BlurView intensity={50} tint='dark' style={styles.songResultButton}>
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
                  {song.anadido_por === userId && (
                    <View style={styles.userBadge}>
                      <Feather name="user" size={16} color="white" style={styles.iconoUsuario} />
                    </View>
                  )}
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
  queueContainer: {
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
  posicionContainer: {
    paddingHorizontal: 10
  },
  posicionTexto: {
    color: Colors.textoSecundario,
    fontSize: 12,
    fontFamily: 'Onest-Bold',
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
    paddingHorizontal: 10,
  },
});