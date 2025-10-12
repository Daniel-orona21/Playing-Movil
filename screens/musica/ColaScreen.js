import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

// Datos de ejemplo para la cola de reproducción
const queueSongs = [
  { id: 'q1', title: 'Cancion en Cola 1', artist: 'Artista 1', genre: 'Pop' },
  { id: 'q2', title: 'Hit en Cola 2', artist: 'Artista 2', genre: 'Rock' },
  { id: 'q3', title: 'Ritmo en Cola 3', artist: 'Artista 3', genre: 'Reggaeton' },
  { id: 'q4', title: 'Flow en Cola 4', artist: 'Artista 4', genre: 'Rap' },
  { id: 'q5', title: 'Beat en Cola 5', artist: 'Artista 5', genre: 'Electrónica' },
  { id: 'q6', title: 'House en Cola 6', artist: 'Artista 6', genre: 'House' },
  { id: 'q7', title: 'Melodia en Cola 7', artist: 'Artista 7', genre: 'Regional' },
  { id: 'q8', title: 'Urbano en Cola 8', artist: 'Artista 8', genre: 'Urbano' },
];

export default function ColaScreen() {
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
      <Text style={styles.texto}>A continuación...</Text>
      <ScrollView style={styles.scroll}>
        <View style={styles.queueContainer}>
          {queueSongs.map((song) => (
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
          {queueSongs.length === 0 && (
            <Text style={styles.noResultsText}>No hay canciones en la cola</Text>
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