import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AjustesScreen from './AjustesScreen';

const MusicaScreen = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

  // Estados para los botones
  const [isLiked, setIsLiked] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  
  // Estados para la duración de la canción
  // Configura aquí los tiempos en formato minutos.segundos (ej: 1.24 = 1 minuto 24 segundos)
  const [currentTimeStr, setCurrentTimeStr] = useState("2"); // Tiempo actual
  const [totalDurationStr, setTotalDurationStr] = useState("3"); // Duración total
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Función para convertir "minutos.segundos" a segundos totales
  const parseTimeToSeconds = (timeStr) => {
    const parts = timeStr.split('.');
    const minutes = parseInt(parts[0]);
    
    if (parts.length === 1) {
      // Solo minutos (ej: "3" = 3 minutos)
      return minutes * 60;
    } else {
      // Minutos y segundos (ej: "1.5" = 1 minuto 30 segundos)
      const secondsPart = parts[1];
      if (secondsPart.length === 1) {
        // Un dígito después del punto = décimas de minuto (ej: "1.5" = 1.5 minutos = 90 segundos)
        const decimalMinutes = parseFloat(timeStr);
        return Math.round(decimalMinutes * 60);
      } else {
        // Dos dígitos después del punto = segundos (ej: "1.24" = 1 minuto 24 segundos)
        const seconds = parseInt(secondsPart);
        return minutes * 60 + seconds;
      }
    }
  };
  
  // Convertir a segundos totales para cálculos
  const currentTime = parseTimeToSeconds(currentTimeStr);
  const totalDuration = parseTimeToSeconds(totalDurationStr);

  // Función para formatear tiempo (segundos a mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para calcular el progreso (0-1)
  const getProgress = () => {
    return currentTime / totalDuration;
  };

  // Función para calcular el tiempo restante
  const getRemainingTime = () => {
    return totalDuration - currentTime;
  };

  // Función para convertir segundos a formato "minutos.segundos"
  const secondsToTimeStr = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}.${secs.toString().padStart(2, '0')}`;
  };

  // Simular reproducción (para demo)
  useEffect(() => {
    let interval;
    if (isPlaying && currentTime < totalDuration) {
      interval = setInterval(() => {
        const newTime = currentTime + 1;
        setCurrentTimeStr(secondsToTimeStr(newTime));
        
        // Verificar si llegamos al final
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
        {/* <View style={styles.sonando}>
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
              onPress={() => setIsLiked(!isLiked)}
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
              onPress={() => setIsSkipping(!isSkipping)}
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
        </View> */}
        </View>
        <View style={styles.navegacion}>
          <TouchableOpacity style={styles.navButton}>
          <MaterialIcons name="lyrics" size={19} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton}>
          <MaterialIcons name="playlist-play" size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="time-outline" size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="search-outline" size={20} color="white" />
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
    // backgroundColor: 'blue'
  },
  sonando: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    display: 'flex',
    flex: 1,
    padding: 30
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
    // backgroundColor: 'transparente',
    // backgroundColor: Colors.btnSeleccionado,
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
