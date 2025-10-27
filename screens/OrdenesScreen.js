import Feather from '@expo/vector-icons/Feather';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/AuthService';
import OrdenesSocketService from '../services/OrdenesSocketService';

// Componente de barra de progreso
const ProgressBar = ({ startTime, duration, currentTime, isOrdenEntregada }) => {
  if (!startTime) return null;

  const elapsed = Math.floor((currentTime - startTime) / 1000);
  const progress = Math.min(elapsed / duration, 1);
  const isCompleted = isOrdenEntregada; // Cambiar solo si la orden está marcada como entregada

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
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const orderTimerRef = useRef(null);
  const [mesaActiva, setMesaActiva] = useState(null);

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

  // Cargar órdenes del usuario al montar el componente
  useEffect(() => {
    loadOrdenesUsuario();
    
    // Iniciar timer para actualizar tiempos (cada segundo para el progress bar)
    orderTimerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (orderTimerRef.current) {
        clearInterval(orderTimerRef.current);
      }
    };
  }, []);

  // Configurar listeners de sockets
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (!user) return;
    
    const userId = user.id_user || user.id; // Soportar ambos formatos
    
    // Obtener el establecimiento ID desde la mesa activa del cliente
    const setupSocket = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/establecimientos/activo`, {
          headers: {
            'Authorization': `Bearer ${AuthService.getToken()}`
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.establecimiento) {
          const establecimientoId = data.establecimiento.id_establecimiento;
          OrdenesSocketService.connect(establecimientoId);
          
          // Listener para nuevas órdenes
          OrdenesSocketService.on('orden_created', (ordenData) => {
            // Verificar si la orden es para este usuario
            if (ordenData.usuario_id === userId) {
              loadOrdenesUsuario();
            }
          });
          
          // Listener para órdenes actualizadas
          OrdenesSocketService.on('orden_updated', () => {
            loadOrdenesUsuario();
          });
          
          // Listener para órdenes eliminadas
          OrdenesSocketService.on('ordenes_deleted', () => {
            loadOrdenesUsuario();
          });
        }
      } catch (error) {
        console.error('Error al configurar socket:', error);
      }
    };

    setupSocket();

    // Cleanup al desmontar
    return () => {
      OrdenesSocketService.disconnect();
    };
  }, []);

  const loadOrdenesUsuario = async () => {
    try {
      setIsLoading(true);
      const token = AuthService.getToken();
      const response = await OrdenesSocketService.getOrdenesUsuario(token);
      
      if (response.success) {
        setOrders(response.ordenes || []);
      }
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular el tiempo restante dinámicamente basándose en la fecha de creación
  // Usa tiempo_estimado + tiempo_anadido para el cálculo correcto
  const calcularTiempoRestante = (orden) => {
    const fechaCreacion = new Date(orden.creada_en);
    const ahora = new Date();
    const minutosTranscurridos = Math.floor((ahora.getTime() - fechaCreacion.getTime()) / 60000);
    const tiempoTotal = orden.tiempo_estimado + (orden.tiempo_anadido || 0);
    const tiempoRestante = Math.max(tiempoTotal - minutosTranscurridos, 0);
    return tiempoRestante;
  };

  const getOrderStatusInfo = (orden) => {
    const estadoMap = {
      'pendiente': 'Pendiente',
      'en_preparacion': 'En preparación',
      'entregada': 'Entregada',
      'pagada': 'Pagada'
    };

    const estadoMostrar = estadoMap[orden.status] || orden.status;
    const tiempoRestante = calcularTiempoRestante(orden);
    const isCompleted = orden.status === 'entregada' || orden.status === 'pagada';
    
    if (isCompleted) {
      return {
        title: "Orden entregada",
        subtitle: "¡Provecho!",
        statusText: "Entregada",
        showWaitTime: false,
        icon: "information-circle",
        tiempoRestante: 0,
        isCompleted: true
      };
    } else {
      return {
        title: "Orden realizada",
        subtitle: "Por favor espera, tu orden está siendo preparada",
        statusText: estadoMostrar,
        waitTime: `${tiempoRestante} minutos`,
        showWaitTime: true,
        icon: "information-circle-outline",
        tiempoRestante: tiempoRestante,
        isCompleted: false
      };
    }
  };

  const getOrderProgress = (orden) => {
    const fechaCreacion = new Date(orden.creada_en);
    const tiempoTotal = orden.tiempo_estimado + (orden.tiempo_anadido || 0);
    const tiempoOriginalSegundos = tiempoTotal * 60;
    const elapsed = Math.floor((currentTime.getTime() - fechaCreacion.getTime()) / 1000);
    const progress = Math.min(elapsed / tiempoOriginalSegundos, 1);
    return progress;
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

  // Mostrar loading mientras carga
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10 }}>Cargando órdenes...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  // Filtrar órdenes activas (no pagadas)
  const ordenesActivas = orders.filter(o => o.status !== 'pagada');

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      {ordenesActivas.length === 0 ? (
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
          </View>
        </View>
      ) : (
        <>
        <View style={styles.contenedorScroll}>
          <ScrollView style={styles.contenidoConOrden} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tituloConOrden}>Tus órdenes ({ordenesActivas.length})</Text>
            
            {ordenesActivas.map((orden) => {
              const statusInfo = getOrderStatusInfo(orden);
              const fechaCreacion = new Date(orden.creada_en);
              // Usar tiempo total (estimado + añadido) para el progress bar
              const tiempoTotal = orden.tiempo_estimado + (orden.tiempo_anadido || 0);
              const tiempoTotalSegundos = tiempoTotal * 60;
              
              return (
                <View key={orden.id_orden} style={styles.ordenItem}>
                <View key={orden.id_orden} style={styles.ordenHeader}>
                <Text style={styles.ordenTitulo}>{statusInfo.title}</Text>
                  {orden.numero_orden && (
                    <Text style={styles.ordenSubTitulo2}>#{orden.numero_orden}</Text>
                  )}
                  </View>
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
                        <Text style={styles.estadoInfo}>${orden.total_monto}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.contenedorOrden}>
                    <ProgressBar 
                      startTime={fechaCreacion}
                      duration={tiempoTotalSegundos}
                      currentTime={currentTime}
                      isOrdenEntregada={orden.status === 'entregada' || orden.status === 'pagada'}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
          </View>

          {/* Botonera única en la parte inferior */}
          {ordenesActivas.some(o => o.status === 'entregada') ? (
            // Botonera cuando hay al menos una orden entregada
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
          ) : (
            // Botonera cuando todas están en preparación
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
          )}
        </>
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
    position: 'absolute',
    bottom: 5,
    left: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'row',
    width: 'auto',
    backgroundColor: Colors.tab,
    borderRadius: 99,
    overflow: 'hidden'
  },
  botoneraFinal: {
    position: 'absolute',
    bottom: 5,
    left: 20,
    right: 20,
    width: 'auto',
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
    padding: 10,
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
  scrollContent: {
    backgroundColor: 'transparent',
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
  ordenHeader: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ordenTitulo: {
    fontFamily: 'Onest-Bold',
    fontSize: 18,
    color: Colors.textoPrincipal,
  },
  ordenSubTitulo: {
    fontFamily: 'Onest-Regular',
    fontSize: 16,
    color: Colors.textoSecundario,
    marginBottom: 8,
    paddingHorizontal: 5
  },
   ordenSubTitulo2: {
    fontFamily: 'Onest-Regular',
    fontSize: 16,
    color: Colors.textoSecundario,
    marginBottom: 0,
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
  contenedorScroll: {
    display: 'flex',
    flex: 1,
    maxHeight: '89%'
  },
});

export default OrdenesScreen;
