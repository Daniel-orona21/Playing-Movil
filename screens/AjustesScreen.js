import Feather from '@expo/vector-icons/Feather';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch, TextInput, ActivityIndicator, Alert } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import AuthService from '../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AjustesScreen = ({ navigation, onShowExitRestaurantModalChange, onShowLogoutModalChange }) => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [nombreTemporal, setNombreTemporal] = useState('');
  const [mostrarNombre1, setMostrarNombre1] = useState(true);
  const [mostrarNombre2, setMostrarNombre2] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Cargar perfil del usuario al montar el componente
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const user = await AuthService.getProfile();
      if (user && user.nombre) {
        setNombre(user.nombre);
        setNombreTemporal(user.nombre);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    setNombreTemporal(nombre);
    setIsEditing(true);
  };

  const handleCancelar = () => {
    setNombreTemporal(nombre);
    setIsEditing(false);
  };

  const handleGuardar = async () => {
    if (!nombreTemporal.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '') || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ nombre: nombreTemporal.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNombre(nombreTemporal.trim());
        setIsEditing(false);
        Alert.alert('Éxito', 'Tu nombre ha sido actualizado');
      } else {
        throw new Error(data.error || 'Error al actualizar el nombre');
      }
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar tu nombre. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Modal handlers
  const handleShowExitRestaurantModal = () => {
    onShowExitRestaurantModalChange(true, async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/auth$/, '').replace(/\/$/, '') || 'http://localhost:3000/api';
        await fetch(`${API_URL}/establecimientos/leave`, {
          method: 'POST',
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
      } catch {}
      navigation.navigate('Qr');
    });
  };

  const handleShowLogoutModal = () => {
    onShowLogoutModalChange(true, async () => {
      try {
        await AuthService.signOut();
      } finally {
        navigation.navigate('Home');
      }
    });
  };


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
      <Text style={styles.titulo}>Preferencias</Text>
       <View style={styles.perfil}>
        {!isEditing && (
          <View style={styles.avatar}>
            <Feather name="user" size={30} color="white" />
          </View>
        )}
          <View style={styles.contenedorNombre}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.secundario} />
            ) : !isEditing ? (
              <>
                <Text style={styles.nombre} numberOfLines={1} ellipsizeMode="tail">{nombre || 'Sin nombre'}</Text>
                <TouchableOpacity style={styles.botonEditar} onPress={handleEditar} disabled={saving}>
                  <Feather name="edit" size={18} color="gray" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.contenedorInput}>
                  <TextInput 
                    placeholderTextColor="#999" 
                    style={styles.input} 
                    placeholder="Cambiar nombre"
                    value={nombreTemporal}
                    onChangeText={setNombreTemporal}
                    editable={!saving}
                  />
                  <TouchableOpacity style={styles.botonCancelar} onPress={handleCancelar} disabled={saving}>
                    <AntDesign name="close" size={22} color="white" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.botonEditar} onPress={handleGuardar} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.secundario} />
                  ) : (
                    <Feather name="check" size={26} color={Colors.secundario} />
                  )}
                </TouchableOpacity>
              </>
            )}
        </View>
      </View>
       <Text style={styles.titulo2}>Privacidad</Text>
       <View style={styles.contenedor}>
         <View style={styles.filaPreferencia}>
           <Text style={styles.textoPreferencia}>Mostrar mi nombre</Text>
           <Switch
             onValueChange={setMostrarNombre1}
             value={mostrarNombre1}
           />
         </View>
         <View style={styles.separador} />
         <View style={styles.filaPreferencia}>
           <Text style={styles.textoPreferencia}>Mostrar mi nombre</Text>
           <Switch
             onValueChange={setMostrarNombre2}
             value={mostrarNombre2}
           />
         </View>
       </View>

       <Text style={styles.titulo2}>Salir</Text>
       <View style={styles.contenedor}>
         <TouchableOpacity style={styles.filaPreferencia} onPress={handleShowExitRestaurantModal}>
           <View style={styles.actionItem}>
             {/* <Ionicons name="exit-outline" size={24} color="white" /> */}
             <Text style={styles.textoPreferencia}>Salir del restaurante</Text>
           </View>
           <Ionicons name="chevron-forward" size={20} color="#666" />
         </TouchableOpacity>
         <View style={styles.separador} />
         <TouchableOpacity style={styles.filaPreferencia} onPress={handleShowLogoutModal}>
           <View style={styles.actionItem}>
             {/* <Ionicons name="log-out-outline" size={24} color="white" /> */}
             <Text style={styles.textoPreferencia}>Cerrar sesión</Text>
           </View>
           <Ionicons name="chevron-forward" size={20} color="#666" />
         </TouchableOpacity>
       </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  titulo: {
    fontFamily: 'Onest-Bold',
    fontSize: 24,
    color: 'white',
  },
  titulo2: {
    marginTop: 30,
    fontFamily: 'Onest-Bold',
    fontSize: 18,
    color: 'white',
  },
   contenedor: {
     backgroundColor: Colors.contenedor,
     borderRadius: 30,
   },
   filaPreferencia: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 20,
     paddingVertical: 15,
   },
   textoPreferencia: {
     fontFamily: 'Onest-Regular',
     fontSize: 16,
     color: 'white',
   },
   separador: {
     height: 1,
     backgroundColor: '#333',
     marginLeft: 20,
   },
  containerPreferencias: {
    flex: 1,
    padding: 20,
  },
  perfil: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.contenedor,
    borderRadius: 99,
    padding: 10,
    height: 90,
  },
  avatar: {
    backgroundColor: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 99,
    overflow: 'hidden'
  },
  contenedorNombre: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: 'red',
    paddingRight: 10,
    flex: 1,
  },
  nombre: {
    fontFamily: 'Onest-Bold',
    fontSize: 24,
    color: 'white',
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  contenedorInput: {
    flex:1,
  },
  input: {
    flex:1,
    borderRadius:99,
    backgroundColor: Colors.tab,
    paddingVertical: 25,
    paddingLeft: 15,
    paddingRight: 45,
    color: 'white',
    fontSize: 16,
  },
  botonCancelar: {
    position: 'absolute',
    right: 19,
    top: '50%',
    transform: [
      {translateY: '-50%'}
    ]
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default AjustesScreen;
