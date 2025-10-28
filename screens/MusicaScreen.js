import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import LetrasScreen from './musica/LetrasScreen';
import ColaScreen from './musica/ColaScreen';
import HistorialScreen from './musica/HistorialScreen';
import BusquedaScreen from './musica/BusquedaScreen';
import * as Haptics from 'expo-haptics';
import MusicaSocketService from '../services/MusicaSocketService';
import AuthService from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MusicaScreen = ({
  onShowModalChange
}) => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

  // Estados para los botones
  const [isLiked, setIsLiked] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [colaCancionId, setColaCancionId] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [skipsCount, setSkipsCount] = useState(0);
  
  // Estado para la navegación
  const [selectedNav, setSelectedNav] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Estados para la reproducción en tiempo real
  const [currentTrack, setCurrentTrack] = useState(null);
  const [establecimientoId, setEstablecimientoId] = useState(null); 

  // Funciones para el modal de agregar canción
  const handleOpenAddSongModal = (isVisible, song) => {
    if (onShowModalChange) {
      onShowModalChange(isVisible, song); 
    }
  };

  
  // Estados para tiempo en SEGUNDOS (números directos)
  const [currentTime, setCurrentTime] = useState(0); 
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Ref para guardar el unsubscribe de los listeners
  const unsubscribePlaybackUpdate = useRef(null);
  const unsubscribeTrackStarted = useRef(null);
  const unsubscribePlaybackState = useRef(null);
  const unsubscribeProgress = useRef(null);
  const unsubscribeVotesUpdate = useRef(null);
  const unsubscribeTrackSkipped = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return currentTime / totalDuration;
  };

  const getRemainingTime = () => {
    return totalDuration - currentTime;
  };

  // Función para cargar el estado de voto del usuario
  const loadUserVoteStatus = async (colaId, token, apiUrl) => {
    try {
      const response = await fetch(`${apiUrl}/musica/votes/${colaId}/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.hasLiked);
        setIsSkipping(data.hasSkipped);
      }
    } catch (error) {
      console.error('Error cargando estado de voto del usuario:', error);
    }
  };

  // Función para cargar los contadores de votos
  const loadVoteCounts = async (colaId, token, apiUrl) => {
    try {
      const response = await fetch(`${apiUrl}/musica/votes/${colaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likes);
        setSkipsCount(data.skips);
      }
    } catch (error) {
      console.error('Error cargando contadores de votos:', error);
    }
  };

  const handleNavPress = (navType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedNav === navType) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start(() => {
        setSelectedNav(null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start(() => {
        setSelectedNav(navType);
        // Fade in del nuevo contenido
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleLikePress = async () => {
    if (!colaCancionId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/musica/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          colaCancionId: colaCancionId,
          type: 'like'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.voted); // true si se agregó, false si se removió
        setLikesCount(data.likes);
        setSkipsCount(data.skips);
      }
    } catch (error) {
      console.error('Error al votar like:', error);
    }
  };

  const handleSkipPress = async () => {
    if (!colaCancionId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/musica/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          colaCancionId: colaCancionId,
          type: 'skip'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsSkipping(data.voted); // true si se agregó, false si se removió
        setLikesCount(data.likes);
        setSkipsCount(data.skips);
        
        if (data.autoSkipped) {
          console.log('Canción skipeada automáticamente por mayoría de votos');
        }
      }
    } catch (error) {
      console.error('Error al votar skip:', error);
    }
  };

  const renderContent = () => {
    if (selectedNav === null) {
      return (
        <View style={styles.sonando}>
          {currentTrack && currentTrack.imagen_url ? (
            <Image 
              source={{ uri: currentTrack.imagen_url }} 
              style={styles.portada}
              resizeMode="cover"
            />
          ) : (
            <BlurView intensity={10} style={styles.portada}>
              <MaterialIcons name="music-note" size={44} color="gray" />
            </BlurView>
          )}
          <View style={styles.infoCancion}>
            <Text style={styles.nombre} numberOfLines={1}>
              {currentTrack ? currentTrack.titulo : 'Sin reproducción'}
            </Text>
            <Text style={styles.artista} numberOfLines={1}>
              {currentTrack ? currentTrack.artista : 'Esperando...'}
            </Text>
          </View>

          <View style={styles.acciones}>
            <TouchableOpacity 
              style={styles.btnAccion}
              onPress={handleLikePress}
            >
              <BlurView intensity={20} style={styles.btnAccionBlur}>
                <FontAwesome 
                  name={isLiked ? "heart" : "heart-o"} 
                  size={26} 
                  color={isLiked ? Colors.secundario : "white"} 
                />
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.btnAccion}
              onPress={handleSkipPress}
            >
              <BlurView intensity={20} style={styles.btnAccionBlur}>
                <Ionicons 
                  name={isSkipping ? "play-forward-sharp" : "play-forward-outline"} 
                  size={24} 
                  color={isSkipping ? Colors.secundario : "white"} 
                />
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={styles.duracion}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${getProgress() * 100}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressThumb, 
                    { left: `${getProgress() * 100}%` }
                  ]} 
                />
              </View>
              
              <View style={styles.tiemposContainer}>
                <Text style={styles.tiempoTexto}>{formatTime(currentTime)}</Text>
                <Text style={styles.tiempoTexto}>-{formatTime(getRemainingTime())}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    switch (selectedNav) {
      case 'letras':
        return <LetrasScreen initialTrack={currentTrack} initialTime={currentTime} />;
      case 'cola':
        return <ColaScreen />;
      case 'historial':
        return <HistorialScreen />;
      case 'busqueda':
        return <BusquedaScreen onShowModalChange={handleOpenAddSongModal} />;
      default:
        return null;
    }
  };

  // useEffect para obtener el establecimientoId y conectar al socket
  useEffect(() => {
    const fetchEstablecimientoAndConnect = async () => {
      try {
        // Obtener información del usuario autenticado
        await AuthService.loadStoredAuth();
        if (AuthService.isAuthenticated()) {
          const res = await AuthService.verifyToken();
          if (res && res.success && res.user && res.user.mesa_id_activa) {
            // Obtener el establecimiento_id desde la mesa
            const token = await AsyncStorage.getItem('token');
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
            
            // Obtener información de la mesa para saber el establecimiento_id
            const mesaRes = await fetch(`${API_URL}/establecimientos/mesa/${res.user.mesa_id_activa}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (mesaRes.ok) {
              const mesaData = await mesaRes.json();
              if (mesaData.success && mesaData.mesa) {
                const estabId = mesaData.mesa.establecimiento_id;
                setEstablecimientoId(estabId);
                
                // Conectar al socket
                MusicaSocketService.connect(estabId);
                
                // Obtener el estado actual de reproducción
                const playingRes = await fetch(`${API_URL}/musica/queue/current-playing?establecimientoId=${estabId}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (playingRes.ok) {
                  const playingData = await playingRes.json();
                  if (playingData.success && playingData.currentPlaying) {
                    setCurrentTrack(playingData.currentPlaying);
                    setCurrentTime(0);
                    setTotalDuration(playingData.currentPlaying.duracion || 0);
                    setIsPlaying(true);
                    
                    // Cargar el colaCancionId y el estado de votos
                    if (playingData.currentPlaying.cola_id) {
                      setColaCancionId(playingData.currentPlaying.cola_id);
                      await loadUserVoteStatus(playingData.currentPlaying.cola_id, token, API_URL);
                      await loadVoteCounts(playingData.currentPlaying.cola_id, token, API_URL);
                    }
                  }
                }
                
                // Suscribirse a eventos de reproducción
                unsubscribePlaybackUpdate.current = MusicaSocketService.on('playback_update', async (data) => {
                  if (data.currentTrack) {
                    setCurrentTrack(data.currentTrack);
                    setIsPlaying(data.isPlaying || false);
                    setCurrentTime(Math.floor((data.position || 0) / 1000));
                    setTotalDuration(data.currentTrack.duracion || 0);
                    
                    // Si la canción cambió, actualizar el colaCancionId y cargar votos
                    if (data.currentTrack.cola_id && data.currentTrack.cola_id !== colaCancionId) {
                      setColaCancionId(data.currentTrack.cola_id);
                      const token = await AsyncStorage.getItem('token');
                      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
                      await loadUserVoteStatus(data.currentTrack.cola_id, token, API_URL);
                      await loadVoteCounts(data.currentTrack.cola_id, token, API_URL);
                    }
                  }
                });
                
                unsubscribeTrackStarted.current = MusicaSocketService.on('track_started', async (data) => {
                  if (data.track) {
                    setCurrentTrack(data.track);
                    setIsPlaying(true);
                    setCurrentTime(0);
                    setTotalDuration(data.track.duracion || 0);
                    
                    // Actualizar colaCancionId y cargar votos para la nueva canción
                    if (data.track.cola_id) {
                      setColaCancionId(data.track.cola_id);
                      const token = await AsyncStorage.getItem('token');
                      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
                      await loadUserVoteStatus(data.track.cola_id, token, API_URL);
                      await loadVoteCounts(data.track.cola_id, token, API_URL);
                    }
                  }
                });
                
                unsubscribePlaybackState.current = MusicaSocketService.on('playback_state_change', (data) => {
                  setIsPlaying(data.isPlaying || false);
                  if (data.position !== undefined) {
                    setCurrentTime(Math.floor(data.position / 1000));
                  }
                });
                
                unsubscribeProgress.current = MusicaSocketService.on('playback_progress', (data) => {
                  if (data.position !== undefined && data.duration !== undefined) {
                    setCurrentTime(Math.floor(data.position / 1000));
                    setTotalDuration(Math.floor(data.duration / 1000));
                  }
                });
                
                // Suscribirse a actualizaciones de votos
                unsubscribeVotesUpdate.current = MusicaSocketService.on('votes_update', (data) => {
                  if (data.colaCancionId === colaCancionId) {
                    setLikesCount(data.likes);
                    setSkipsCount(data.skips);
                  }
                });
                
                // Suscribirse a evento de skip automático
                unsubscribeTrackSkipped.current = MusicaSocketService.on('track_skipped', async (data) => {
                  console.log('Canción skipeada automáticamente:', data);
                  // La canción fue skipeada, resetear estados
                  setIsLiked(false);
                  setIsSkipping(false);
                  setLikesCount(0);
                  setSkipsCount(0);
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo establecimiento:', error);
      }
    };
    
    fetchEstablecimientoAndConnect();
    
    // Cleanup
    return () => {
      if (unsubscribePlaybackUpdate.current) unsubscribePlaybackUpdate.current();
      if (unsubscribeTrackStarted.current) unsubscribeTrackStarted.current();
      if (unsubscribePlaybackState.current) unsubscribePlaybackState.current();
      if (unsubscribeProgress.current) unsubscribeProgress.current();
      if (unsubscribeVotesUpdate.current) unsubscribeVotesUpdate.current();
      if (unsubscribeTrackSkipped.current) unsubscribeTrackSkipped.current();
      MusicaSocketService.disconnect();
    };
  }, []);

  // NO usar contador local - el progreso viene del socket
  // La sincronización se maneja completamente desde el backend

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <View style={styles.contenido}>
        <View style={styles.secciones}>
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            {renderContent()}
          </Animated.View>
        </View>
        <View style={styles.navegacion}>
          <TouchableOpacity 
            style={[styles.navButton, selectedNav === 'letras' && styles.navButtonSelected]}
            onPress={() => handleNavPress('letras')}
          >
            <MaterialIcons 
              name="lyrics" 
              size={19} 
              color={selectedNav === 'letras' ? Colors.secundario : 'white'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, selectedNav === 'cola' && styles.navButtonSelected]}
            onPress={() => handleNavPress('cola')}
          >
            <MaterialIcons 
              name="playlist-play" 
              size={20} 
              color={selectedNav === 'cola' ? Colors.secundario : 'white'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, selectedNav === 'historial' && styles.navButtonSelected]}
            onPress={() => handleNavPress('historial')}
          >
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={selectedNav === 'historial' ? Colors.secundario : 'white'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, selectedNav === 'busqueda' && styles.navButtonSelected]}
            onPress={() => handleNavPress('busqueda')}
          >
            <Ionicons 
              name="search-outline" 
              size={20} 
              color={selectedNav === 'busqueda' ? Colors.secundario : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'green',
  },
  contenido: {
    display: 'flex',
    // backgroundColor: 'yellow',
    flex: 1,
  },
  secciones: {
    display: 'flex',
    flex: 1,
    // backgroundColor: 'blue',
    padding: 30,
    paddingBottom: 0
  },
  sonando: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    display: 'flex',
    flex: 1,
  },
  portada: {
    display: 'flex',
    width: '100%',
    aspectRatio: 1/1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: Colors.contenedor,
  },
  portadaImagen: {
    width: '100%',
    height: '100%',
  },
  infoCancion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  nombre: {
    fontFamily: 'Onest-Regular',
    fontSize: 20,
    color: Colors.textoPrincipal,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  artista: {
    fontFamily: 'Onest-Regular',
    fontSize: 18,
    color: Colors.textoSecundario,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  acciones: {
    display: 'flex',
    width: 'auto',
    flexDirection: 'row',
    gap: 10
  },
  btnAccion: {
    borderRadius: 99,
    overflow: 'hidden',
  },
  btnAccionBlur: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  duracion: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    width: '100%',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.progreso,
    borderRadius: 3,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secundario,
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -3.5,
    width: 10,
    height: 10,
    backgroundColor: Colors.secundario,
    borderRadius: 10,
    marginLeft: -10,
  },
  tiemposContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  tiempoTexto: {
    fontFamily: 'Onest-Regular',
    fontSize: 14,
    color: Colors.textoSecundario,
  },
  navegacion: { 
    // backgroundColor: 'red',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 99,
  },
  navButtonSelected: {
    backgroundColor: Colors.tabSeleccionado,
  },
  titulo: {
    fontFamily: 'Michroma-Regular',
    fontWeight: '900',
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  },
});

export default MusicaScreen;
