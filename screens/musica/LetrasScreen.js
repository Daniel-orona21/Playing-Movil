import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import MusicaSocketService from '../../services/MusicaSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LetrasScreen({ initialTrack, initialTime }) {
  const [currentTrack, setCurrentTrack] = useState(initialTrack || null);
  const [currentTime, setCurrentTime] = useState(initialTime || 0);
  const [lyrics, setLyrics] = useState([]);
  const [syncedLyrics, setSyncedLyrics] = useState([]);
  const [isSynced, setIsSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const unsubscribePlaybackUpdate = useRef(null);
  const unsubscribeProgress = useRef(null);
  const loadedTrackRef = useRef(null); // Para evitar recargas innecesarias
  
  // ⚙️ CONFIGURACIÓN: Offset para compensar latencia
  // Valores negativos = adelantar letras | Valores positivos = retrasar letras
  // Ajusta este valor según la latencia de tu red/dispositivo
  const LYRICS_OFFSET = -1.8; // Adelantar 0.8 segundos (puedes cambiar este valor)
  
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../../assets/fonts/Onest-Bold.ttf'),
  });

  // Cargar letras para la canción actual
  const loadLyrics = useCallback(async (track) => {
    if (!track) {
      console.log('⚠️ Letras: No hay track para cargar');
      setLoading(false);
      return;
    }

    // Evitar recargar si ya se cargaron las letras de esta canción
    if (loadedTrackRef.current === track.spotify_id) {
      return;
    }

    try {
      loadedTrackRef.current = track.spotify_id;
      setLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = await AsyncStorage.getItem('token');
      const params = new URLSearchParams({
        track: track.titulo,
        artist: track.artista
      });

      if (track.album) params.append('album', track.album);
      if (track.duracion) params.append('duration', track.duracion);

      const response = await fetch(
        `${API_URL}/lyrics?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.synced) {
          // Letras sincronizadas con timestamps
          // console.log(' Letras sincronizadas cargadas:', data.lyrics.length, 'líneas');
          // console.log(' Primera línea:', data.lyrics[0]);
          // console.log('Tiempo actual inicial:', currentTime.toFixed(1), 's');
          setSyncedLyrics(data.lyrics);
          setIsSynced(true);
          setLyrics([]);
          setCurrentLineIndex(0);
        } else {
          // Letras simples sin timestamps
          console.log('⚠️ Solo letras simples disponibles');
          setLyrics(data.lyrics);
          setIsSynced(false);
          setSyncedLyrics([]);
        }
      } else {
        // No se encontraron letras
        console.log('❌ No se encontraron letras');
        setLyrics(['Letras no disponibles para esta canción']);
        setIsSynced(false);
        setSyncedLyrics([]);
      }

    } catch (error) {
      console.error('Error loading lyrics:', error);
      setLyrics(['No se pudieron cargar las letras']);
      setIsSynced(false);
      setSyncedLyrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sincronizar currentTime con initialTime (actualización continua desde el padre)
  useEffect(() => {
    if (initialTime !== undefined) {
      setCurrentTime(initialTime);
    }
  }, [initialTime]);

  // Cargar letras cuando el componente se monta con una canción inicial (solo una vez)
  useEffect(() => {
    // Sincronizar tiempo inicial al montar
    if (initialTime !== undefined) {
      // console.log(' Letras: Sincronizando tiempo inicial:', initialTime);
      setCurrentTime(initialTime);
    }
    
    if (initialTrack) {
      // console.log(' Letras: Cargando letras para canción inicial:', initialTrack.titulo);
      setCurrentTrack(initialTrack);
      loadLyrics(initialTrack);
    } else {
      console.log('⚠️ Letras: No hay canción inicial');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar, no cuando cambian las props

  // Suscribirse a actualizaciones de reproducción
  useEffect(() => {
    // console.log('🔌 Letras: Suscribiéndose a eventos de socket');
    // console.log('📊 Estado inicial - isSynced:', isSynced, 'syncedLyrics:', syncedLyrics.length, 'currentTime:', currentTime);
    
    // Test: agregar un listener genérico para ver TODOS los eventos
    const testListener = (eventName) => {
      console.log(`🔔 Letras: Evento recibido: ${eventName}`);
    };
    
    unsubscribePlaybackUpdate.current = MusicaSocketService.on('playback_update', (data) => {
      // console.log('Letras: Recibido playback_update', data.currentTrack?.titulo);
      if (data.currentTrack) {
        // Verificar si cambió la canción usando el ref
        if (loadedTrackRef.current !== data.currentTrack.spotify_id) {
          setCurrentTrack(data.currentTrack);
          loadLyrics(data.currentTrack);
        }
      }
    });

    unsubscribeProgress.current = MusicaSocketService.on('playback_progress', (data) => {
      console.log('⏱️ Letras: playback_progress event triggered!', data);
      if (data && data.position !== undefined) {
        const timeInSeconds = data.position / 1000;
        console.log('⏱️ Letras: Progreso recibido:', timeInSeconds.toFixed(1), 's');
        setCurrentTime(timeInSeconds);
      } else {
        console.log('⚠️ Letras: Evento playback_progress recibido sin datos válidos', data);
      }
    });


    return () => {
      if (unsubscribePlaybackUpdate.current) unsubscribePlaybackUpdate.current();
      if (unsubscribeProgress.current) unsubscribeProgress.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar y desmontar

  // Refs para medir las posiciones de las líneas
  const lineRefs = useRef([]);

  // Sincronizar línea actual con el tiempo de reproducción
  useEffect(() => {
    if (!isSynced || syncedLyrics.length === 0) {
      return;
    }

    // Aplicar offset para compensar latencia
    const adjustedTime = currentTime - LYRICS_OFFSET;

    // Encontrar la línea actual basada en el tiempo ajustado
    let newIndex = 0;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (syncedLyrics[i].time <= adjustedTime) {
        newIndex = i;
      } else {
        break;
      }
    }

    if (newIndex !== currentLineIndex) {
      setCurrentLineIndex(newIndex);
      
      // Auto-scroll usando measureLayout para posición exacta
      if (scrollViewRef.current && lineRefs.current[newIndex]) {
        lineRefs.current[newIndex].measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            // Posición donde queremos que esté la línea actual (120px desde el top)
            const targetPosition = 30;
            
            // Calcular scroll para que la línea actual esté en targetPosition
            const scrollY = Math.max(0, y - targetPosition);
            
            // console.log(`📍 Scroll a posición: ${scrollY} (línea en Y: ${y})`);
            
            scrollViewRef.current.scrollTo({
              y: scrollY,
              animated: true
            });
          },
          (error) => {
            console.error('Error midiendo layout:', error);
          }
        );
      }
    }
  }, [currentTime, isSynced, syncedLyrics, currentLineIndex]);

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
      {/* Header con información de la canción */}
      <View style={styles.songHeader}>
        {currentTrack?.imagen_url ? (
          <Image 
            source={{ uri: currentTrack.imagen_url }} 
            style={styles.albumArt}
          />
        ) : (
          <View style={styles.albumArtPlaceholder}>
            <MaterialIcons name="music-note" size={30} color="white" />
          </View>
        )}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>
            {currentTrack?.titulo || 'Sin reproducción activa'}
          </Text>
          <Text style={styles.songArtist}>
            {currentTrack?.artista || '---'}
          </Text>
        </View>
      </View>

      {/* Área de letras */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Cargando letras...</Text>
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.lyricsContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isSynced || lyrics.length > 1 ? styles.lyricsContent : styles.lyricsContentCentered}
        >
          {isSynced ? (
            // Letras sincronizadas
            syncedLyrics.map((line, index) => (
              <View 
                key={index}
                ref={el => lineRefs.current[index] = el}
                collapsable={false}
              >
                <Text 
                  style={[
                    styles.lyricsLine,
                    index === currentLineIndex && styles.currentLyricsLine
                  ]}
                >
                  {line.text}
                </Text>
              </View>
            ))
          ) : (
            // Letras simples o mensaje de error
            lyrics.map((line, index) => (
              <Text 
                key={index} 
                style={lyrics.length === 1 ? styles.noLyricsMessage : styles.lyricsLine}
              >
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  contenido: {
    flex: 1,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 15,
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  albumArtPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.tabSeleccionado,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Onest-Bold',
    marginBottom: 4,
  },
  songArtist: {
    color: Colors.textoSecundario,
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: Colors.textoSecundario,
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  lyricsContainer: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 200,
  },
  lyricsContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lyricsLine: {
    color: Colors.textoSecundario,
    fontSize: 18,
    fontFamily: 'Onest-Regular',
    lineHeight: 32,
    marginBottom: 12,
    textAlign: 'left',
    opacity: 0.6,
  },
  noLyricsMessage: {
    color: Colors.textoSecundario,
    fontSize: 18,
    fontFamily: 'Onest-Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  currentLyricsLine: {
    fontSize: 24,
    fontFamily: 'Onest-Bold',
    color: 'white',
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
});