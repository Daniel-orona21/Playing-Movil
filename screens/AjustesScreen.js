import Feather from '@expo/vector-icons/Feather';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch, TextInput } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { Colors } from '../constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState } from 'react';

const AjustesScreen = ({ navigation }) => {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('../assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('../assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('../assets/fonts/Onest-Bold.ttf'),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('Daniel');
  const [nombreTemporal, setNombreTemporal] = useState('Daniel');
  const [mostrarNombre1, setMostrarNombre1] = useState(true);
  const [mostrarNombre2, setMostrarNombre2] = useState(false);

  const handleEditar = () => {
    setNombreTemporal(nombre);
    setIsEditing(true);
  };

  const handleCancelar = () => {
    setNombreTemporal(nombre);
    setIsEditing(false);
  };

  const handleGuardar = () => {
    setNombre(nombreTemporal);
    setIsEditing(false);
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
            {!isEditing ? (
              <>
                <Text style={styles.nombre} numberOfLines={1} ellipsizeMode="tail">{nombre}</Text>
                <TouchableOpacity style={styles.botonEditar} onPress={handleEditar}>
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
                  />
                  <TouchableOpacity style={styles.botonCancelar} onPress={handleCancelar}>
                    <AntDesign name="close" size={22} color="white" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.botonEditar} onPress={handleGuardar}>
                  <Feather name="check" size={26} color={Colors.secundario} />
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
  }
});

export default AjustesScreen;
