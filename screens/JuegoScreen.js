import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';

const JuegoScreen = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

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
      <View style={styles.ImgSin}>
          <Ionicons name="game-controller" size={104} color="white" />
        </View>
      <Text style={styles.titulo}>No hay ningún juego activo</Text>
      <Text style={styles.subtitulo}>Espera a que el restaurante inicie la actividad para participar</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20
  },
  ImgSin: {
    aspectRatio: 1/1,
    width: '70%',
    backgroundColor: Colors.contenedor,
    opacity: .5,
    position: 'relative',
    boxSizing: 'border-box',
    borderRadius: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: 'Michroma-Regular',
    fontWeight: '900',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  subtitulo: {
    fontFamily: 'Michroma-Regular',
    fontWeight: '900',
    fontSize: 14,
    color: Colors.textoSecundario,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default JuegoScreen;
