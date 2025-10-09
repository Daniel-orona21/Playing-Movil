import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const QrScreen = () => {
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
      <Text style={styles.titulo}>¡BIENVENIDO!</Text>
      <View style={styles.contenedorLogin}>
        <Text style={styles.subtitulo}>Escanea el QR de tu mesa</Text>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => {
          }}
        >
          <FontAwesome name="qrcode" size={50} color="black" />
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </View>
  );

  
};

const styles = StyleSheet.create({
    container: {
        color: 'white',
        flex: 1,
        display: 'flex',
        backgroundColor: Colors.fondo,
        alignItems: 'center',
        justifyContent: 'center',
      },
      titulo: {
        fontFamily: 'Michroma-Regular',
        fontWeight: '900',
        position: 'absolute',
        fontSize: 32,
        color: 'white',
        top: '10%',
      },
      subtitulo: {
        fontFamily: 'Michroma-Regular',
        color: 'white',
        fontSize: 20,
        textAlign: 'center'
      },
      logo: {
        position: 'absolute',
        marginTop: '100%',
        transform: [
          { scale: 1.05 }
        ],
        overflow: 'visible',
        width: '100%',
        objectFit: 'contain'
      },
      contenedorLogin: {
        display: 'flex',
        flexDirection: 'column',
        gap: 60,
        alignItems: 'center',
        justifyContent: 'center',
      },
      qrButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 0,
        height: 80,
        width: 80,
        borderRadius: 99,
      },
      googleButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        fontFamily: 'Onest-Regular',
        color: 'white'
      },
});

export default QrScreen;
