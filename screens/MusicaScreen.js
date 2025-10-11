import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';

const MusicaScreen = () => {
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
      <View style={styles.contenido}>
        <View style={styles.secciones}>
          <View style={styles.portada}></View>
          <View style={styles.infoCancion}></View>
          <View style={styles.acciones}></View>
          <View style={styles.duracion}></View>
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
    // backgroundColor: 'blue',
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
