import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Button } from 'react-native';
import { Colors } from './constants/Colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

export default function App() {
  SplashScreen.preventAutoHideAsync();

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
      <View>
        <Text>Inicia Sesión</Text>
        <Button
          title="Continua con Google"
          onPress={() => {
            console.log('Botón presionado');
          }}
        />
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  logo: {
    position: 'absolute',
    marginTop: '100%',
    transform: [
      { scale: 1.05 }
    ],
    overflow: 'visible',
    width: '100%',
    objectFit: 'contain'
  }
});