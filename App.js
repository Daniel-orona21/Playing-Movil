import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { Colors } from './constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import QrScreen from './screens/QrScreen';
import LayoutScreen from './screens/LayoutScreen';
import AuthService from './services/AuthService';

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await AuthService.signInWithGoogle();
      if (result.success) {
        navigation.navigate('Qr');
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>PLAYING</Text>
      <Image source={require('./assets/imagenes/logo-10.png')} style={styles.logo} />
      <View style={styles.contenedorLogin}>
        <Text style={styles.subtitulo}>Inicia Sesión</Text>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <FontAwesome name="google" size={25} color="white" />
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Iniciando sesión...' : 'Continúa con Google'}
          </Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Michroma-Regular': require('./assets/fonts/Michroma-Regular.ttf'),
    'KaushanScript-Regular': require('./assets/fonts/KaushanScript-Regular.ttf'),
    'Onest-Regular': require('./assets/fonts/Onest-Regular.ttf'),
    'Onest-Bold': require('./assets/fonts/Onest-Bold.ttf'),
  });

  const [hasMesa, setHasMesa] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const hasAuth = await AuthService.loadStoredAuth();
      
      if (hasAuth) {
        try {
          // Verificar con el backend si el token y la mesa siguen siendo válidos
          const res = await AuthService.verifyToken();
          if (res && res.success && res.user && res.user.mesa_id_activa) {
            // Usuario autenticado CON mesa
            setIsAuthenticated(true);
            setHasMesa(true);
            // Actualizar datos locales con mesa activa
            await AuthService.storeAuthData(AuthService.getToken(), res.user);
          } else {
            // Usuario autenticado pero SIN mesa
            setIsAuthenticated(true);
            setHasMesa(false);
            // Actualizar datos locales sin mesa
            if (res && res.user) {
              const user = res.user;
              user.mesa_id_activa = null;
              await AuthService.storeAuthData(AuthService.getToken(), user);
            }
          }
        } catch (verifyError) {
          // Token inválido o error al verificar
          setIsAuthenticated(false);
          setHasMesa(false);
        }
      } else {
        // No autenticado, no tiene mesa
        setIsAuthenticated(false);
        setHasMesa(false);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setHasMesa(false);
    } finally {
      setIsLoading(false);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isLoading) {
    return null; // Mostrar splash screen mientras carga
  }

  const getInitialRoute = () => {
    if (hasMesa) return "Layout";
    // Si no tiene mesa pero está autenticado, ir a Qr
    if (isAuthenticated) return "Qr";
    // Si no está autenticado, ir a Home
    return "Home";
  };

  return (
    <NavigationContainer onLayout={onLayoutRootView}>
      <Stack.Navigator initialRouteName={getInitialRoute()}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Qr" component={QrScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Layout" 
          component={LayoutScreen} 
          options={{ 
            headerShown: true,
            headerTransparent: true,
            headerLeft: null,
            headerBackVisible: false,
            gestureEnabled: false,
            headerTitle: () => (
              <Text style={{
                fontFamily: 'KaushanScript-Regular',
                fontSize: 30,
                paddingBottom: 50,
                color: 'white'
              }}>
                Full Wings!
              </Text>
            ),
            headerStyle: {
              backgroundColor: 'transparent',
              borderWidth: 0,
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: 'white'
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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
    // fontWeight: '900',
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
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Onest-Regular',
    color: 'white'
  },
});