import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

// Datos de ejemplo para la canción actual
const currentSong = {
  id: 'current1',
  title: 'Cancion 23',
  artist: 'Artista de prueba',
  genre: 'Pop'
};

// Letras de ejemplo
const lyrics = [
  'Letra letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
  'Letra letra letra letra letra letra letra letra',
];

export default function LetrasScreen() {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../../assets/fonts/Onest-Bold.ttf'),
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
    <View style={styles.contenido} onLayout={onLayoutRootView}>
      {/* Header con información de la canción */}
      <View style={styles.songHeader}>
        <View style={styles.albumArt}>
          <MaterialIcons name="music-note" size={20} color="white" />
        </View>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{currentSong.title}</Text>
          <Text style={styles.songArtist}>{currentSong.artist}</Text>
        </View>
      </View>

      {/* Área de letras */}
      <ScrollView style={styles.lyricsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.lyricsContent}>
          {lyrics.map((line, index) => (
            <Text 
              key={index} 
              style={[
                styles.lyricsLine,
                index === 0 && styles.currentLyricsLine
              ]}
            >
              {line}
            </Text>
          ))}
        </View>
      </ScrollView>
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
  lyricsContainer: {
    flex: 1,
  },
  lyricsContent: {
    // paddingBottom: 50,
  },
  lyricsLine: {
    color: Colors.textoSecundario,
    fontSize: 19,
    fontFamily: 'Onest-Regular',
    lineHeight: 28,
    marginBottom: 12,
    textAlign: 'left',
  },
  currentLyricsLine: {
    fontSize: 22,
    fontFamily: 'Onest-Bold',
    color: 'white',
  },
});