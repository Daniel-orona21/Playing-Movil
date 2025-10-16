import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect, useRef } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AuthService from '../services/AuthService';

const QrScreen = ({ navigation }) => {
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
    const [shouldRenderCamera, setShouldRenderCamera] = useState(false);
    
    // Animation values for smooth transitions
    const normalOpacity = useRef(new Animated.Value(1)).current;
    const cameraOpacity = useRef(new Animated.Value(0)).current;
    
    // QR scanning state
    const [scanned, setScanned] = useState(false);
    
    // Ref to track if we're navigating to prevent camera reactivation
    const isNavigating = useRef(false);

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

    // Al entrar a la pantalla: si ya tiene mesa asignada, redirigir a Layout
    useFocusEffect(
      useCallback(() => {
        let cancelled = false;
        (async () => {
          try {
            await AuthService.loadStoredAuth();
            if (AuthService.isAuthenticated()) {
              // fuerza lectura desde BD con el nuevo /profile
              const res = await AuthService.verifyToken();
              if (!cancelled && res && res.success && res.user && res.user.mesa_id_activa) {
                navigation.reset({ index: 0, routes: [{ name: 'Layout' }] });
                return;
              }
            }
          } catch (e) {
            // ignore
          }
        })();
        return () => { cancelled = true; };
      }, [navigation])
    );

    // Use useFocusEffect only for cleanup when screen loses focus
    useFocusEffect(
      useCallback(() => {
        // Reset navigation flag when screen gains focus
        isNavigating.current = false;
        
        // Cleanup function to stop camera when screen loses focus
        return () => {
          console.log('QrScreen losing focus - completely unmounting camera');
          setIsCameraActive(false);
          setCameraReady(false);
          setScanned(false);
          setShouldRenderCamera(false);
          isNavigating.current = false;
          // Reset animations
          normalOpacity.setValue(1);
          cameraOpacity.setValue(0);
        };
      }, [normalOpacity, cameraOpacity])
    );

    // Initialize screen state only once when component mounts
    useEffect(() => {
      console.log('QrScreen mounted - initializing camera');
      // Initialize camera but keep it inactive
      setShouldRenderCamera(true);
      setIsCameraActive(false);
      setCameraReady(false);
      setScanned(false);
      normalOpacity.setValue(1);
      cameraOpacity.setValue(0);
    }, [normalOpacity, cameraOpacity]);

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

    // Handle QR code scanning
    const handleBarcodeScanned = async ({ type, data }) => {
      if (!scanned && !isNavigating.current) {
        isNavigating.current = true;
        setScanned(true);
        console.log('QR Code scanned:', data);
        
        // Haptic feedback for successful scan
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Immediately and aggressively deactivate camera
        setIsCameraActive(false);
        setCameraReady(false);
        setShouldRenderCamera(false);
        
        // Force stop camera immediately
        console.log('Force unmounting camera after QR scan');
        
        try {
          let payload = null;
          try { payload = JSON.parse(data); } catch {}
          if (!payload || !payload.e || !payload.m) {
            console.log('QR inválido');
            navigation.navigate('Layout');
            return;
          }
          const token = await AsyncStorage.getItem('token');
          const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/auth$/, '').replace(/\/$/, '') || 'http://localhost:3000/api';
          const linkUrl = `${API_URL}/establecimientos/qr/vincular`;
          console.log('Linking URL:', linkUrl);
          const res = await fetch(linkUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: JSON.stringify({ e: payload.e, m: payload.m })
          });
          const ct = res.headers.get('content-type') || '';
          const bodyText = await res.text();
          if (ct.includes('application/json')) {
            try { console.log('Vinculación QR:', JSON.parse(bodyText)); } catch { console.log('Vinculación QR (raw):', bodyText); }
          } else {
            console.log('Respuesta no JSON:', bodyText.slice(0, 200));
          }
        } catch (e) {
          console.log('Error vinculando QR', e);
        }
        navigation.navigate('Layout');
      }
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
            if (permission?.granted && !isNavigating.current) {
              setScanned(false);
              setIsCameraActive(true);
              activateCamera();
              setTimeout(() => setCameraReady(true), 100);
            } else if (!permission?.granted) {
              console.log('Sin permiso para la cámara');
              requestPermission();
            } else {
              console.log('Navigation in progress - camera activation blocked');
            }
          }}
        >
          <FontAwesome name="qrcode" size={50} style={styles.icono} />
        </TouchableOpacity>
      </Animated.View>

      {/* Camera state container */}
      <Animated.View style={[styles.container, { opacity: cameraOpacity, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
        {permission?.granted && shouldRenderCamera && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            isActive={isCameraActive}
            onCameraReady={() => {
              console.log('Camera is ready');
              setCameraReady(true);
            }}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
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
            setScanned(false);
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
        backgroundColor: 'black',
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
