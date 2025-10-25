import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, ActivityIndicator } from 'react-native';
import MusicaScreen from './MusicaScreen';
import JuegoScreen from './JuegoScreen';
import OrdenesScreen from './OrdenesScreen';
import AjustesScreen from './AjustesScreen';
import { Colors } from '../constants/Colors';
import { BlurView } from 'expo-blur';
import Toast from '../components/Toast';
import * as Haptics from 'expo-haptics'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import AuthService from '../services/AuthService';

const Tab = createBottomTabNavigator();

const LayoutScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = React.useState('Música');
  const [displayedTab, setDisplayedTab] = React.useState('Música');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const imageFadeAnim = React.useRef(new Animated.Value(1)).current;
  const [showMusicaAddSongModal, setShowMusicaAddSongModal] = React.useState(false);
  const [selectedSongForModal, setSelectedSongForModal] = React.useState(null);
  const [isAddingSong, setIsAddingSong] = React.useState(false);
  const [showMeseroModal, setShowMeseroModal] = React.useState(false);
  const [meseroConfirmCallback, setMeseroConfirmCallback] = React.useState(null);
  const [showCuentaModal, setShowCuentaModal] = React.useState(false);
  const [showExitRestaurantModal, setShowExitRestaurantModal] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [exitRestaurantCallback, setExitRestaurantCallback] = React.useState(null);
  const [logoutCallback, setLogoutCallback] = React.useState(null);
  const overlayFadeAnim = React.useRef(new Animated.Value(0)).current;
  const meseroOverlayFadeAnim = React.useRef(new Animated.Value(0)).current;
  const cuentaOverlayFadeAnim = React.useRef(new Animated.Value(0)).current;
  const exitRestaurantOverlayFadeAnim = React.useRef(new Animated.Value(0)).current;
  const logoutOverlayFadeAnim = React.useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const socketRef = React.useRef(null);
  const watchdogRef = React.useRef(null);

  const handleShowMusicaAddSongModalChange = (isVisible, songData) => {
    if (isVisible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowMusicaAddSongModal(isVisible);
    setSelectedSongForModal(songData);
  };

  const handleCancelAddSongGlobal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMusicaAddSongModal(false);
    setSelectedSongForModal(null);
  };

  const handleShowToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleHideToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const handleAddSongGlobal = async () => {
    if (!selectedSongForModal || isAddingSong) return;

    // console.log('🎵 Adding song:', selectedSongForModal);
    
    setIsAddingSong(true);

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
    
    try {
      await AuthService.loadStoredAuth();
      const user = AuthService.getCurrentUser();
      if (!user) {
        handleShowToast('Error: Usuario no autenticado');
        setShowMusicaAddSongModal(false);
        setIsAddingSong(false);
        return;
      }

      // Obtener establecimientoId
      const res = await AuthService.verifyToken();
      if (!res || !res.success || !res.user || !res.user.mesa_id_activa) {
        handleShowToast('Error: No se pudo identificar el establecimiento');
        setShowMusicaAddSongModal(false);
        setIsAddingSong(false);
        return;
      }

      const token = await AsyncStorage.getItem('token');
      const mesaRes = await fetch(`${API_URL}/establecimientos/mesa/${res.user.mesa_id_activa}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!mesaRes.ok) {
        handleShowToast('Error: No se pudo obtener información del establecimiento');
        setShowMusicaAddSongModal(false);
        setIsAddingSong(false);
        return;
      }

      const mesaData = await mesaRes.json();
      if (!mesaData.success || !mesaData.mesa) {
        handleShowToast('Error: No se pudo obtener información del establecimiento');
        setShowMusicaAddSongModal(false);
        setIsAddingSong(false);
        return;
      }

      const establecimientoId = mesaData.mesa.establecimiento_id;

      // Preparar el body del request
      const requestBody = {
        spotify_id: selectedSongForModal.spotify_id,
        titulo: selectedSongForModal.titulo,
        artista: selectedSongForModal.artista,
        album: selectedSongForModal.album || '',
        duracion: selectedSongForModal.duracion || 0,
        imagen_url: selectedSongForModal.imagen_url || null,
        genero: selectedSongForModal.genero || null,
        preview_url: selectedSongForModal.preview_url || null,
        establecimientoId: establecimientoId,
        usuarioId: user.id
      };

      // Agregar a la cola
      const response = await fetch(`${API_URL}/musica/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      // console.log('📡 Response:', { status: response.status, data });

      if (response.ok && data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleShowToast(`"${selectedSongForModal.titulo}" agregada a la fila.`);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // console.error('Error from API:', data);
        
        // Manejar errores específicos
        if (data.blocked) {
          handleShowToast('Esta canción está bloqueada por el establecimiento');
        } else if (data.limitType === 'song_in_queue') {
          handleShowToast(data.error || 'Esta canción ya está en la cola');
        } else if (data.limitType === 'song_play_limit') {
          handleShowToast(data.error);
        } else if (data.limitType === 'user_request_limit') {
          handleShowToast(data.error);
        } else {
          handleShowToast(data.error || 'No se pudo agregar la canción');
        }
      }
    } catch (error) {
      console.error('Error agregando canción:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleShowToast('Error al agregar la canción a la cola');
    } finally {
      setIsAddingSong(false);
      setShowMusicaAddSongModal(false);
      setSelectedSongForModal(null);
    }
  };

  const handleShowMeseroModalChange = (isVisible, onConfirmCallback) => {
    if (isVisible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowMeseroModal(isVisible);
    if (onConfirmCallback) {
      setMeseroConfirmCallback(() => onConfirmCallback);
    }
  };

  const handleCancelMesero = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMeseroModal(false);
  };

  const handleConfirmMesero = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMeseroModal(false);
    handleShowToast('¡Mesero notificado! Llegará pronto a tu mesa');
    
    // Ejecutar callback si existe (para iniciar cooldown)
    if (meseroConfirmCallback) {
      meseroConfirmCallback();
      setMeseroConfirmCallback(null);
    }
  };

  const handleShowCuentaModalChange = (isVisible) => {
    setShowCuentaModal(isVisible);
  };

  const handleCancelCuenta = () => {
    setShowCuentaModal(false);
  };

  const handleSalir = () => {
    setShowCuentaModal(false);
    navigation.navigate('Qr');
  };

  // Handlers para modales de AjustesScreen
  const handleShowExitRestaurantModalChange = (isVisible, onConfirmCallback) => {
    if (isVisible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowExitRestaurantModal(isVisible);
    if (onConfirmCallback) {
      setExitRestaurantCallback(() => onConfirmCallback);
    }
  };

  const handleCancelExitRestaurant = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExitRestaurantModal(false);
  };

  const handleConfirmExitRestaurant = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowExitRestaurantModal(false);
    
    // Ejecutar callback si existe
    if (exitRestaurantCallback) {
      exitRestaurantCallback();
      setExitRestaurantCallback(null);
    }
  };

  React.useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
        const base = API_URL.replace('/api','');
        // Opcional: si guardas el id de usuario en storage, puedes unir al room específico
        const user = await AsyncStorage.getItem('user');
        const userId = user ? JSON.parse(user)?.id : null;
        socketRef.current = io(base, { transports: ['websocket'], auth: { token }, autoConnect: true, reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 500, reconnectionDelayMax: 5000 });
        const joinRoom = () => { if (userId) socketRef.current.emit('join_user', userId); };
        socketRef.current.on('connect', joinRoom);
        socketRef.current.on('reconnect', joinRoom);
        socketRef.current.on('user:kicked', () => {
          // Redirigir a escaneo
          setActiveTab('Ajustes');
          navigation.navigate('Qr');
        });
        socketRef.current.on('disconnect', async () => {
          // Fallback inmediato: verificar estado de mesa y redirigir si es necesario
          try {
            await AuthService.loadStoredAuth();
            if (AuthService.isAuthenticated()) {
              const res = await AuthService.verifyToken();
              if (!res?.user?.mesa_id_activa) {
                navigation.navigate('Qr');
              }
            }
          } catch {}
        });
        // Watchdog: verificación periódica como seguro ante sockets caídos
        watchdogRef.current = setInterval(async () => {
          try {
            await AuthService.loadStoredAuth();
            if (AuthService.isAuthenticated()) {
              const res = await AuthService.verifyToken();
              if (!res?.user?.mesa_id_activa) {
                navigation.navigate('Qr');
              }
            }
          } catch {}
        }, 20000);
      } catch {}
    })();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, []);

  const handleShowLogoutModalChange = (isVisible, onConfirmCallback) => {
    if (isVisible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowLogoutModal(isVisible);
    if (onConfirmCallback) {
      setLogoutCallback(() => onConfirmCallback);
    }
  };

  const handleCancelLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowLogoutModal(false);
    
    // Ejecutar callback si existe
    if (logoutCallback) {
      logoutCallback();
      setLogoutCallback(null);
    }
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imageFadeAnim, {
        toValue: activeTab === 'Música' ? 1 : 0, 
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); 

  React.useEffect(() => {
    Animated.timing(overlayFadeAnim, {
      toValue: showMusicaAddSongModal ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showMusicaAddSongModal, overlayFadeAnim]);

  React.useEffect(() => {
    Animated.timing(meseroOverlayFadeAnim, {
      toValue: showMeseroModal ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showMeseroModal, meseroOverlayFadeAnim]);

  React.useEffect(() => {
    Animated.timing(cuentaOverlayFadeAnim, {
      toValue: showCuentaModal ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showCuentaModal, cuentaOverlayFadeAnim]);

  React.useEffect(() => {
    Animated.timing(exitRestaurantOverlayFadeAnim, {
      toValue: showExitRestaurantModal ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showExitRestaurantModal, exitRestaurantOverlayFadeAnim]);

  React.useEffect(() => {
    Animated.timing(logoutOverlayFadeAnim, {
      toValue: showLogoutModal ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showLogoutModal, logoutOverlayFadeAnim]);

  const handleTabChange = (newTab) => {
    if (activeTab === newTab) {
      return;
    }
    
    // Cambiar selección del tab inmediatamente (sin esperar animación)
    setActiveTab(newTab);
    
    // Fade out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(imageFadeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Cambiar vista mostrada y fade in
      setDisplayedTab(newTab);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(imageFadeAnim, {
          toValue: newTab === 'Música' ? 1 : 0, 
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Renderizar todos los tabs pero solo mostrar el activo (preserva estado)
  const renderAllScreens = () => {
    return (
      <>
        <View style={[styles.screenWrapper, displayedTab !== 'Música' && styles.hiddenScreen]} pointerEvents={displayedTab === 'Música' ? 'auto' : 'none'}>
          <MusicaScreen onShowModalChange={handleShowMusicaAddSongModalChange} />
        </View>
        <View style={[styles.screenWrapper, displayedTab !== 'Juego' && styles.hiddenScreen]} pointerEvents={displayedTab === 'Juego' ? 'auto' : 'none'}>
          <JuegoScreen />
        </View>
        <View style={[styles.screenWrapper, displayedTab !== 'Ordenes' && styles.hiddenScreen]} pointerEvents={displayedTab === 'Ordenes' ? 'auto' : 'none'}>
          <OrdenesScreen onShowMeseroModalChange={handleShowMeseroModalChange} onShowCuentaModalChange={handleShowCuentaModalChange} />
        </View>
        <View style={[styles.screenWrapper, displayedTab !== 'Ajustes' && styles.hiddenScreen]} pointerEvents={displayedTab === 'Ajustes' ? 'auto' : 'none'}>
          <AjustesScreen 
            navigation={navigation}
            onShowExitRestaurantModalChange={handleShowExitRestaurantModalChange}
            onShowLogoutModalChange={handleShowLogoutModalChange}
          />
        </View>
      </>
    );
  };

  const contentScale = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const contentOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });


  const TabButton = ({ tabName, iconName, label, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected
      ]}
      onPress={onPress}
    >
      <Ionicons 
        name={iconName} 
        size={20} 
        color={isSelected ? Colors.secundario : 'white'} 
      />
      <Text style={[styles.tabLabel, { color: isSelected ? Colors.secundario : 'white' }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../assets/imagenes/logo-7.png')} 
        style={[styles.backgroundImage, { opacity: imageFadeAnim }]}
        resizeMode="cover"
      />
      
      <BlurView intensity={0} style={styles.blurContainer}>
        <Animated.View style={[styles.screenContainer, { opacity: contentOpacity, transform: [{ scale: contentScale }] }]}>
          {renderAllScreens()}
        </Animated.View>

        <View style={styles.tabBar}>
        <BlurView intensity={15} style={styles.mainTabsContainer}>
          <TabButton
            tabName="Música"
            iconName="musical-notes"
            label="Música"
            isSelected={activeTab === 'Música'}
            onPress={() => handleTabChange('Música')}
          />
            <TabButton
              tabName="Juego"
              iconName="dice"
              label="Juego"
              isSelected={activeTab === 'Juego'}
              onPress={() => handleTabChange('Juego')}
            />
          <TabButton
            tabName="Ordenes"
            iconName="document-text"
            label="Orden"
            isSelected={activeTab === 'Ordenes'}
            onPress={() => handleTabChange('Ordenes')}
          />
        </BlurView>

        {/* Botón de Ajustes separado */}
        <BlurView intensity={15} style={styles.settingsContainer}>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              activeTab === 'Ajustes' ? styles.settingsButtonSelected : styles.settingsButtonUnselected
            ]}
            onPress={() => handleTabChange('Ajustes')}
          >
            <Ionicons 
              name="settings" 
              size={20} 
              color={activeTab === 'Ajustes' ? Colors.secundario : 'white'} 
            />
            <Text style={[styles.tabLabel, { color: activeTab === 'Ajustes' ? Colors.secundario : 'white' }]}>Ajustes</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
      </BlurView>
      
      <StatusBar style="light" />

      <Animated.View 
        style={[styles.modalOverlay, { opacity: overlayFadeAnim }]} 
        pointerEvents={showMusicaAddSongModal ? 'auto' : 'none'} 
      >
        <BlurView intensity={40} tint='dark' style={[StyleSheet.absoluteFillObject, styles.modalOverlayCentered]}> 
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar canción</Text>
            {selectedSongForModal && (
              <Text style={styles.modalMessage}>¿Agregar "{selectedSongForModal.titulo || selectedSongForModal.title}" a la lista de reproducción?</Text>
            )}
            {!selectedSongForModal && (
              <Text style={styles.modalMessage}>¿Agregar canción a la lista de reproduccion?</Text>
            )}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                onPress={handleCancelAddSongGlobal} 
                style={styles.modalButtonCancel}
                disabled={isAddingSong}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddSongGlobal} 
                style={[styles.modalButtonAdd, isAddingSong && styles.modalButtonDisabled]}
                disabled={isAddingSong}
              >
                {isAddingSong ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalButtonTextAdd}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Modal de confirmación para llamar al mesero */}
      <Animated.View 
        style={[styles.modalOverlay, { opacity: meseroOverlayFadeAnim }]} 
        pointerEvents={showMeseroModal ? 'auto' : 'none'} 
      >
        <BlurView intensity={40} tint='dark' style={[StyleSheet.absoluteFillObject, styles.modalOverlayCentered]}> 
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Llamar al mesero</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres llamar al mesero?</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity onPress={handleCancelMesero} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmMesero} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonTextAdd}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Modal de confirmación para pedir la cuenta */}
      <Animated.View 
        style={[styles.modalOverlay, { opacity: cuentaOverlayFadeAnim }]} 
        pointerEvents={showCuentaModal ? 'auto' : 'none'} 
      >
        <BlurView intensity={40} tint='dark' style={[StyleSheet.absoluteFillObject, styles.modalOverlayCentered]}> 
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cuenta solicitada</Text>
            <Text style={styles.modalMessage}>
              En un momento el mesero llevará la cuenta hasta tu mesa, gracias por tu visita.
            </Text>
            <View style={styles.heartIcon}>
              <FontAwesome  name="heart" size={24} color="black" />
            </View>
            <TouchableOpacity onPress={handleSalir} style={styles.modalButtonExit}>
              <Ionicons style={styles.iconosalir}  name="exit-outline" size={30} color="white" />
              <Text style={styles.modalButtonTextExit}>Salir</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {/* Modal de confirmación para salir del restaurante */}
      <Animated.View 
        style={[styles.modalOverlay, { opacity: exitRestaurantOverlayFadeAnim }]} 
        pointerEvents={showExitRestaurantModal ? 'auto' : 'none'} 
      >
        <BlurView intensity={40} tint='dark' style={[StyleSheet.absoluteFillObject, styles.modalOverlayCentered]}> 
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Salir del restaurante</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres salir del restaurante? Podrás volver a escanear el código QR para regresar.</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity onPress={handleCancelExitRestaurant} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmExitRestaurant} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonTextAdd}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {/* Modal de confirmación para cerrar sesión */}
      <Animated.View 
        style={[styles.modalOverlay, { opacity: logoutOverlayFadeAnim }]} 
        pointerEvents={showLogoutModal ? 'auto' : 'none'} 
      >
        <BlurView intensity={40} tint='dark' style={[StyleSheet.absoluteFillObject, styles.modalOverlayCentered]}> 
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a la aplicación.</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity onPress={handleCancelLogout} style={styles.modalButtonCancel}>
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmLogout} style={styles.modalButtonAdd}>
                <Text style={styles.modalButtonTextAdd}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <Toast message={toastMessage} visible={showToast} onHide={handleHideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 60
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    transform: [
      {scale: 1.1}
    ],
    left: 0,
    right: 0,
    bottom: 0,
    width: '110%',
    height: '150%',
    // zIndex: -1,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: Colors.fondo,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 40,
  },
  screenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 40,
  },
  hiddenScreen: {
    opacity: 0,
    zIndex: -1,
  },
  tabBar: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.tab,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.tabBorde,
    paddingVertical: 4,
    paddingHorizontal: 4,
    flex: 1,
    marginRight: 10,
    overflow: 'hidden'
  },
  settingsContainer: {
    borderRadius: 99,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  tabButtonSelected: {
    backgroundColor: Colors.tabSeleccionado,
    // backgroundColor: 'red',
  },
  tabButtonUnselected: {
    backgroundColor: 'transparent',
  },
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.tabBorde,
    minWidth: 80,
  },
  settingsButtonSelected: {
      backgroundColor: Colors.tabSeleccionado,
    },
    settingsButtonUnselected: {
      backgroundColor: Colors.tab,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Michroma-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlayCentered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Onest-Bold',
    color: 'black',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    color: Colors.texto,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButtonCancel: {
    backgroundColor: Colors.botonSecundario,
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalButtonTextCancel: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  modalButtonAdd: {
    backgroundColor: 'black',
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  modalButtonTextAdd: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Onest-Regular',
  },
  heartIcon: {
    // marginVertical: 10,
  },
  modalButtonExit: {
    backgroundColor: 'black',
    borderRadius: 99,
    paddingVertical: 12,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
    justifyContent: 'center'
  },
  iconosalir: {
    position: 'absolute',
    left: 20
  },
  modalButtonTextExit: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Onest-Regular',
    marginHorizontal: 20
  },
});

export default LayoutScreen;
