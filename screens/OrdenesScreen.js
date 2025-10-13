import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

const OrdenesScreen = ({ onShowMeseroModalChange }) => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownIntervalRef = useRef(null);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const abrirMenu = async () => {
    const url = 'https://vips.com.mx/menu/';
    
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#ffffff',
        showTitle: true,
        enableBarCollapsing: false,
        showInRecents: false
      });
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al abrir el menú');
    }
  };

  const startCooldown = () => {
    setIsCooldownActive(true);
    setCooldownTime(60); // 60 segundos = 1 minuto
    
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownTime((prevTime) => {
        if (prevTime <= 1) {
          setIsCooldownActive(false);
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleLlamarMesero = () => {
    if (!isCooldownActive) {
      onShowMeseroModalChange(true, startCooldown);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup del timer cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <View style={styles.sinOrden}>
        <Text style={styles.tituloSin}>Aún no tienes una orden activa</Text>
        <View style={styles.contenidoSinOrden}>
        <View style={styles.ImgSin}>
          <Image 
            source={require('../assets/imagenes/cubiertos.png')} 
            style={styles.cubiertos}
          />
        </View>
        <TouchableOpacity style={styles.boton1} onPress={abrirMenu}>
          <MaterialCommunityIcons style={styles.icono} name="book-open" size={24} color="rgba(255, 255, 255, 0.56)" />
          <Text style={styles.textoBtn}>Ver el menú</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.boton1, 
            isCooldownActive && styles.botonDeshabilitado
          ]} 
          onPress={handleLlamarMesero}
          disabled={isCooldownActive}
        >
          <MaterialCommunityIcons 
            style={styles.icono} 
            name={"human-greeting-variant"} 
            size={24} 
            color={isCooldownActive ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.56)"} 
          />
          <Text style={[
            styles.textoBtn,
            isCooldownActive && styles.textoDeshabilitado
          ]}>
            {isCooldownActive ? `Esperar ${formatTime(cooldownTime)}` : 'Llamar al mesero'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boton1}>
        <Ionicons style={styles.icono} name="timer-outline" size={24} color="rgba(255, 255, 255, 0.56)" />
          <Text style={styles.textoBtn}>Simular orden</Text>
        </TouchableOpacity>
        </View>
      </View>
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sinOrden: {
    paddingTop: 10,
    // borderWidth: 1,
    // borderColor: 'lime',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tituloSin: {
    fontFamily: 'Michroma-Regular',
    fontWeight: '900',
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  contenidoSinOrden: {
    // borderWidth: 1,
    // borderColor: 'red',
    flex: 1,
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  ImgSin: {
    aspectRatio: 1/1,
    width: '70%',
    backgroundColor: Colors.contenedor,
    opacity: .5,
    position: 'relative',
    boxSizing: 'border-box',
    borderRadius: 30
  },
  cubiertos: {
    width: '100%',
    height: '100%'
  },
  boton1: {
    display: 'flex',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 99,
    backgroundColor: Colors.botonPrincipal,
    alignItems: 'center'
  },
  icono: {
    position: 'absolute',
    left: 20,
  },
  textoBtn: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
    fontSize: 20
  },
  botonDeshabilitado: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  textoDeshabilitado: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 18,
  }
});

export default OrdenesScreen;
