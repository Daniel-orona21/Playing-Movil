import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Colors } from './constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import QrScreen from './screens/QrScreen';

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('./assets/fonts/Michroma-Regular.ttf'),
    'Onest-Regular': require('./assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('./assets/fonts/Onest-Bold.ttf'),
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
      <Text style={styles.titulo}>PLAYING</Text>
      <Image source={require('./assets/imagenes/logo-5.png')} style={styles.logo} />
      <View style={styles.contenedorLogin}>
        <Text style={styles.subtitulo}>Inicia Sesión</Text>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => {
            navigation.navigate('Qr');
          }}
        >
          <FontAwesome name="google" size={25} color="white" />
          <Text style={styles.googleButtonText}>Continúa con Google</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Qr" component={QrScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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
    fontSize: 24
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    padding: 20,
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