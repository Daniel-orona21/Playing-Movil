import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
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
  
  // Estado para la navegación
  const [selectedNav, setSelectedNav] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current; 

  // Funciones para el modal de agregar canción
  const handleOpenAddSongModal = (song) => {
    if (onShowModalChange) {
      onShowModalChange(true, song); 
    }
  };

  
  const [currentTimeStr, setCurrentTimeStr] = useState("2"); // Tiempo actual
  const [totalDurationStr, setTotalDurationStr] = useState("3"); // Duración total
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Función para convertir "minutos.segundos" a segundos totales
  const parseTimeToSeconds = (timeStr) => {
    const parts = timeStr.split('.');
    const minutes = parseInt(parts[0]);
    
    if (parts.length === 1) {
      return minutes * 60;
    } else {
      const secondsPart = parts[1];
      if (secondsPart.length === 1) {
        const decimalMinutes = parseFloat(timeStr);
        return Math.round(decimalMinutes * 60);
      } else {
        const seconds = parseInt(secondsPart);
        return minutes * 60 + seconds;
      }
    }
  };
  
  const currentTime = parseTimeToSeconds(currentTimeStr);
  const totalDuration = parseTimeToSeconds(totalDurationStr);

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

  const handleLikePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLiked(!isLiked);
  };

  const handleSkipPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSkipping(!isSkipping);
  };

  const renderContent = () => {
    if (selectedNav === null) {
      return (
        <View style={styles.sonando}>
          <BlurView intensity={10} style={styles.portada}>
            <MaterialIcons name="music-note" size={44} color="gray" />
          </BlurView>
          <View style={styles.infoCancion}>
            <Text style={styles.nombre}>Cancion 23</Text>
            <Text style={styles.artista}>Artista de prueba</Text>
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
        return <LetrasScreen />;
      case 'cola':
        return <ColaScreen />;
      case 'historial':
        return <HistorialScreen />;
      case 'busqueda':
        return <BusquedaScreen onOpenAddSongModal={handleOpenAddSongModal} />;
      default:
        return null;
    }
  };

  // Función para convertir segundos a formato "minutos.segundos"
  const secondsToTimeStr = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}.${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval;
    if (isPlaying && currentTime < totalDuration) {
      interval = setInterval(() => {
        const newTime = currentTime + 1;
        setCurrentTimeStr(secondsToTimeStr(newTime));
        
        if (newTime >= totalDuration) {
          setIsPlaying(false);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, totalDuration]);

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
    backgroundColor: 'transparent',
  },
  contenido: {
    display: 'flex',
    flex: 1,
  },
  secciones: {
    display: 'flex',
    flex: 1,
    // backgroundColor: 'blue',
    padding: 30
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
    width: '80%',
    aspectRatio: 1/1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: Colors.contenedor,
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
  },
  artista: {
    fontFamily: 'Onest-Regular',
    fontSize: 20,
    color: Colors.textoSecundario,
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
