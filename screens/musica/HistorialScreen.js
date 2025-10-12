import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

// Datos de ejemplo para el historial de canciones
const historySongs = [
  { id: 'h1', title: 'Cancion Historial 1', artist: 'Artista 1', genre: 'Pop' },
  { id: 'h2', title: 'Hit Historial 2', artist: 'Artista 2', genre: 'Rock' },
  { id: 'h3', title: 'Ritmo Historial 3', artist: 'Artista 3', genre: 'Reggaeton' },
  { id: 'h4', title: 'Flow Historial 4', artist: 'Artista 4', genre: 'Rap' },
  { id: 'h5', title: 'Beat Historial 5', artist: 'Artista 5', genre: 'Electrónica' },
  { id: 'h6', title: 'House Historial 6', artist: 'Artista 6', genre: 'House' },
  { id: 'h7', title: 'Melodia Historial 7', artist: 'Artista 7', genre: 'Regional' },
  { id: 'h8', title: 'Urbano Historial 8', artist: 'Artista 8', genre: 'Urbano' },
];

export default function HistorialScreen() {
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
      <Text style={styles.texto}>Historial</Text>
      <ScrollView style={styles.scroll}>
        <View style={styles.historyContainer}>
          {historySongs.map((song) => (
            <View key={song.id} style={styles.songResultButtonWrapper}>
              <BlurView intensity={20} tint='dark' style={styles.songResultButton}>
                <View style={styles.portada}>
                  <MaterialIcons name="music-note" size={15} color="gray" />
                </View>
                <View style={styles.infoCancion}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
              </BlurView>
            </View>
          ))}
          {historySongs.length === 0 && (
            <Text style={styles.noResultsText}>No hay canciones en el historial</Text>
          )}
        </View>
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
    // borderWidth: 1,
    // borderColor: 'pink',
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
    borderRadius: 10
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
});