import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect, useRef } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

const QrScreen = () => {
    const [fontsLoaded, fontError] = useFonts({
        'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
        'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
        'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
      });

    // Camera state management
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('back');
    const [cameraReady, setCameraReady] = useState(false);
    
    // Animation values for smooth transitions
    const normalOpacity = useRef(new Animated.Value(1)).current;
    const cameraOpacity = useRef(new Animated.Value(0)).current;

      const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
          await SplashScreen.hideAsync();
        }
      }, [fontsLoaded, fontError]);

    // Request camera permission if not already granted
    useEffect(() => {
      if (!permission?.granted) {
        requestPermission();
      }
    }, [permission, requestPermission]);

    // Animation functions for smooth transitions
    const activateCamera = () => {
      Animated.parallel([
        Animated.timing(normalOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cameraOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    };

    const deactivateCamera = () => {
      Animated.parallel([
        Animated.timing(cameraOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(normalOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    };
    
      if (!fontsLoaded && !fontError) {
        return null;
      }

  return (
    <View style={styles.container}>
      {/* Normal state container */}
      <Animated.View style={[styles.container, { opacity: normalOpacity }]}>
        <Text style={styles.titulo}>¡BIENVENIDO!</Text>
        <View style={styles.contenedorLogin}>
          <Text style={styles.subtitulo}>Escanea el QR de tu mesa</Text>
          <View style={styles.contenedorQR}>
            <Image source={require('../assets/imagenes/qr.png')} style={styles.qr} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => {
            if (permission?.granted) {
              setIsCameraActive(true);
              activateCamera();
              setTimeout(() => setCameraReady(true), 100);
            } else {
              console.log('Sin permiso para la cámara');
              requestPermission();
            }
          }}
        >
          <FontAwesome name="qrcode" size={50} style={styles.icono} />
        </TouchableOpacity>
      </Animated.View>

      {/* Camera state container */}
      <Animated.View style={[styles.container, { opacity: cameraOpacity, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
        {permission?.granted && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            isActive={isCameraActive}
            onCameraReady={() => {
              console.log('Camera is ready');
              setCameraReady(true);
            }}
          />
        )}
        <Text style={styles.titulo}>¡BIENVENIDO!</Text>
        <View style={styles.contenedorLogin}>
          <Text style={styles.subtitulo}>Escanea el QR de tu mesa</Text>
          <View style={styles.contenedorQR}>
            <Image source={require('../assets/imagenes/marco.png')} style={styles.marco} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => {
            setIsCameraActive(false);
            setCameraReady(false);
            deactivateCamera();
          }}
        >
          <Ionicons name="close" size={50} style={styles.icono} />
        </TouchableOpacity>
      </Animated.View>
      
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
      contenedorQR: {
        display: 'flex',
        aspectRatio: 1/1,
        width: '70%',
        marginTop: 10,
        position: 'relative'
      },
      qr: {
        position: 'relative',
        width: '100%',
        height: '100%',
        opacity: .5
      },
      marco: {
        position: 'relative',
        width: '100%',
        height: '100%',
        // opacity: .5
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
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
      },
      icono: {
        // marginBottom: -5,
      },
      qrButton: {
        position: 'absolute',
        bottom: '15%',
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
