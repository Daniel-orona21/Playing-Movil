import Feather from '@expo/vector-icons/Feather';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

// Componente de barra de progreso
const ProgressBar = ({ startTime, duration, currentTime }) => {
  if (!startTime) return null;

  const elapsed = Math.floor((currentTime - startTime) / 1000);
  const progress = Math.min(elapsed / duration, 1);
  const isCompleted = progress >= 1;

  // Debug logs
  // console.log('ProgressBar Debug:', {
  //   elapsed,
  //   duration,
  //   progress: (progress * 100).toFixed(1) + '%',
  //   isCompleted
  // });

  const startTimeFormatted = startTime.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const endTime = new Date(startTime.getTime() + duration * 1000);
  const endTimeFormatted = endTime.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressWrapper}>
        {/* Círculo de inicio */}
        <View style={styles.progressCircle}>
          <Ionicons name="checkmark" size={16} color="black" />
        </View>
        
        {/* Barra de progreso */}
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress * 100}%` }
            ]} 
          />
        </View>
        
        {/* Círculo de fin */}
        <View style={[
          styles.progressCircle, 
          isCompleted ? styles.progressCircleCompleted : styles.progressCirclePending
        ]}>
          <Ionicons 
            name="restaurant" 
            size={16} 
            color={isCompleted ? "black" : "white"} 
          />
        </View>
      </View>
      
      {/* Tiempos */}
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>{startTimeFormatted}</Text>
        <Text style={styles.timeLabel}>{endTimeFormatted}</Text>
      </View>
      
      {/* Debug info - remover en producción
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Progreso: {(progress * 100).toFixed(1)}% | Tiempo transcurrido: {elapsed}s
        </Text>
      </View> */}
    </View>
  );
};

const OrdenesScreen = ({ onShowMeseroModalChange, onShowCuentaModalChange }) => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownIntervalRef = useRef(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [orderStartTime, setOrderStartTime] = useState(null);
  const [orderDuration, setOrderDuration] = useState(.1 * 60); // 15 minutos en segundos
  const [currentTime, setCurrentTime] = useState(new Date());
  const orderTimerRef = useRef(null);

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

  const handleSimularOrden = () => {
    const now = new Date();
    setOrderStartTime(now);
    setCurrentTime(now);
    setHasActiveOrder(true);
    
    // Iniciar timer de la orden
    orderTimerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
  };

  const getOrderProgress = () => {
    if (!orderStartTime) return 0;
    
    const elapsed = Math.floor((currentTime - orderStartTime) / 1000);
    const progress = Math.min(elapsed / orderDuration, 1);
    return progress;
  };

  const getOrderTimeInfo = () => {
    if (!orderStartTime) return { elapsed: 0, remaining: orderDuration, isCompleted: false };
    
    const elapsed = Math.floor((currentTime - orderStartTime) / 1000);
    const remaining = Math.max(orderDuration - elapsed, 0);
    const isCompleted = remaining === 0;
    
    return { elapsed, remaining, isCompleted };
  };

  const getOrderStatusInfo = () => {
    const { isCompleted } = getOrderTimeInfo();
    
    if (isCompleted) {
      return {
        title: "Orden entregada",
        subtitle: "¡Provecho!",
        statusText: "Entregada",
        showWaitTime: false,
        icon: "information-circle"
      };
    } else {
      return {
        title: "Orden realizada",
        subtitle: "Por favor espera, tu orden está siendo preparada",
        statusText: "En preparación",
        waitTime: "15 minutos",
        showWaitTime: true,
        icon: "information-circle-outline"
      };
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeFromDate = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handlePedirCuenta = () => {
    onShowCuentaModalChange(true);
  };

  // Cleanup del timer cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      if (orderTimerRef.current) {
        clearInterval(orderTimerRef.current);
      }
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      {!hasActiveOrder ? (
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
            <TouchableOpacity style={styles.boton1} onPress={handleSimularOrden}>
              <Ionicons style={styles.icono} name="timer-outline" size={24} color="rgba(255, 255, 255, 0.56)" />
              <Text style={styles.textoBtn}>Simular orden</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.contenidoConOrden}>
          <Text style={styles.tituloConOrden}>Tus órdenes</Text>
        <View style={styles.ordenYboton}>
        <View style={styles.ordenItem}>
            {(() => {
              const statusInfo = getOrderStatusInfo();
              return (
                <>
                  <Text style={styles.ordenTitulo}>{statusInfo.title}</Text>
                  <Text style={styles.ordenSubTitulo}>{statusInfo.subtitle}</Text>
                  <View style={styles.contenedorInfo}>
                  {statusInfo.showWaitTime && (
                    <View style={styles.contenedorOrden}>
                    <Ionicons name="timer-outline" size={24} color="white" />
                      <View style={styles.contenedorTexto}>
                        <Text style={styles.estadoTitulo}>Tiempo estimado de espera</Text>
                        <Text style={styles.estadoInfo}>{statusInfo.waitTime}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.contenedorOrden}>
                  <Ionicons name={statusInfo.icon} size={24} color="white" />
                    <View style={styles.contenedorTexto}>
                      <Text style={styles.estadoTitulo}>Estado de la orden</Text>
                      <Text style={styles.estadoInfo}>{statusInfo.statusText}</Text>
                    </View>
                  </View>
                  <View style={styles.contenedorOrden}>
                  <Feather name="dollar-sign" size={24} color="white" />
                    <View style={styles.contenedorTexto}>
                      <Text style={styles.estadoTitulo}>Total</Text>
                      <Text style={styles.estadoInfo}>$290</Text>
                    </View>
                  </View>
                  </View>
                   <View style={styles.contenedorOrden}>
                     <ProgressBar 
                       startTime={orderStartTime}
                       duration={orderDuration}
                       currentTime={currentTime}
                     />
                   </View>
                </>
              );
            })()}
            </View>
            {(() => {
              const statusInfo = getOrderStatusInfo();
              const { isCompleted } = getOrderTimeInfo();
              
              if (!isCompleted) {
                // Botonera durante preparación
                return (
                  <View style={styles.botoneraProgreso}>
                    <TouchableOpacity style={styles.boton3} onPress={abrirMenu}>
                      <MaterialCommunityIcons style={styles.icono2} name="book-open" size={20} color="rgba(255, 255, 255, 0.56)" />
                      <Text style={styles.textoBtn2}>Menú</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.boton2, 
                        isCooldownActive && styles.botonDeshabilitado
                      ]} 
                      onPress={handleLlamarMesero}
                      disabled={isCooldownActive}
                    >
                      <MaterialCommunityIcons 
                        style={styles.icono2} 
                        name={"human-greeting-variant"} 
                        size={20} 
                        color={isCooldownActive ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.56)"} 
                      />
                      <Text style={[
                        styles.textoBtn2,
                        isCooldownActive && styles.textoDeshabilitado
                      ]}>
                        {isCooldownActive ? `Esperar ${formatTime(cooldownTime)}` : 'Llamar mesero'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              } else {
                // Botonera cuando está entregada
                return (
                  <View style={styles.botoneraFinal}>
                    <View style={styles.menuYmesero}>
                      <TouchableOpacity style={styles.boton5} onPress={abrirMenu}>
                        <MaterialCommunityIcons name="book-open" size={20} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.boton4, 
                          isCooldownActive && styles.botonDeshabilitado
                        ]} 
                        onPress={handleLlamarMesero}
                        disabled={isCooldownActive}
                      >
                        <MaterialCommunityIcons 
                          name={"human-greeting-variant"} 
                          size={20} 
                          color={isCooldownActive ? "rgba(255, 255, 255, 0.56)" : "white"} 
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.botonCuenta} onPress={handlePedirCuenta}>
                      <Ionicons name="receipt" size={24} color="black" />
                      <Text style={styles.textoBtnCuenta}>Pedir la cuenta</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
            })()}
          </View>
        </View>
      )}
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
  botoneraProgreso: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.tab,
    borderRadius: 99,
    overflow: 'hidden'
  },
  botoneraFinal: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: 10
  },
  menuYmesero: {
    minWidth: 110,
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: Colors.tab,
    borderRadius: 99,
    overflow: 'hidden'
  },
  boton2: {
    flex:1,
    display: 'flex',
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: 'lime',
  },
  boton3: {
    flex:1,
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: 'lime',
    borderRightWidth: 1,
    borderRightColor: Colors.tab,
  },
  boton4: {
    flex:1,
    display: 'flex',
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center'
    // borderWidth: 1,
    // borderColor: 'lime',
    // borderRightWidth: 1,
    // borderRightColor: Colors.tab,
  },
  boton5: {
    flex:1,
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: 'lime',
    borderRightWidth: 1,
    borderRightColor: Colors.tab,
  },
  botonCuenta: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    padding: 15,
    borderRadius: 99,
    backgroundColor: 'white',
    alignItems: 'center'
  },
  icono: {
    position: 'absolute',
    left: 20,
  },
  icono2: {
    position: 'absolute',
    left: 10,
  },
  textoBtn: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
    fontSize: 20
  },
  textoBtnCuenta: {
    color: 'black',
    textAlign: 'center',
    flex: 1,
    fontSize: 20
  },
  textoBtn2: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
    fontSize: 16
  },
  botonDeshabilitado: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  textoDeshabilitado: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 18,
  },
  contenidoConOrden: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  tituloConOrden: {
    fontFamily: 'Michroma-Regular',
    fontWeight: '900',
    fontSize: 20,
    color: 'white',
    textAlign: 'left',
    marginBottom: 10,
    marginLeft: 20
  },
  ordenYboton: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    // borderWidth: 1,
    // borderColor: 'lime',
    justifyContent: 'space-between'
  },
  ordenItem: {
    backgroundColor: Colors.tab,
    borderRadius: 40,
    padding: 20,
    marginBottom: 15,
  },
  ordenTitulo: {
    fontFamily: 'Onest-Bold',
    fontSize: 18,
    color: Colors.textoPrincipal,
    marginBottom: 8,
  },
  ordenSubTitulo: {
    fontFamily: 'Onest-Regular',
    fontSize: 16,
    color: Colors.textoSecundario,
    marginBottom: 8,
    paddingHorizontal: 5
  },
  contenedorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  contenedorOrden: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap:10,
    paddingHorizontal: 5, 
  },
  contenedorTexto: {

  },
  estadoTitulo: {
    fontFamily: 'Onest-bold',
    color: 'white'
  },
  estadoInfo: {
    color: Colors.textoSecundario
  },
  progressContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  progressCircleCompleted: {
    backgroundColor: 'white',
  },
  progressCirclePending: {
    backgroundColor: '#666',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#444',
    marginHorizontal: -16,
    zIndex: 1,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
    minWidth: 0,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Onest-Regular',
  },
  debugInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  debugText: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'Onest-Regular',
  },
});

export default OrdenesScreen;
